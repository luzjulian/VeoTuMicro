const prisma = require('../config/prisma');
const { hashPassword, verifyPassword }                        = require('../lib/password');
const { signAccessToken, generateRefreshToken, hashRefreshToken, parseExpiresInToMs } = require('../lib/tokens');
const { ConflictError, UnauthorizedError, NotFoundError }     = require('../lib/http-errors');
const { env } = require('../config/env');

// ─── Helpers internos ─────────────────────────────────────────────────────────

const emitirTokens = async (cuenta, rol) => {
  const accessToken          = signAccessToken(cuenta, rol);
  const accessTokenExpiresAt = new Date(Date.now() + parseExpiresInToMs(env.JWT_ACCESS_EXPIRES_IN));

  const refreshToken          = generateRefreshToken();
  const refreshTokenExpiresAt = new Date(Date.now() + parseExpiresInToMs(env.JWT_REFRESH_EXPIRES_IN));

  await prisma.refreshToken.create({
    data: {
      tokenHash: hashRefreshToken(refreshToken),
      cuentaOid: cuenta.oid,
      expiresAt: refreshTokenExpiresAt,
    },
  });

  return { accessToken, accessTokenExpiresAt, refreshToken, refreshTokenExpiresAt };
};

const resolverRol = async (personaOid) => {
  if (await prisma.chofer.findUnique({ where: { personaOid } }))         return 'chofer';
  if (await prisma.pasajero.findUnique({ where: { personaOid } }))       return 'pasajero';
  if (await prisma.administrativo.findUnique({ where: { personaOid } })) return 'administrativo';
  throw new NotFoundError('El usuario no tiene un rol asignado');
};

const DUMMY_HASH = '$2b$12$1Uh9BsrhDzktXsmkLZlB5ejomBEVoHbEtFvty.pDh4PDs2T7nU0F.';

// ─── Funciones exportadas ─────────────────────────────────────────────────────

const login = async ({ nombreUsuario, contrasenia }) => {
  const cuenta = await prisma.cuenta.findUnique({ where: { nombreUsuario } });

  const hashAComparar = cuenta?.contrasenia ?? DUMMY_HASH;
  const passwordOk    = await verifyPassword(contrasenia, hashAComparar);

  if (!cuenta || !passwordOk) {
    throw new UnauthorizedError('Credenciales inválidas');
  }

  const rol    = await resolverRol(cuenta.personaOid);
  const tokens = await emitirTokens(cuenta, rol);

  return { ...tokens, nombreUsuario: cuenta.nombreUsuario, rol };
};

// Solo los pasajeros pueden registrarse desde la app.
// Los administrativos y choferes son cargados directamente en la BD.
const register = async ({ dni, nombreUsuario, contrasenia, nombreApellido, fechaNacimiento, certificadoDiscapacidad }) => {

  const existeUsuario = await prisma.cuenta.findUnique({ where: { nombreUsuario } });
  if (existeUsuario) throw new ConflictError('El nombre de usuario ya está en uso');

  const hash = await hashPassword(contrasenia);

  await prisma.$transaction(async (tx) => {
    const persona = await tx.persona.create({
      data: { dni, nombreApellido, fechaNacimiento: new Date(fechaNacimiento) },
    });

    await tx.cuenta.create({
      data: { dni, nombreUsuario, contrasenia: hash, personaOid: persona.oid },
    });

    await tx.pasajero.create({
      data: {
        personaOid:              persona.oid,
        certificadoDiscapacidad: certificadoDiscapacidad,
        adminOid:                null, // pendiente de validación por un administrativo
      },
    });
  });

  return { message: 'Usuario registrado correctamente' };
};

const refresh = async (rawRefreshToken) => {
  const tokenHash = hashRefreshToken(rawRefreshToken);

  const stored = await prisma.refreshToken.findUnique({
    where:   { tokenHash },
    include: { cuenta: true },
  });

  const esValido = stored && !stored.revokedAt && stored.expiresAt > new Date();

  if (!esValido) {
    throw new UnauthorizedError('Refresh token inválido o expirado');
  }

  await prisma.refreshToken.update({
    where: { id: stored.id },
    data:  { revokedAt: new Date() },
  });

  const rol    = await resolverRol(stored.cuenta.personaOid);
  const tokens = await emitirTokens(stored.cuenta, rol);

  return { ...tokens, nombreUsuario: stored.cuenta.nombreUsuario, rol };
};

const logout = async (rawRefreshToken) => {
  const tokenHash = hashRefreshToken(rawRefreshToken);

  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data:  { revokedAt: new Date() },
  });
};

module.exports = { login, register, refresh, logout };
const prisma = require('../config/prisma');
const { verifyPassword }                                      = require('../lib/password');
const { signAccessToken, generateRefreshToken, hashRefreshToken, parseExpiresInToMs } = require('../lib/tokens');
const { UnauthorizedError, NotFoundError }                    = require('../lib/http-errors');
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

// `identificador` es el email que escribe la persona en el login (o un nombreUsuario de las
// cuentas anteriores). Las cuentas nuevas usan el email como nombreUsuario; las cargadas a mano
// (choferes, administrativos) pueden tener otro nombreUsuario y el email en Persona.
const login = async ({ identificador, contrasenia }) => {
  const cuenta = await prisma.cuenta.findFirst({
    where: {
      OR: [
        { nombreUsuario: identificador },
        { persona: { email: identificador } },
      ],
    },
  });

  const hashAComparar = cuenta?.contrasenia ?? DUMMY_HASH;
  const passwordOk    = await verifyPassword(contrasenia, hashAComparar);

  if (!cuenta || !passwordOk) {
    throw new UnauthorizedError('Credenciales inválidas');
  }

  const rol    = await resolverRol(cuenta.personaOid);
  const tokens = await emitirTokens(cuenta, rol);

  return { ...tokens, nombreUsuario: cuenta.nombreUsuario, rol };
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

module.exports = { login, refresh, logout };
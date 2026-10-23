// backend/src/services/perfil.service.js
//
// Perfil de la persona logueada. La identidad SIEMPRE sale del token (cuentaOid = req.usuario.sub),
// nunca de un parámetro del request: así nadie puede pedir ni modificar el perfil de otra persona.

const prisma = require('../config/prisma');
const storage = require('../lib/storage');
const { NotFoundError, ConflictError, UnauthorizedError } = require('../lib/http-errors');
const { toPerfilDTO } = require('../domain/perfil');

const cargarCuenta = async (cuentaOid) => {
  const cuenta = await prisma.cuenta.findUnique({
    where: { oid: Number(cuentaOid) },
    include: {
      persona: {
        include: {
          telefonos:      { orderBy: { oid: 'asc' } },
          pasajero:       true,
          chofer:         true,
          administrativo: true,
        },
      },
    },
  });
  if (!cuenta) throw new UnauthorizedError('La sesión ya no es válida');
  return cuenta;
};

const obtenerPerfil = async (cuentaOid) => {
  const cuenta = await cargarCuenta(cuentaOid);
  const pasajero = cuenta.persona.pasajero;

  // La solicitud de origen se busca por la clave del PDF (no por email): sirve para el nombre
  // original del archivo y la fecha de carga. Las cuentas del seed no tienen solicitud.
  const solicitud = pasajero
    ? await prisma.solicitudRegistro.findFirst({ where: { certificadoKey: pasajero.certificadoDiscapacidad } })
    : null;

  return toPerfilDTO(cuenta, solicitud);
};

const actualizarPerfil = async (cuentaOid, datos) => {
  const cuenta = await cargarCuenta(cuentaOid);
  const { persona } = cuenta;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.persona.update({
        where: { oid: persona.oid },
        data:  { nombre: datos.nombre, apellido: datos.apellido, email: datos.email },
      });

      // En las cuentas de pasajeros el email ES el nombre de usuario con el que se entra.
      // Si eran iguales, se mantienen iguales (los choferes con otro nombreUsuario no se tocan).
      if (cuenta.nombreUsuario === persona.email) {
        await tx.cuenta.update({ where: { oid: cuenta.oid }, data: { nombreUsuario: datos.email } });
      }

      // Teléfono: vacío borra, con valor actualiza el primero o lo crea.
      const actual = persona.telefonos[0];
      if (datos.telefono === '') {
        if (actual) await tx.telefono.delete({ where: { oid: actual.oid } });
      } else if (actual) {
        await tx.telefono.update({ where: { oid: actual.oid }, data: { nroTelefono: datos.telefono } });
      } else {
        await tx.telefono.create({ data: { nroTelefono: datos.telefono, personaOid: persona.oid } });
      }
    });
  } catch (err) {
    if (err?.code === 'P2002') throw new ConflictError('Ya existe una cuenta con ese email');
    throw err;
  }

  return obtenerPerfil(cuentaOid);
};

const abrirCertificado = async (cuentaOid) => {
  const cuenta = await cargarCuenta(cuentaOid);
  const pasajero = cuenta.persona.pasajero;
  if (!pasajero) throw new NotFoundError('Tu cuenta no tiene certificado');

  let archivo = null;
  try {
    archivo = await storage.abrir(pasajero.certificadoDiscapacidad);
  } catch {
    // clave con formato inválido (datos viejos de prueba): se trata como "no disponible"
  }
  if (!archivo) throw new NotFoundError('El archivo del certificado no está disponible');

  return { ...archivo, oid: pasajero.oid };
};

module.exports = { obtenerPerfil, actualizarPerfil, abrirCertificado };
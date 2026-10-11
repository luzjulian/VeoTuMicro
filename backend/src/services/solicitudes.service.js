// backend/src/services/solicitudes.service.js
//
// Solicitudes de registro de pasajeros:
//   - crearSolicitud: lo llama el registro (guarda datos + PDF, estado PENDIENTE)
//   - listar / abrirCertificado: panel administrativo
//   - aceptar / rechazar: el administrativo resuelve; se avisa por mail a la persona
//
// Regla central: el usuario NO existe hasta que se acepta la solicitud.

const prisma = require('../config/prisma');
const storage = require('../lib/storage');
const { hashPassword } = require('../lib/password');
const { ConflictError, NotFoundError, ForbiddenError } = require('../lib/http-errors');
const { FRONT_A_ESTADO, toSolicitudDTO } = require('../domain/solicitud');
const mail = require('./mail.service');
const { emitirKpis } = require('./kpis.service');

// ─── Helpers internos ─────────────────────────────────────────────────────────

// El mail nunca debe revertir una decisión ya guardada en la base:
// si falla, se registra el error y se informa con mailEnviado: false.
const enviarMail = async (fn, datos) => {
  try {
    await fn(datos);
    return true;
  } catch (err) {
    console.error(`[mail] no se pudo enviar el mail a ${datos.email}:`, err.message);
    return false;
  }
};

const esViolacionDeUnico = (err) => err?.code === 'P2002';

// Recibe el oid de la Cuenta (sub del token) y devuelve el Administrativo dueño de esa cuenta.
const obtenerAdministrativo = async (cuentaOid) => {
  const admin = await prisma.administrativo.findFirst({
    where: { persona: { cuenta: { oid: Number(cuentaOid) } } },
  });
  if (!admin) throw new ForbiddenError('Tu cuenta no tiene un perfil administrativo');
  return admin;
};

// ─── Registro ─────────────────────────────────────────────────────────────────

/**
 * @param {object} p
 * @param {{nombre:string,email:string,password:string,dni?:string,fechaNacimiento?:string}} p.datos  ya validados por Zod
 * @param {import('multer').File} p.archivo  PDF ya guardado por multer
 * @param {import('socket.io').Server} [p.io]
 */
const crearSolicitud = async ({ datos, archivo, io }) => {
  const { nombre, apellido, email, password, dni, fechaNacimiento } = datos;

  const coincidencias = [{ email }, ...(dni ? [{ dni }] : [])];

  const [cuenta, persona, pendiente] = await Promise.all([
    prisma.cuenta.findUnique({ where: { nombreUsuario: email } }),
    prisma.persona.findFirst({ where: { OR: coincidencias } }),
    prisma.solicitudRegistro.findFirst({ where: { estado: 'PENDIENTE', OR: coincidencias } }),
  ]);

  if (cuenta || persona || pendiente) {
    throw new ConflictError('Ya existe una cuenta o una solicitud en curso con esos datos');
  }

  const contraseniaHash = await hashPassword(password);

  const solicitud = await prisma.solicitudRegistro.create({
    data: {
      nombreApellido:    apellido ? `${nombre} ${apellido}` : nombre,
      nombre:            apellido ? nombre : null,
      apellido:          apellido ?? null,
      dni:               dni ?? null,
      fechaNacimiento:   fechaNacimiento ? new Date(fechaNacimiento) : null,
      email,
      contraseniaHash,
      certificadoKey:    archivo.filename,
      certificadoNombre: archivo.originalname,
    },
  });

  if (io) {
    io.to('admins').emit('solicitud:nueva', toSolicitudDTO(solicitud));
    emitirKpis(io);
  }

  return toSolicitudDTO(solicitud);
};

// ─── Panel administrativo ─────────────────────────────────────────────────────

const listar = async ({ estado } = {}) => {
  const solicitudes = await prisma.solicitudRegistro.findMany({
    where:   estado ? { estado: FRONT_A_ESTADO[estado] } : undefined,
    orderBy: { createdAt: 'desc' },
  });
  return solicitudes.map(toSolicitudDTO);
};

const abrirCertificado = async (oid) => {
  const solicitud = await prisma.solicitudRegistro.findUnique({ where: { oid } });
  if (!solicitud) throw new NotFoundError('Solicitud no encontrada');

  const archivo = await storage.abrir(solicitud.certificadoKey);
  if (!archivo) throw new NotFoundError('El archivo del certificado ya no está disponible');

  return { ...archivo, oid: solicitud.oid };
};

/**
 * Acepta la solicitud: en UNA transacción marca la solicitud y crea Persona, Cuenta y Pasajero.
 * Después (fuera de la transacción) avisa por mail.
 */
const aceptar = async ({ oid, cuentaOid, io }) => {
  const admin = await obtenerAdministrativo(cuentaOid);

  let solicitud;
  try {
    solicitud = await prisma.$transaction(async (tx) => {
      const existente = await tx.solicitudRegistro.findUnique({ where: { oid } });
      if (!existente) throw new NotFoundError('Solicitud no encontrada');

      // "Reclamar" la solicitud solo si sigue pendiente: evita que dos admins la resuelvan a la vez.
      const { count } = await tx.solicitudRegistro.updateMany({
        where: { oid, estado: 'PENDIENTE' },
        data:  { estado: 'ACEPTADA', resueltaAt: new Date(), adminOid: admin.oid },
      });
      if (count === 0) throw new ConflictError('La solicitud ya fue resuelta');

      const persona = await tx.persona.create({
        data: {
          dni:             existente.dni,
          nombreApellido:  existente.nombreApellido,
          fechaNacimiento: existente.fechaNacimiento,
          email:           existente.email,
        },
      });

      // El email es el nombre de usuario (el login del front pide email).
      await tx.cuenta.create({
        data: {
          dni:         existente.dni,
          nombreUsuario: existente.email,
          contrasenia: existente.contraseniaHash,
          personaOid:  persona.oid,
        },
      });

      await tx.pasajero.create({
        data: {
          personaOid:              persona.oid,
          certificadoDiscapacidad: existente.certificadoKey,
          adminOid:                admin.oid,
        },
      });

      return tx.solicitudRegistro.findUnique({ where: { oid } });
    });
  } catch (err) {
    if (esViolacionDeUnico(err)) {
      throw new ConflictError('Ya existe un usuario con ese email o DNI');
    }
    throw err;
  }

  const mailEnviado = await enviarMail(mail.enviarAprobacion, {
    email:  solicitud.email,
    nombre: solicitud.nombreApellido,
  });

  emitirKpis(io);

  return { ...toSolicitudDTO(solicitud), mailEnviado };
};

/**
 * Rechaza la solicitud. Como no se creó ningún usuario, la persona puede volver a registrarse.
 * El archivo PDF se conserva (queda el historial de la solicitud rechazada).
 */
const rechazar = async ({ oid, cuentaOid, io }) => {
  const admin = await obtenerAdministrativo(cuentaOid);

  const { count } = await prisma.solicitudRegistro.updateMany({
    where: { oid, estado: 'PENDIENTE' },
    data:  { estado: 'RECHAZADA', resueltaAt: new Date(), adminOid: admin.oid },
  });

  if (count === 0) {
    const existe = await prisma.solicitudRegistro.findUnique({ where: { oid }, select: { oid: true } });
    if (!existe) throw new NotFoundError('Solicitud no encontrada');
    throw new ConflictError('La solicitud ya fue resuelta');
  }

  const solicitud = await prisma.solicitudRegistro.findUnique({ where: { oid } });

  const mailEnviado = await enviarMail(mail.enviarRechazo, {
    email:  solicitud.email,
    nombre: solicitud.nombreApellido,
  });

  emitirKpis(io);

  return { ...toSolicitudDTO(solicitud), mailEnviado };
};

module.exports = { crearSolicitud, listar, abrirCertificado, aceptar, rechazar };

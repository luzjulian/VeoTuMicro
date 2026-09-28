// backend/src/services/viajes.service.js

const prisma = require('../config/prisma');
const { getArribos } = require('../lib/arribosService');
const {
  AppError,
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} = require('../lib/http-errors');

// ---------------------------------------------------------------------------
// Helpers internos
// ---------------------------------------------------------------------------

/**
 * Busca el Chofer activo que conduce la línea/ramal indicados,
 * identificado por DNI. Retorna el chofer con sus relaciones incluidas.
 */
const buscarChoferActivo = async (dniChofer, nroLinea, ramal) => {
  const chofer = await prisma.chofer.findFirst({
    where: {
      persona: { dni: dniChofer },
      conduce: {
        some: {
          fechaHoraFin: null,
          linea: { nroLinea, ramal },
        },
      },
    },
    include: {
      conduce: {
        where: {
          fechaHoraFin: null,
          linea: { nroLinea, ramal },
        },
        include: { linea: true },
      },
      persona: {
        include: { cuenta: true },
      },
    },
  });

  if (!chofer || chofer.conduce.length === 0) {
    throw new AppError(
      503,
      `No se encontró un conductor activo con DNI ${dniChofer} para la línea ${nroLinea}-${ramal}`
    );
  }

  return chofer;
};

/**
 * Busca un Viaje por su oid (Int) incluyendo todas las relaciones
 * necesarias para las operaciones de confirmación / rechazo.
 */
const buscarViaje = async (nroViaje) => {
  const viaje = await prisma.viaje.findUnique({
    where: { oid: nroViaje },
    include: {
      parada: true,
      pasajero: {
        include: {
          persona: {
            include: { cuenta: true },
          },
        },
      },
      conduce: {
        include: {
          linea: true,
          chofer: {
            include: {
              persona: {
                include: { cuenta: true },
              },
            },
          },
        },
      },
    },
  });

  if (!viaje) {
    throw new NotFoundError(`No existe el viaje con número ${nroViaje}`);
  }

  return viaje;
};

// ---------------------------------------------------------------------------
// Casos de uso
// ---------------------------------------------------------------------------

/**
 * UC1 – Iniciar Viaje (Actor: Pasajero)
 *
 * 1. Consulta el mock para obtener el primer arribo disponible.
 * 2. Localiza el Conduce activo del chofer en la BD.
 * 3. Crea el Viaje en estado PENDIENTE.
 * 4. Notifica al conductor vía Socket.io.
 * 5. Retorna el número de solicitud.
 */
const iniciarViaje = async ({ cuentaOid, idempotencyKey, nroParada, nroLinea, ramal, destino, io }) => {
  // Recuperar pasajero a partir de la cuenta autenticada
  const cuenta = await prisma.cuenta.findUnique({
    where: { oid: cuentaOid },
    include: {
      persona: {
        include: { pasajero: true },
      },
    },
  });

  const nombrePasajero = cuenta?.persona?.nombreApellido ?? 'Pasajero';

  const pasajero = cuenta?.persona?.pasajero;
  if (!pasajero) {
    throw new ForbiddenError('Tu cuenta no tiene un perfil de pasajero');
  }

  // Deduplicación por idempotency key — si el viaje ya fue creado, devolverlo
  const viajeExistente = await prisma.viaje.findUnique({
    where: { idempotencyKey },
    include: {
      parada:  true,
      conduce: { include: { linea: true } },
    },
  });
  if (viajeExistente) {
    return {
      nroViaje:  viajeExistente.oid,
      estado:    viajeExistente.estado,
      destino:   viajeExistente.destino,
      nroParada: viajeExistente.parada.nroParada,
      nroLinea:  viajeExistente.conduce.linea.nroLinea,
      ramal:     viajeExistente.conduce.linea.ramal,
    };
  }

  // Verificar parada en la BD
  const parada = await prisma.paradaAscenso.findUnique({
    where: { nroParada },
  });
  if (!parada) {
    throw new NotFoundError(`La parada ${nroParada} no existe en el sistema`);
  }

  // Consultar mock de próximos arribos
  const arribos = await getArribos(nroParada, nroLinea, ramal);
  const primerArribo = arribos[0];

  // Localizar conductor activo en la BD
  const chofer = await buscarChoferActivo(primerArribo.dniChofer, nroLinea, ramal);
  const conduceOid = chofer.conduce[0].oid;

  // Crear viaje en PENDIENTE
  const viaje = await prisma.viaje.create({
    data: {
      idempotencyKey,
      destino,
      paradaOid:   parada.oid,
      pasajeroOid: pasajero.oid,
      conduceOid,
      estado:      'PENDIENTE',
    },
  });

  // Notificar al conductor (patrón Observer vía Socket.io)
  const conductorUsername = chofer.persona.cuenta?.nombreUsuario;
  if (conductorUsername) {
    io.to(`conductor:${conductorUsername}`).emit('nueva:solicitud', {
      nroViaje:       viaje.oid,
      parada:         nroParada,
      paradaLatitud:  parada.latitud,
      paradaLongitud: parada.longitud,
      destino,
      pasajero:       nombrePasajero,
    });
  }

  return {
    nroViaje: viaje.oid,
    estado:   'PENDIENTE',
    destino,
    nroParada,
    nroLinea,
    ramal,
  };
};

/**
 * UC2 – Confirmar Viaje (Actor: Conductor)
 *
 * 1. Verifica que el viaje existe y está en PENDIENTE.
 * 2. Valida que el conductor autenticado es el asignado al viaje.
 * 3. Actualiza estado a CONFIRMADO.
 * 4. Notifica al pasajero con el tiempo estimado de arribo.
 */
const confirmarViaje = async ({ cuentaOid, nroViaje, io }) => {
  const viaje = await buscarViaje(nroViaje);

  if (viaje.estado !== 'PENDIENTE') {
    throw new BadRequestError(
      `El viaje no puede confirmarse: estado actual es ${viaje.estado}`
    );
  }

  // Validar que el conductor autenticado es el dueño del conduce
  const cuentaAsignada = viaje.conduce.chofer.persona.cuenta;
  if (!cuentaAsignada || cuentaAsignada.oid !== cuentaOid) {
    throw new ForbiddenError('No tenés permiso para confirmar este viaje');
  }

  // Obtener estimadoArribo desde el mock
  const { nroLinea, ramal } = viaje.conduce.linea;
  const { nroParada } = viaje.parada;
  const dniChofer = viaje.conduce.chofer.persona.dni;
  const arribos = await getArribos(nroParada, nroLinea, ramal);
  const arribo = arribos.find((a) => a.dniChofer === dniChofer);
  const estimadoArribo = arribo?.estimadoArribo ?? null;

  // Actualizar estado
  await prisma.viaje.update({
    where: { oid: nroViaje },
    data:  { estado: 'CONFIRMADO' },
  });

  // Notificar al pasajero (patrón Observer)
  const pasajeroUsername = viaje.pasajero.persona.cuenta?.nombreUsuario;
  if (pasajeroUsername) {
    io.to(`pasajero:${pasajeroUsername}`).emit('viaje:confirmado', {
      nroViaje,
      estimadoArribo, // minutos
    });
  }

  return { estado: 'CONFIRMADO', estimadoArribo };
};

/**
 * UC3 – Rechazar Viaje (Actor: Conductor)
 *
 * 1. Verifica que el viaje existe y está en PENDIENTE.
 * 2. Valida que el conductor autenticado es el asignado.
 * 3. Busca el siguiente conductor disponible en el mock.
 * 4a. Si hay siguiente: reasigna conduce y notifica al nuevo conductor.
 * 4b. Si no hay siguiente: cancela el viaje y notifica al pasajero.
 */
const rechazarViaje = async ({ cuentaOid, nroViaje, io }) => {
  const viaje = await buscarViaje(nroViaje);

  if (viaje.estado !== 'PENDIENTE') {
    throw new BadRequestError(
      `El viaje no puede rechazarse: estado actual es ${viaje.estado}`
    );
  }

  // Validar conductor autenticado
  const cuentaAsignada = viaje.conduce.chofer.persona.cuenta;
  if (!cuentaAsignada || cuentaAsignada.oid !== cuentaOid) {
    throw new ForbiddenError('No tenés permiso para rechazar este viaje');
  }

  const { nroLinea, ramal } = viaje.conduce.linea;
  const { nroParada } = viaje.parada;
  const dniChoferActual = viaje.conduce.chofer.persona.dni;

  // Buscar siguiente conductor en el mock
  const arribos = await getArribos(nroParada, nroLinea, ramal);
  const idxActual = arribos.findIndex((a) => a.dniChofer === dniChoferActual);
  const siguienteArribo = idxActual !== -1 ? arribos[idxActual + 1] : undefined;

  const pasajeroUsername = viaje.pasajero.persona.cuenta?.nombreUsuario;

  if (!siguienteArribo) {
    // No hay más conductores → cancelar viaje
    await prisma.viaje.update({
      where: { oid: nroViaje },
      data:  { estado: 'CANCELADO', fechaHoraFin: new Date() },
    });

    if (pasajeroUsername) {
      io.to(`pasajero:${pasajeroUsername}`).emit('viaje:cancelado', {
        nroViaje,
        mensaje: 'No hay conductores disponibles en este momento. Intentá de nuevo más tarde.',
      });
    }

    return { estado: 'CANCELADO', reasignado: false };
  }

  // Buscar el nuevo conductor activo en la BD
  const nuevoChofer = await buscarChoferActivo(
    siguienteArribo.dniChofer,
    nroLinea,
    ramal
  );
  const nuevoConduceOid = nuevoChofer.conduce[0].oid;

  // Reasignar el viaje al nuevo conductor
  await prisma.viaje.update({
    where: { oid: nroViaje },
    data:  { conduceOid: nuevoConduceOid },
  });

  // Notificar al nuevo conductor
  const nuevoUsername = nuevoChofer.persona.cuenta?.nombreUsuario;
  if (nuevoUsername) {
    io.to(`conductor:${nuevoUsername}`).emit('nueva:solicitud', {
      nroViaje,
      parada:  nroParada,
      destino: viaje.destino,
    });
  }

  return { estado: 'PENDIENTE', reasignado: true };
};

/**
 * UC4 – Confirmar Ascenso (Actor: Pasajero)
 *
 * El pasajero confirma que subió al colectivo.
 * 1. Verifica viaje y estado CONFIRMADO.
 * 2. Valida que el pasajero autenticado es el dueño del viaje.
 * 3. Actualiza estado a ABORDO.
 * 4. Notifica al conductor.
 */
const confirmarAscenso = async ({ cuentaOid, nroViaje, io }) => {
  const viaje = await buscarViaje(nroViaje);

  if (viaje.estado !== 'CONFIRMADO') {
    throw new BadRequestError(
      `No podés confirmar el ascenso: el estado del viaje es ${viaje.estado}`
    );
  }

  // Validar que el pasajero autenticado es el dueño del viaje
  const cuentaPasajero = viaje.pasajero.persona.cuenta;
  if (!cuentaPasajero || cuentaPasajero.oid !== cuentaOid) {
    throw new ForbiddenError('No tenés permiso para confirmar el ascenso de este viaje');
  }

  await prisma.viaje.update({
    where: { oid: nroViaje },
    data:  { estado: 'ABORDO' },
  });

  // Notificar al conductor que el pasajero subió
  const conductorUsername = viaje.conduce.chofer.persona.cuenta?.nombreUsuario;
  if (conductorUsername) {
    io.to(`conductor:${conductorUsername}`).emit('pasajero:abordo', {
      nroViaje,
      destino:  viaje.destino,
      pasajero: viaje.pasajero.persona?.nombreApellido ?? 'Pasajero',
    });
  }

  return { estado: 'ABORDO' };
};

module.exports = {
  iniciarViaje,
  confirmarViaje,
  rechazarViaje,
  confirmarAscenso,
};
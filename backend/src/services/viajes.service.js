// backend/src/services/viajes.service.js

const prisma = require('../config/prisma');
const { nombreCompleto } = require('../domain/persona');
const { getArribos } = require('../lib/arribosService');
const {
  AppError,
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} = require('../lib/http-errors');

// ---------------------------------------------------------------------------
// Constantes de dominio
// ---------------------------------------------------------------------------

/**
 * Estados desde los que el pasajero todavía puede cancelar su solicitud.
 * Una vez ABORDO el viaje está en curso y lo cierra el conductor con el
 * descenso; FINALIZADO y CANCELADO son terminales.
 */
const ESTADOS_CANCELABLES = ['PENDIENTE', 'CONFIRMADO'];

/**
 * Estados de un viaje que todavía está en curso: el pasajero sigue dentro del
 * flujo y tiene que poder volver a su pantalla si recarga la página.
 */
const ESTADOS_EN_CURSO = ['PENDIENTE', 'CONFIRMADO', 'ABORDO'];

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

// Viajes a los que ya se les avisó la proximidad de la parada de descenso.
// Evita re-emitir el evento si el request se reintenta (red inestable, doble
// click). Vive en memoria: se vacía si el server reinicia y no se comparte entre
// instancias. Para un solo server alcanza; si el proyecto escala, pasar a la BD.
const proximidadNotificada = new Set();

/**
 * Transición de estado atómica.
 *
 * `prisma.viaje.update` solo acepta campos únicos en el WHERE (oid), así que
 * un chequeo de estado hecho antes, en JavaScript, deja una ventana entre la
 * lectura y la escritura: otro request puede cambiar el estado en el medio y
 * el update lo pisa igual (lost update).
 *
 * `updateMany` sí admite el estado en el WHERE, y la base resuelve el
 * check-and-set en una sola sentencia. `count` dice si ganamos la transición:
 *   count === 1 → la hicimos nosotros, y somos los únicos que notificamos.
 *   count === 0 → o ya no era válida, o perdimos la carrera; releemos el
 *                 estado real para distinguir un reintento (idempotente) de
 *                 un pedido inválido (400).
 *
 * @param {number}   nroViaje
 * @param {string[]} desde  estados desde los que la transición es válida
 * @param {string}   a      estado destino
 * @param {object}   [extra] otros campos a escribir junto con el estado
 * @returns {Promise<{ganado: boolean, estadoActual?: string}>}
 */
const transicionar = async (nroViaje, desde, a, extra = {}) => {
  const { count } = await prisma.viaje.updateMany({
    where: { oid: nroViaje, estado: { in: desde } },
    data:  { estado: a, ...extra },
  });

  if (count > 0) return { ganado: true };

  const actual = await prisma.viaje.findUnique({
    where:  { oid: nroViaje },
    select: { estado: true },
  });

  return { ganado: false, estadoActual: actual?.estado };
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

  const nombrePasajero = nombreCompleto(cuenta.persona)  || 'Pasajero';

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

  // La pertenencia del viaje no cambia en el tiempo: validarla sobre la
  // lectura previa es seguro. El estado sí cambia, y por eso viaja en el WHERE.
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

  // Transición atómica: si el pasajero canceló mientras llegaba este pedido,
  // la cancelación ya movió el estado y acá count === 0.
  const { ganado, estadoActual } = await transicionar(nroViaje, ['PENDIENTE'], 'CONFIRMADO');

  if (!ganado) {
    // Ya estaba confirmado: casi seguro un reintento de red del mismo pedido.
    if (estadoActual === 'CONFIRMADO') {
      return { estado: 'CONFIRMADO', estimadoArribo, notificado: false };
    }
    throw new BadRequestError(
      `El viaje no puede confirmarse: estado actual es ${estadoActual}`
    );
  }

  // Notificar al pasajero (patrón Observer)
  const pasajeroUsername = viaje.pasajero.persona.cuenta?.nombreUsuario;
  if (pasajeroUsername) {
    io.to(`pasajero:${pasajeroUsername}`).emit('viaje:confirmado', {
      nroViaje,
      estimadoArribo, // minutos
    });
  }

  return { estado: 'CONFIRMADO', estimadoArribo, notificado: true };
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
    // No hay más conductores → cancelar viaje (transición atómica)
    const { ganado, estadoActual } = await transicionar(
      nroViaje,
      ['PENDIENTE'],
      'CANCELADO',
      { fechaHoraFin: new Date() }
    );

    if (!ganado) {
      if (estadoActual === 'CANCELADO') {
        return { estado: 'CANCELADO', reasignado: false, notificado: false };
      }
      throw new BadRequestError(
        `El viaje no puede rechazarse: estado actual es ${estadoActual}`
      );
    }

    if (pasajeroUsername) {
      io.to(`pasajero:${pasajeroUsername}`).emit('viaje:cancelado', {
        nroViaje,
        mensaje: 'No hay conductores disponibles en este momento. Intentá de nuevo más tarde.',
      });
    }

    return { estado: 'CANCELADO', reasignado: false, notificado: true };
  }

  // Buscar el nuevo conductor activo en la BD
  const nuevoChofer = await buscarChoferActivo(
    siguienteArribo.dniChofer,
    nroLinea,
    ramal
  );
  const nuevoConduceOid = nuevoChofer.conduce[0].oid;

  // Reasignar al nuevo conductor. Esta transición NO cambia el estado, así que
  // el estado solo no detecta un lost update: si dos rechazos del mismo
  // conductor llegan juntos, ambos verían PENDIENTE y se saltearía un
  // conductor de la lista. El guard es el conduce sobre el que se decidió.
  const { count } = await prisma.viaje.updateMany({
    where: { oid: nroViaje, estado: 'PENDIENTE', conduceOid: viaje.conduceOid },
    data:  { conduceOid: nuevoConduceOid },
  });

  if (count === 0) {
    const actual = await prisma.viaje.findUnique({
      where:  { oid: nroViaje },
      select: { estado: true, conduceOid: true },
    });

    // Otro request ya lo reasignó a este mismo conductor: reintento, no error.
    if (actual?.estado === 'PENDIENTE' && actual.conduceOid === nuevoConduceOid) {
      return { estado: 'PENDIENTE', reasignado: true, notificado: false };
    }

    throw new BadRequestError(
      `El viaje no puede rechazarse: estado actual es ${actual?.estado}`
    );
  }

  // Notificar al nuevo conductor. El payload debe ser idéntico al de
  // iniciarViaje: sin las coordenadas el panel no puede geocodificar la parada
  // y muestra el nroParada crudo, y sin el nombre muestra "Pasajero".
  const nuevoUsername = nuevoChofer.persona.cuenta?.nombreUsuario;
  if (nuevoUsername) {
    io.to(`conductor:${nuevoUsername}`).emit('nueva:solicitud', {
      nroViaje,
      parada:         nroParada,
      paradaLatitud:  viaje.parada.latitud,
      paradaLongitud: viaje.parada.longitud,
      destino:        viaje.destino,
      pasajero:       nombreCompleto(viaje.pasajero.persona) || 'Pasajero',
    });
  }

  return { estado: 'PENDIENTE', reasignado: true, notificado: true };
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

  // Validar que el pasajero autenticado es el dueño del viaje
  const cuentaPasajero = viaje.pasajero.persona.cuenta;
  if (!cuentaPasajero || cuentaPasajero.oid !== cuentaOid) {
    throw new ForbiddenError('No tenés permiso para confirmar el ascenso de este viaje');
  }

  // Transición atómica: el conductor pudo rechazar o cancelar en el ínterin.
  const { ganado, estadoActual } = await transicionar(nroViaje, ['CONFIRMADO'], 'ABORDO');

  if (!ganado) {
    if (estadoActual === 'ABORDO') {
      return { estado: 'ABORDO', notificado: false };
    }
    throw new BadRequestError(
      `No podés confirmar el ascenso: el estado del viaje es ${estadoActual}`
    );
  }

  // Notificar al conductor que el pasajero subió
  const conductorUsername = viaje.conduce.chofer.persona.cuenta?.nombreUsuario;
  if (conductorUsername) {
    io.to(`conductor:${conductorUsername}`).emit('pasajero:abordo', {
      nroViaje,
      destino:  viaje.destino,
      pasajero: nombreCompleto(viaje.pasajero.persona) || 'Pasajero',
    });
  }

  return { estado: 'ABORDO', notificado: true };
};

/**
 * UC5 – Notificar Proximidad (Actor: Conductor)
 *
 * Simula el aviso "te estás acercando a tu parada de descenso".
 * En un caso real lo dispararía el GPS; acá se expone como endpoint.
 * 1. Verifica viaje y estado ABORDO.
 * 2. Valida que el conductor autenticado es el asignado al viaje.
 * 3. Notifica al pasajero (una sola vez por viaje: idempotente).
 */
const notificarProximidad = async ({ cuentaOid, nroViaje, io }) => {
  const viaje = await buscarViaje(nroViaje);

  const cuentaAsignada = viaje.conduce.chofer.persona.cuenta;
  if (!cuentaAsignada || cuentaAsignada.oid !== cuentaOid) {
    throw new ForbiddenError('No tenés permiso para notificar este viaje');
  }

  if (viaje.estado !== 'ABORDO') {
    throw new BadRequestError(
      `No se puede notificar la proximidad: el estado del viaje es ${viaje.estado}`
    );
  }

  // Idempotencia: un reintento no vuelve a avisarle al pasajero.
  if (proximidadNotificada.has(nroViaje)) {
    return { notificado: false, mensaje: 'La proximidad ya había sido notificada' };
  }

  const pasajeroUsername = viaje.pasajero.persona.cuenta?.nombreUsuario;
  if (pasajeroUsername) {
    io.to(`pasajero:${pasajeroUsername}`).emit('viaje:proximidad', {
      nroViaje,
      mensaje: 'Te estás acercando a tu parada de descenso',
    });
  }

  proximidadNotificada.add(nroViaje);

  return { notificado: true, mensaje: 'Notificación de proximidad enviada' };
};

/**
 * UC6 – Confirmar Descenso (Actor: Conductor)
 *
 * El conductor confirma que el pasajero bajó del colectivo.
 * 1. Verifica el viaje y que el conductor autenticado es el asignado.
 * 2. Si ya estaba FINALIZADO devuelve 200 sin volver a notificar (idempotente:
 *    es casi seguro un reintento de red del mismo pedido).
 * 3. Si no está en ABORDO es un pedido sin sentido → 400.
 * 4. Actualiza estado a FINALIZADO y notifica al pasajero.
 */
const confirmarDescenso = async ({ cuentaOid, nroViaje, io }) => {
  const viaje = await buscarViaje(nroViaje);

  const cuentaAsignada = viaje.conduce.chofer.persona.cuenta;
  if (!cuentaAsignada || cuentaAsignada.oid !== cuentaOid) {
    throw new ForbiddenError('No tenés permiso para confirmar el descenso de este viaje');
  }

  // Transición atómica. Si ya estaba FINALIZADO devuelve 200 sin volver a
  // notificar: es casi seguro un reintento de red del mismo pedido.
  const { ganado, estadoActual } = await transicionar(
    nroViaje,
    ['ABORDO'],
    'FINALIZADO',
    { fechaHoraFin: new Date() }
  );

  if (!ganado) {
    if (estadoActual === 'FINALIZADO') {
      return { estado: 'FINALIZADO', notificado: false };
    }
    throw new BadRequestError(
      `No se puede confirmar el descenso: el estado del viaje es ${estadoActual}`
    );
  }

  // El viaje terminó: ya no hace falta recordar su aviso de proximidad.
  proximidadNotificada.delete(nroViaje);

  const pasajeroUsername = viaje.pasajero.persona.cuenta?.nombreUsuario;
  if (pasajeroUsername) {
    io.to(`pasajero:${pasajeroUsername}`).emit('descenso:confirmado', {
      nroViaje,
      mensaje: 'El conductor confirmó tu descenso',
    });
  }

  return { estado: 'FINALIZADO', notificado: true };
};

/**
 * UC7 – Cancelar Viaje (Actor: Pasajero)
 *
 * El pasajero se arrepiente antes de subir al colectivo.
 * 1. Verifica que el viaje existe (404).
 * 2. Valida que el pasajero autenticado es el dueño del viaje (403).
 *    Se chequea ANTES que el estado para no filtrar información de un
 *    viaje ajeno en el mensaje de error.
 * 3. Transiciona a CANCELADO de forma atómica (ver nota abajo).
 * 4. Notifica al conductor para que libere el cupo.
 *
 * Es idempotente: si el viaje ya estaba CANCELADO devuelve 200 con
 * notificado=false y no vuelve a emitir el evento.
 */
const cancelarViaje = async ({ cuentaOid, nroViaje, io }) => {
  const viaje = await buscarViaje(nroViaje);

  // La pertenencia del viaje no cambia en el tiempo, así que validarla sobre
  // la lectura previa es seguro (a diferencia del estado, ver abajo).
  const cuentaPasajero = viaje.pasajero.persona.cuenta;
  if (!cuentaPasajero || cuentaPasajero.oid !== cuentaOid) {
    throw new ForbiddenError('No tenés permiso para cancelar este viaje');
  }

  // Transición atómica (ver `transicionar`): el estado viaja en el WHERE para
  // que la BD arbitre la carrera contra un conductor confirmando o rechazando
  // en paralelo.
  const { ganado, estadoActual } = await transicionar(
    nroViaje,
    ESTADOS_CANCELABLES,
    'CANCELADO',
    { fechaHoraFin: new Date() }
  );

  if (!ganado) {
    if (estadoActual === 'CANCELADO') {
      return { estado: 'CANCELADO', notificado: false };
    }
    throw new BadRequestError(
      `El viaje no puede cancelarse: estado actual es ${estadoActual}`
    );
  }

  // Notificar al conductor para que saque la solicitud de su bandeja
  const conductorUsername = viaje.conduce.chofer.persona.cuenta?.nombreUsuario;
  let notificado = false;
  if (conductorUsername) {
    io.to(`conductor:${conductorUsername}`).emit('solicitud:cancelada', {
      nroViaje,
      parada:   viaje.parada.nroParada,
      destino:  viaje.destino,
      pasajero: nombreCompleto(viaje.pasajero.persona) || 'Pasajero',
      mensaje:  'El pasajero canceló la solicitud',
    });
    notificado = true;
  }

  return { estado: 'CANCELADO', notificado };
};

/**
 * UC8 – Recuperar el viaje en curso (Actor: Pasajero)
 *
 * El front mantiene el viaje en memoria, así que al recargar la página (o al
 * reconectar después de perder la red) pierde el nroViaje y expulsa al
 * pasajero al inicio del flujo. Este endpoint le permite preguntar por su
 * viaje activo y volver a la pantalla donde estaba.
 *
 * Devuelve null si no hay viaje en curso — no es un error.
 *
 * Incluye estimadoArribo porque la cuenta regresiva del front es client-side y
 * la arranca el evento viaje:confirmado, que ya se disparó y no se repite: sin
 * este dato el pasajero volvería a la espera con el ETA vacío y nunca recibiría
 * el aviso de arribo.
 */
const obtenerViajeActivo = async ({ cuentaOid }) => {
  const viaje = await prisma.viaje.findFirst({
    where: {
      estado:   { in: ESTADOS_EN_CURSO },
      pasajero: { persona: { cuenta: { oid: cuentaOid } } },
    },
    // Si por algún motivo hubiera más de uno, el más reciente es el relevante.
    orderBy: { fechaHoraInicio: 'desc' },
    include: {
      parada:  true,
      conduce: {
        include: {
          linea:  true,
          chofer: { include: { persona: true } },
        },
      },
    },
  });

  if (!viaje) return null;

  const { nroLinea, ramal } = viaje.conduce.linea;
  const { nroParada, latitud, longitud } = viaje.parada;

  // El ETA solo tiene sentido mientras el colectivo viene en camino.
  let estimadoArribo = null;
  if (viaje.estado === 'CONFIRMADO') {
    try {
      const dniChofer = viaje.conduce.chofer.persona.dni;
      const arribos   = await getArribos(nroParada, nroLinea, ramal);
      estimadoArribo = arribos.find((a) => a.dniChofer === dniChofer)?.estimadoArribo ?? null;
    } catch {
      // El mock de arribos puede no tener datos para esta combinación. No es
      // motivo para fallar la recuperación: el pasajero vuelve a su pantalla
      // con el ETA vacío, que es mejor que quedar fuera del viaje.
      estimadoArribo = null;
    }
  }

  return {
    nroViaje: viaje.oid,
    estado:   viaje.estado,
    destino:  viaje.destino,
    nroParada,
    paradaLatitud:  latitud,
    paradaLongitud: longitud,
    nroLinea,
    ramal,
    estimadoArribo,
  };
};

/**
 * UC9 – Recuperar las solicitudes en curso (Actor: Conductor)
 *
 * La bandeja del panel del conductor se alimenta solo de eventos de Socket.io
 * y arranca vacía, así que al recargar la página el conductor pierde de vista
 * los viajes que tiene asignados — incluido el botón para confirmar el
 * descenso de un pasajero que ya está a bordo.
 *
 * Devuelve los viajes en curso de los conduce activos del chofer autenticado,
 * del más reciente al más antiguo.
 */
const obtenerViajesActivosDeChofer = async ({ cuentaOid }) => {
  const viajes = await prisma.viaje.findMany({
    where: {
      estado:  { in: ESTADOS_EN_CURSO },
      conduce: {
        // Solo los conduce todavía abiertos: un viaje de un turno ya cerrado
        // no le corresponde a este chofer en su jornada actual.
        fechaHoraFin: null,
        chofer: { persona: { cuenta: { oid: cuentaOid } } },
      },
    },
    orderBy: { fechaHoraInicio: 'desc' },
    include: {
      parada:   true,
      pasajero: { include: { persona: true } },
      conduce:  { include: { linea: true } },
    },
  });

  return viajes.map((v) => ({
    nroViaje:       v.oid,
    estado:         v.estado,
    destino:        v.destino,
    nroParada:      v.parada.nroParada,
    paradaLatitud:  v.parada.latitud,
    paradaLongitud: v.parada.longitud,
    nroLinea:       v.conduce.linea.nroLinea,
    ramal:          v.conduce.linea.ramal,
    pasajero:       nombreCompleto(v.pasajero.persona) || 'Pasajero',
    fechaHoraInicio: v.fechaHoraInicio,
  }));
};

module.exports = {
  iniciarViaje,
  confirmarViaje,
  rechazarViaje,
  confirmarAscenso,
  notificarProximidad,
  confirmarDescenso,
  cancelarViaje,
  obtenerViajeActivo,
  obtenerViajesActivosDeChofer,
};
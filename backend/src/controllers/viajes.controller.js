// backend/src/controllers/viajes.controller.js

const viajesService = require('../services/viajes.service');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extrae el oid de la cuenta del JWT (el campo `sub` es string) */
const getCuentaOid = (req) => parseInt(req.usuario.sub, 10);

/** Extrae el nroViaje ya validado y parseado por el middleware validate() */
const getNroViaje = (req) => req.validated.params.nroViaje;

/** Obtiene la instancia de Socket.io adjunta en server.js */
const getIo = (req) => req.app.get('io');

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

/**
 * POST /api/viajes
 * Rol requerido: pasajero
 *
 * Body (validado por Zod en la ruta):
 *   { nroParada, nroLinea, ramal, destino }
 *
 * Respuesta 201:
 *   { nroViaje }
 */
const iniciarViaje = async (req, res, next) => {
  try {
    const { nroParada, nroLinea, ramal, destino } = req.validated.body;

    const resultado = await viajesService.iniciarViaje({
      cuentaOid:      getCuentaOid(req),
      idempotencyKey: req.idempotencyKey,   // adjuntado por requireIdempotencyKey
      nroParada,
      nroLinea,
      ramal,
      destino,
      io: getIo(req),
    });

    res
      .status(201)
      .set('Location', `/api/viajes/${resultado.nroViaje}`)
      .json(resultado);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/viajes/:nroViaje/confirmar
 * Rol requerido: chofer
 *
 * Params: nroViaje (Int, oid autoincremental del viaje)
 *
 * Respuesta 200:
 *   { estado: 'CONFIRMADO', estimadoArribo: number | null }
 *   + Socket event 'viaje:confirmado' al pasajero
 */
const confirmarViaje = async (req, res, next) => {
  try {
    const resultado = await viajesService.confirmarViaje({
      cuentaOid: getCuentaOid(req),
      nroViaje:  getNroViaje(req),
      io:        getIo(req),
    });

    res.status(200).json(resultado);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/viajes/:nroViaje/rechazar
 * Rol requerido: chofer
 *
 * Params: nroViaje (Int, oid autoincremental del viaje)
 *
 * Respuesta 200:
 *   { estado: 'PENDIENTE' | 'CANCELADO', reasignado: boolean }
 *   + Socket event 'nueva:solicitud' al próximo conductor (si reasignado)
 *   O Socket event 'viaje:cancelado' al pasajero si no hay más conductores
 */
const rechazarViaje = async (req, res, next) => {
  try {
    const resultado = await viajesService.rechazarViaje({
      cuentaOid: getCuentaOid(req),
      nroViaje:  getNroViaje(req),
      io:        getIo(req),
    });

    res.status(200).json(resultado);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/viajes/:nroViaje/abordo
 * Rol requerido: pasajero
 *
 * Params: nroViaje (Int, oid autoincremental del viaje)
 *
 * Respuesta 200:
 *   { estado: 'ABORDO' }
 *   + Socket event 'pasajero:abordo' al conductor
 */
const confirmarAscenso = async (req, res, next) => {
  try {
    const resultado = await viajesService.confirmarAscenso({
      cuentaOid: getCuentaOid(req),
      nroViaje:  getNroViaje(req),
      io:        getIo(req),
    });

    res.status(200).json(resultado);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/viajes/:nroViaje/proximidad
 * Rol requerido: chofer
 *
 * Respuesta 200:
 *   { notificado: boolean, mensaje: string }
 *   + Socket event 'viaje:proximidad' al pasajero (solo la primera vez)
 */
const notificarProximidad = async (req, res, next) => {
  try {
    const resultado = await viajesService.notificarProximidad({
      cuentaOid: getCuentaOid(req),
      nroViaje:  getNroViaje(req),
      io:        getIo(req),
    });

    res.status(200).json(resultado);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/viajes/:nroViaje/descenso
 * Rol requerido: chofer
 *
 * Respuesta 200:
 *   { estado: 'FINALIZADO' }
 *   + Socket event 'descenso:confirmado' al pasajero (solo la primera vez)
 */
const confirmarDescenso = async (req, res, next) => {
  try {
    const resultado = await viajesService.confirmarDescenso({
      cuentaOid: getCuentaOid(req),
      nroViaje:  getNroViaje(req),
      io:        getIo(req),
    });

    res.status(200).json(resultado);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  iniciarViaje,
  confirmarViaje,
  rechazarViaje,
  confirmarAscenso,
  notificarProximidad,
  confirmarDescenso,
};
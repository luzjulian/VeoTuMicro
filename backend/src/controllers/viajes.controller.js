// backend/src/controllers/viajes.controller.js

const viajesService = require('../services/viajes.service');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extrae el oid de la cuenta del JWT (el campo `sub` es string) */
const getCuentaOid = (req) => parseInt(req.usuario.sub, 10);

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
      cuentaOid: getCuentaOid(req),
      nroParada,
      nroLinea,
      ramal,
      destino,
      io: getIo(req),
    });

    res.status(201).json(resultado);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/viajes/:nroViaje/confirmar
 * Rol requerido: chofer
 *
 * Params: nroViaje (el numeroSolicitud UUID)
 *
 * Respuesta 200:
 *   { ok: true }
 *   + Socket event 'viaje:confirmado' al pasajero
 */
const confirmarViaje = async (req, res, next) => {
  try {
    const resultado = await viajesService.confirmarViaje({
      cuentaOid: getCuentaOid(req),
      nroViaje:  req.params.nroViaje,
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
 * Params: nroViaje (el numeroSolicitud UUID)
 *
 * Respuesta 200:
 *   { ok: true, reasignado: boolean }
 *   + Socket event 'nueva:solicitud' al próximo conductor
 *   O Socket event 'viaje:cancelado' al pasajero si no hay más conductores
 */
const rechazarViaje = async (req, res, next) => {
  try {
    const resultado = await viajesService.rechazarViaje({
      cuentaOid: getCuentaOid(req),
      nroViaje:  req.params.nroViaje,
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
 * Params: nroViaje (el numeroSolicitud UUID)
 *
 * Respuesta 200:
 *   { ok: true }
 *   + Socket event 'pasajero:abordo' al conductor
 */
const confirmarAscenso = async (req, res, next) => {
  try {
    const resultado = await viajesService.confirmarAscenso({
      cuentaOid: getCuentaOid(req),
      nroViaje:  req.params.nroViaje,
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
};
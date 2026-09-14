const authService = require('../services/auth.service');
const {
  setRefreshCookie,
  clearRefreshCookie,
  setAccessCookie,
  clearAccessCookie,
  REFRESH_COOKIE_NAME,
} = require('../lib/auth-cookies');
const { UnauthorizedError } = require('../lib/http-errors');

// Los controllers solo traducen HTTP <-> servicio.
// Ninguna regla de negocio (hashing, revocación, roles) vive acá.

const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.validated.body);
    setAccessCookie(res, result.accessToken, result.accessTokenExpiresAt);
    setRefreshCookie(res, result.refreshToken, result.refreshTokenExpiresAt);
    res.status(200).json({ nombreUsuario: result.nombreUsuario, rol: result.rol });
  } catch (err) {
    next(err);
  }
};

const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.validated.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

const refresh = async (req, res, next) => {
  try {
    const rawRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!rawRefreshToken) throw new UnauthorizedError('Falta el refresh token');

    const result = await authService.refresh(rawRefreshToken);
    setAccessCookie(res, result.accessToken, result.accessTokenExpiresAt);
    setRefreshCookie(res, result.refreshToken, result.refreshTokenExpiresAt);
    res.status(200).json({ nombreUsuario: result.nombreUsuario, rol: result.rol });
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    const rawRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (rawRefreshToken) await authService.logout(rawRefreshToken);
    clearAccessCookie(res);
    clearRefreshCookie(res);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

module.exports = { login, register, refresh, logout };
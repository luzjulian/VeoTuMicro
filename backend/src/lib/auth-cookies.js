const { env } = require('../config/env');

const isProduction = env.NODE_ENV === 'production';

// Con `path: '/api/auth'` el navegador solo manda el refresh cookie a /api/auth/*.
// El access token hace falta en todas las rutas protegidas (/api/viajes, etc.),
// por eso su path es '/api' directamente.
const REFRESH_COOKIE_NAME = 'refreshToken';
const ACCESS_COOKIE_NAME  = 'accessToken';
const REFRESH_COOKIE_PATH = '/api/auth';
const ACCESS_COOKIE_PATH  = '/api';

const cookieBase = {
  httpOnly: true,              // ningún script del navegador puede leerla, aunque haya XSS
  secure:   isProduction,      // en producción solo se manda por HTTPS
  sameSite: 'strict',          // no viaja en requests cross-site → mitiga CSRF
};

const setRefreshCookie = (res, token, expiresAt) => {
  res.cookie(REFRESH_COOKIE_NAME, token, { ...cookieBase, path: REFRESH_COOKIE_PATH, expires: expiresAt });
};

const clearRefreshCookie = (res) => {
  res.clearCookie(REFRESH_COOKIE_NAME, { ...cookieBase, path: REFRESH_COOKIE_PATH });
};

const setAccessCookie = (res, token, expiresAt) => {
  res.cookie(ACCESS_COOKIE_NAME, token, { ...cookieBase, path: ACCESS_COOKIE_PATH, expires: expiresAt });
};

const clearAccessCookie = (res) => {
  res.clearCookie(ACCESS_COOKIE_NAME, { ...cookieBase, path: ACCESS_COOKIE_PATH });
};

module.exports = {
  REFRESH_COOKIE_NAME,
  ACCESS_COOKIE_NAME,
  setRefreshCookie,
  clearRefreshCookie,
  setAccessCookie,
  clearAccessCookie,
};
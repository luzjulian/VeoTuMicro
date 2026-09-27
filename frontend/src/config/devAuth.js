// src/config/devAuth.js
//
// Usuarios de desarrollo para bypassear el módulo de auth mientras
// sigue en construcción. Los OIDs (sub) corresponden al orden de inserción
// del seed (ver backend/prisma/seed.js).
//
// ⚠️  Verificá los OIDs reales en Adminer (localhost:8080):
//      Tabla: Cuenta — columna oid — nombreUsuario
// ─────────────────────────────────────────────────────────────────────────────

export const DEV_USERS = {
  pasajero: {
    sub: '2',                       // oid de pasajero.ana en la BD
    nombreUsuario: 'pasajero.ana',
    rol: 'pasajero',
  },
  chofer: {
    sub: '4',                       // oid de chofer.carlos en la BD (línea 307-A)
    nombreUsuario: 'chofer.carlos',
    rol: 'chofer',
  },
};
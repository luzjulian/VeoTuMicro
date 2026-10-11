// backend/src/lib/storage.js
//
// Único lugar del proyecto que sabe DÓNDE se guardan los certificados.
// Hoy es una carpeta del servidor; si el equipo decide pasar a S3 u otro servicio,
// se cambia solo este archivo (guardar / abrir / borrar) y nada más.
//
// Seguridad: la "clave" de un archivo la genera SIEMPRE el servidor (uuid.pdf).
// Nunca se arma una ruta con texto que venga del usuario, así no hay recorrido de directorios.

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { env } = require('../config/env');

const DIRECTORIO = path.resolve(process.cwd(), env.UPLOADS_DIR);

// uuid v4 + ".pdf"
const CLAVE_VALIDA = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.pdf$/;

// Crea la carpeta si no existe (se llama al cargar el módulo: sincrónico y barato).
fs.mkdirSync(DIRECTORIO, { recursive: true });

const nuevaClave = () => `${crypto.randomUUID()}.pdf`;

const rutaDe = (clave) => {
  if (typeof clave !== 'string' || !CLAVE_VALIDA.test(clave)) {
    throw new Error('Clave de archivo inválida');
  }
  return path.join(DIRECTORIO, clave);
};

/** Abre el archivo para leerlo. Devuelve { stream, size } o null si no existe. */
const abrir = async (clave) => {
  const ruta = rutaDe(clave);
  try {
    const stats = await fs.promises.stat(ruta);
    return { stream: fs.createReadStream(ruta), size: stats.size };
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
};

/** Borra el archivo; si ya no está, no es un error. */
const borrar = async (clave) => {
  try {
    await fs.promises.unlink(rutaDe(clave));
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
};

/** Verifica que el contenido real empiece con la firma de un PDF ("%PDF-"). */
const esPdfReal = async (clave) => {
  const handle = await fs.promises.open(rutaDe(clave), 'r');
  try {
    const buf = Buffer.alloc(5);
    await handle.read(buf, 0, 5, 0);
    return buf.toString('latin1') === '%PDF-';
  } finally {
    await handle.close();
  }
};

module.exports = { DIRECTORIO, nuevaClave, abrir, borrar, esPdfReal };

// backend/src/lib/geocoding.js
//
// Convierte una intersección de calles ("calle 54" y "avenida 13") en coordenadas.
//
// Cómo funciona (usa Nominatim, el buscador de OpenStreetMap: gratis y sin API key):
//   1. Se busca cada calle por separado y Nominatim devuelve todos sus tramos con su trazado.
//   2. Con los dos trazados se calcula acá el punto donde las calles se cruzan.
//
// Por qué no se le pide la esquina directamente: Nominatim no entiende "esquina de A y B",
// y Overpass (que sí lo permite) es un servicio público que hoy tarda más de 30 segundos.
//
// Si hay que cambiar de servicio, este es el ÚNICO archivo a tocar: el resto del sistema
// solo usa geocodificarInterseccion().

const { env } = require('../config/env');
const { AppError, BadRequestError, NotFoundError } = require('./http-errors');

const MAX_CANDIDATOS = 20;
const MAX_TRAMOS = 40;          // máximo que acepta Nominatim por búsqueda
const DIST_CRUCE_M = 30;        // dos tramos a menos de esto se consideran cruzados
const MENSAJE_503 = 'No pudimos buscar la intersección ahora, intentá de nuevo en un momento';

const TIPOS = {
  calle: 'Calle', c: 'Calle',
  avenida: 'Avenida', av: 'Avenida', avda: 'Avenida',
  diagonal: 'Diagonal', diag: 'Diagonal', dg: 'Diagonal',
};

const sinAcentos = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');

const normalizar = (texto) =>
  sinAcentos(String(texto)).toLowerCase().replace(/[.,]/g, ' ').replace(/\s+/g, ' ').trim();

// "54", "calle 54", "av 13", "diag. 73 bis" → { tipo|null, numero }; otro texto → null
const parsearNumerada = (texto) => {
  const m = normalizar(texto).match(/^(?:([a-z]+)\s+)?(\d{1,3})(?:\s+bis)?$/);
  if (!m || (m[1] && !TIPOS[m[1]])) return null;
  return { tipo: m[1] ? TIPOS[m[1]] : null, numero: m[2] };
};

// Identifica la calle sin importar cómo se escribió: "60", "calle 60" y "Calle 60 " son la misma.
const claveCalle = (texto) => {
  const n = parsearNumerada(texto);
  return n ? n.numero : normalizar(texto);
};

/**
 * Textos que se le piden a Nominatim para una calle.
 *   "54"       → ["Calle 54", "Avenida 54", "Diagonal 54"]  (no dijo el tipo)
 *   "avenida 13" → ["Avenida 13"]
 *   "Camino Centenario" → ["Camino Centenario"]
 */
const consultasParaCalle = (texto) => {
  const n = parsearNumerada(texto);
  if (!n) return [String(texto).trim()];
  const tipos = n.tipo ? [n.tipo] : ['Calle', 'Avenida', 'Diagonal'];
  return tipos.map((t) => `${t} ${n.numero}`);
};

/** ¿El nombre de un tramo devuelto por Nominatim corresponde a lo que pidió la persona? */
const nombreCoincide = (nombreTramo, texto) => {
  const nombre = normalizar(nombreTramo ?? '');
  const n = parsearNumerada(texto);
  if (n) {
    const tipos = n.tipo ? [n.tipo] : ['Calle', 'Avenida', 'Diagonal'];
    return tipos.some((t) => {
      const base = `${t.toLowerCase()} ${n.numero}`;
      return nombre === base || nombre === `${base} bis`;
    });
  }
  return nombre.includes(normalizar(texto));
};

// ---------------------------------------------------------------- geometría
// Trabaja en metros sobre un plano local (alcanza de sobra para distancias de una cuadra).

const M_POR_GRADO = 111320;

const aPlano = ([lon, lat], lat0) => ({
  x: lon * M_POR_GRADO * Math.cos((lat0 * Math.PI) / 180),
  y: lat * M_POR_GRADO,
});

/** Punto más cercano entre dos segmentos (a1-a2 y b1-b2). Devuelve { dist, p } con p sobre a. */
const puntoMasCercano = (a1, a2, b1, b2) => {
  const sub = (p, q) => ({ x: p.x - q.x, y: p.y - q.y });
  const r = sub(a2, a1);
  const s = sub(b2, b1);
  const den = r.x * s.y - r.y * s.x;

  // Cruce propio: los segmentos se atraviesan
  if (Math.abs(den) > 1e-9) {
    const qp = sub(b1, a1);
    const t = (qp.x * s.y - qp.y * s.x) / den;
    const u = (qp.x * r.y - qp.y * r.x) / den;
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
      return { dist: 0, p: { x: a1.x + t * r.x, y: a1.y + t * r.y } };
    }
  }

  // Si no se cruzan, el punto más cercano involucra algún extremo
  const proyectar = (p, q1, q2) => {
    const d = sub(q2, q1);
    const l2 = d.x * d.x + d.y * d.y;
    const t = l2 === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - q1.x) * d.x + (p.y - q1.y) * d.y) / l2));
    return { x: q1.x + t * d.x, y: q1.y + t * d.y };
  };
  let mejor = { dist: Infinity, p: a1 };
  const probar = (pa, pb) => {
    const dist = Math.hypot(pa.x - pb.x, pa.y - pb.y);
    if (dist < mejor.dist) mejor = { dist, p: { x: (pa.x + pb.x) / 2, y: (pa.y + pb.y) / 2 } };
  };
  probar(a1, proyectar(a1, b1, b2));
  probar(a2, proyectar(a2, b1, b2));
  probar(proyectar(b1, a1, a2), b1);
  probar(proyectar(b2, a1, a2), b2);
  return mejor;
};

const lineas = (geojson) => {
  if (geojson?.type === 'LineString') return [geojson.coordinates];
  if (geojson?.type === 'MultiLineString') return geojson.coordinates;
  return [];
};

/**
 * Puntos donde se cruzan (o casi se tocan) los tramos de la calle A con los de la calle B.
 * @param {Array<Array<[number, number]>>} lineasA  cada línea es una lista de [lon, lat]
 * @returns {Array<{ lat: number, lon: number, dist: number }>} ordenados del mejor al peor
 */
const cruces = (lineasA, lineasB) => {
  const primero = lineasA[0]?.[0];
  if (!primero) return [];
  const lat0 = primero[1];

  const aSegmentos = (linea) => {
    const pts = linea.map((c) => aPlano(c, lat0));
    return pts.slice(1).map((p, i) => [pts[i], p]);
  };
  const segsA = lineasA.flatMap(aSegmentos);
  const segsB = lineasB.flatMap(aSegmentos);

  const encontrados = [];
  for (const [a1, a2] of segsA) {
    for (const [b1, b2] of segsB) {
      const { dist, p } = puntoMasCercano(a1, a2, b1, b2);
      if (dist <= DIST_CRUCE_M) encontrados.push({ dist, p });
    }
  }

  // Un mismo cruce aparece en varios pares de segmentos: se agrupan los que están muy juntos
  encontrados.sort((u, v) => u.dist - v.dist);
  const unicos = [];
  for (const e of encontrados) {
    if (!unicos.some((u) => Math.hypot(u.p.x - e.p.x, u.p.y - e.p.y) < 15)) unicos.push(e);
  }

  const cos = Math.cos((lat0 * Math.PI) / 180);
  return unicos.slice(0, MAX_CANDIDATOS).map(({ dist, p }) => ({
    lat: p.y / M_POR_GRADO,
    lon: p.x / (M_POR_GRADO * cos),
    dist,
  }));
};

// ---------------------------------------------------------------- Nominatim

// Nominatim pide como máximo 1 pedido por segundo: se espacian las búsquedas.
let ultimoPedido = 0;
const esperarTurno = async () => {
  const espera = ultimoPedido + 1100 - Date.now();
  ultimoPedido = Math.max(Date.now(), ultimoPedido + 1100);
  if (espera > 0) await new Promise((r) => setTimeout(r, espera));
};

// GEOCODING_BBOX está en formato sur,oeste,norte,este; Nominatim pide oeste,norte,este,sur
const viewbox = () => {
  const [sur, oeste, norte, este] = env.GEOCODING_BBOX.split(',');
  return [oeste, norte, este, sur].join(',');
};

async function buscarTramos(consulta, textoOriginal, limite) {
  await esperarTurno();

  const url = new URL('/search', env.GEOCODING_URL);
  url.search = new URLSearchParams({
    q: consulta,
    format: 'jsonv2',
    polygon_geojson: '1',
    viewbox: viewbox(),
    bounded: '1',
    limit: String(MAX_TRAMOS),
  }).toString();

  const res = await fetch(url, {
    headers: { 'User-Agent': 'VeoTuMicro/1.0 (proyecto universitario)', 'Accept-Language': 'es' },
    signal: AbortSignal.timeout(limite),
  });
  if (!res.ok) throw new Error(`el servicio respondió ${res.status}`);

  const data = await res.json();
  return (Array.isArray(data) ? data : [])
    .filter((r) => r.category === 'highway' && nombreCoincide(r.name, textoOriginal))
    .flatMap((r) => lineas(r.geojson));
}

async function trazadoDeCalle(texto, limite) {
  const trazado = [];
  for (const consulta of consultasParaCalle(texto)) {
    trazado.push(...(await buscarTramos(consulta, texto, limite)));
  }
  return trazado;
}

/**
 * @param {string} calle1
 * @param {string} calle2
 * @returns {Promise<Array<{ lat: number, lon: number }>>}  esquinas donde se cruzan (puede haber más de una)
 */
async function geocodificarInterseccion(calle1, calle2) {
  if (claveCalle(calle1) === claveCalle(calle2)) {
    throw new BadRequestError('Ingresá dos calles distintas');
  }

  let trazadoA;
  let trazadoB;
  try {
    // tiempo máximo de cada pedido a Nominatim
    const limite = env.GEOCODING_TIMEOUT_MS;
    trazadoA = await trazadoDeCalle(calle1, limite);
    trazadoB = await trazadoDeCalle(calle2, limite);
  } catch (err) {
    console.error('[geocoding] no se pudo consultar el servicio:', err.message);
    throw new AppError(503, MENSAJE_503);
  }

  if (!trazadoA.length || !trazadoB.length) {
    throw new NotFoundError('No encontramos esa intersección. Revisá los nombres de las calles');
  }

  const puntos = cruces(trazadoA, trazadoB).map(({ lat, lon }) => ({ lat, lon }));
  if (!puntos.length) {
    throw new NotFoundError('No encontramos esa intersección. Revisá los nombres de las calles');
  }
  return puntos;
}

module.exports = { geocodificarInterseccion, cruces, nombreCoincide, consultasParaCalle };

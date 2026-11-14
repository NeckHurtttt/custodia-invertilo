// CLIMA ESPACIAL REAL (Proyecto Hackaton 2.0). La llamarada más fuerte del último mes según NASA DONKI se vuelve,
// 3 veces por misión, una tormenta en la base: correr al refugio (casi sin dosis, pero se pierde tiempo y el refugio
// gasta energía) o seguir con lo suyo (la dosis se suma y no se borra). Lógica pura salvo fetchFlares (red).

/** Llamaradas reales archivadas de NASA DONKI (las más fuertes del ciclo solar 25 en 2024), para jugar sin internet. */
export const ARCHIVED_FLARES = [
  { cls: 'X8.7', date: '2024-05-14', source: 'archivo' },
  { cls: 'X9.0', date: '2024-10-03', source: 'archivo' },
  { cls: 'X7.1', date: '2024-10-01', source: 'archivo' },
];

/** Clase de llamarada (A, B, C, M, X + número) a intensidad comparable. */
export function flareRank(cls) {
  const m = /^([ABCMX])(\d+(?:\.\d+)?)/.exec(String(cls ?? ''));
  return m ? { A: 0.001, B: 0.01, C: 0.1, M: 1, X: 10 }[m[1]] * Number(m[2]) : 0;
}
/** Las n más fuertes de una lista de DONKI FLR, sin repetir día. */
export function strongestFlares(list, n = 3) {
  const seen = new Set();
  return [...(list ?? [])].filter((f) => f?.classType).sort((a, b) => flareRank(b.classType) - flareRank(a.classType))
    .map((f) => ({ cls: f.classType, date: String(f.beginTime ?? f.peakTime ?? '').slice(0, 10), source: 'donki' }))
    .filter((f) => !seen.has(f.date) && seen.add(f.date)).slice(0, n);
}
/** Lista para la misión: las reales del mes completadas con archivadas hasta tener 3. */
export function missionFlares(live) {
  const out = [...(live ?? [])].slice(0, 3);
  for (const a of ARCHIVED_FLARES) if (out.length < 3) out.push(a);
  return out;
}

/** Días en que llega una tormenta y a qué hora (minuto del día): tarde, en tiempo libre o ejercicio. */
export const STORM_DAYS = [2, 5, 8];
export const STORM_MIN = 15 * 60;
/** Segundos de aviso antes de que lleguen las partículas, y cuánto dura la tormenta. */
export const warnSeconds = (difKey) => (difKey === 'cadete' ? 45 : difKey === 'facil' ? 35 : 25);
export const STORM_SECONDS = 20;

/** Sala refugio de cada destino (y por qué es real). */
export const SHELTER = {
  estacion: { room: 'dorm', why: 'En la ISS, las cabinas de la tripulación tienen blindaje extra de polietileno.' },
  luna: { room: 'refugio', why: 'Un refugio con paredes gruesas, como los que NASA estudia para Artemis.' },
  marte: { room: 'bodega', why: 'Rodearse de agua y provisiones frena la radiación: así arman su refugio los astronautas de la nave Orion.' },
};

/**
 * Dosis de la tormenta (en la escala del juego, mSv sobre un límite de misión de 8) para quien se queda afuera del refugio.
 * Más fuerte la llamarada, más dosis. En órbita baja, el campo magnético de la Tierra protege; en la Luna no hay nada.
 */
export function stormDose(cls, loc) {
  const r = flareRank(cls);
  const base = r >= 5 ? 2.4 : r >= 1 ? 1.6 : r >= 0.1 ? 0.8 : 0.4;
  return Math.round(base * ({ estacion: 0.5, luna: 1, marte: 0.75 }[loc] ?? 1) * 100) / 100;
}
export const SHELTER_FACTOR = 0.15;     // el refugio deja pasar ~15 %
export const SHELTER_ENERGY = 6;        // puntos del sistema ENERGÍA que gasta el refugio (filtros y luces de emergencia)

/** Texto de la clase para chicos. */
export const classText = (cls) => (String(cls).startsWith('X') ? 'X es la clase más fuerte' : String(cls).startsWith('M') ? 'M es media-fuerte' : 'C es débil');
export const sourceText = (f) => (f.source === 'donki'
  ? `Llamarada REAL de NASA DONKI: clase ${f.cls}, ${f.date} (último mes).`
  : `Llamarada REAL archivada de NASA DONKI: clase ${f.cls}, ${f.date}. (Sin conexión con NASA: no es en vivo.)`);

/** Pide a NASA DONKI las llamaradas de los últimos 30 días (api.nasa.gov y, si falla, el servidor CCMC sin llave). */
export async function fetchFlares({ fetchImpl = globalThis.fetch, key = 'DEMO_KEY', now = new Date(), timeoutMs = 6000 } = {}) {
  const d = (x) => x.toISOString().slice(0, 10);
  const q = `startDate=${d(new Date(now.getTime() - 30 * 86400000))}&endDate=${d(now)}`;
  for (const url of [`https://api.nasa.gov/DONKI/FLR?${q}&api_key=${key}`, `https://kauai.ccmc.gsfc.nasa.gov/DONKI/WS/get/FLR?${q}`]) {
    try {
      const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), timeoutMs);
      const r = await fetchImpl(url, { signal: ctl.signal }); clearTimeout(t);
      if (!r || r.ok === false) continue;
      const list = await r.json(); if (!Array.isArray(list)) continue;
      return strongestFlares(list, 3);
    } catch { /* probar el siguiente */ }
  }
  return null;
}

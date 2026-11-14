// Reglas PURAS del sonido de LIFELINE: Rutina (sin AudioContext, sin DOM, sin azar propio).
// music.js las usa para sonar y main.js para decidir QUÉ sonar; así se pueden probar en node (tests/sonido.test.js).
// El audio nunca altera reglas ni estado: aquí solo se LEE información del juego y se devuelven números.

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/** Intensidad musical 0..3 (0 calma · 1 tensión · 2 persecución · 3 huida final) a partir de s.threat y del estado.
 *  threat = { lvl: 0|1|2, sus, near } (lo calcula villains.threatLevel). Un perseguidor LEJOS solo da tensión (1), no persecución. */
export function nivelMusica({ over = false, final = false, threat = null, danger = 0, alert = 0, emerg = false, mission = false, hidden = false } = {}) {
  if (over) return 0;
  if (final) return 3;
  const lvl = threat?.lvl ?? 0, near = threat?.near ?? 99;
  if (lvl === 2 && (near < 9 || (hidden && near < 13))) return 2;
  if (danger > 0.5 || (hidden && danger > 0)) return 2;
  if (lvl === 2) return 1;
  if (lvl === 1 && near < 14) return 1;
  if (alert > 50 || emerg || mission || danger > 0) return 1;
  return 0;
}

/** Suaviza la intensidad: SUBE al instante, BAJA de a un nivel cada `espera/2` s y solo tras `espera` s tranquilo
 *  (así la música no parpadea cuando el dron pierde y recupera el rastro). `est` = { nivel, resta } se modifica y se devuelve el nivel. */
export function suavizarNivel(est, objetivo, dt, espera = 3) {
  if (objetivo >= est.nivel) { est.nivel = objetivo; est.resta = espera; return est.nivel; }
  est.resta -= dt;
  if (est.resta <= 0) { est.nivel -= 1; est.resta = espera / 2; }
  return est.nivel;
}

/** Frecuencia del pasa-bajos de la música: se abre con el nivel y con la sospecha (0..1); de noche se cierra. */
export const lpObjetivo = (nivel, noche, sus = 0) => (noche ? 900 : 1700 + clamp(nivel, 0, 3) * 350 + clamp(sus, 0, 1) * 350);

/** Ritmo del latido 0..1 (0 = sin latido): solo si algo te persigue (threat.lvl 2), más rápido cuanto más cerca; en la huida final, fijo. */
export function tasaLatido({ threat = null, final = false } = {}) {
  const r = threat?.lvl === 2 ? clamp(1 - (threat.near ?? 99) / 12, 0.3, 1) : 0;
  return Math.max(r, final ? 0.6 : 0);
}

/** Qué suena al caminar: 'metal' (dentro de la base), 'polvo' (Luna/Marte afuera), 'casco' (casco exterior de la Estación) o null (sin pasos). */
export function superficiePaso({ loc = 'estacion', outside = false, inDuct = false, crouch = false, sleep = false } = {}) {
  if (inDuct || crouch || sleep) return null;
  if (outside) return loc === 'estacion' ? 'casco' : 'polvo';
  return 'metal';
}

/** Dónde está el jugador para el sonido ambiente. */
export const zonaJugador = ({ outside = false, inDuct = false, shelter = false } = {}) => (inDuct ? 'conducto' : outside ? 'fuera' : shelter ? 'refugio' : 'dentro');

// Niveles base (ganancias ya MUY bajas, se multiplican por AMB en music.js) por destino y zona.
//  hum = zumbido grave de máquinas/soporte vital · vent = aire de ventilación (filtro en ventF) · wind = viento (filtro en windF)
//  vac = vacío (dos tonos casi inaudibles) · lp = pasa-bajos general (más bajo = más «amortiguado») · eco = segundos entre ecos lejanos (0 = sin)
const DENTRO_E = { hum: 0.030, vent: 0.020, ventF: 420, wind: 0, windF: 500, vac: 0, lp: 1500, eco: 0 };
const BASE = {
  estacion: {
    dentro: DENTRO_E,
    conducto: { ...DENTRO_E, hum: 0.020, vent: 0.040, ventF: 330, lp: 1000 },
    refugio: { ...DENTRO_E, hum: 0.045, vent: 0.010, ventF: 300, lp: 800 },
    fuera: { hum: 0.006, vent: 0, ventF: 400, wind: 0, windF: 500, vac: 0.028, lp: 500, eco: 0 }, // afuera: casi silencio
  },
  luna: {
    dentro: { hum: 0.018, vent: 0.012, ventF: 360, wind: 0, windF: 500, vac: 0.010, lp: 1100, eco: 14 },
    conducto: { hum: 0.014, vent: 0.030, ventF: 320, wind: 0, windF: 500, vac: 0.006, lp: 900, eco: 0 },
    refugio: { hum: 0.018, vent: 0.012, ventF: 360, wind: 0, windF: 500, vac: 0.010, lp: 1100, eco: 14 },
    fuera: { hum: 0, vent: 0, ventF: 400, wind: 0, windF: 500, vac: 0.022, lp: 450, eco: 8 },
  },
  marte: {
    dentro: { hum: 0.020, vent: 0.012, ventF: 380, wind: 0.022, windF: 280, vac: 0, lp: 1200, eco: 0 },
    conducto: { hum: 0.014, vent: 0.034, ventF: 320, wind: 0.010, windF: 250, vac: 0, lp: 900, eco: 0 },
    refugio: { hum: 0.020, vent: 0.012, ventF: 380, wind: 0.022, windF: 280, vac: 0, lp: 1200, eco: 0 },
    fuera: { hum: 0, vent: 0, ventF: 400, wind: 0.085, windF: 650, vac: 0, lp: 2400, eco: 0 },
  },
};
/** Tope de seguridad de cada capa (público infantil: nada fuerte aunque cambien los números). */
export const TOPE_AMB = { hum: 0.06, vent: 0.06, wind: 0.18, vac: 0.04 };

/** Mezcla del ambiente para un destino/zona. tormenta: 0 nada · 1 se acerca · 2 te cubre. noche: baja ventilación y cierra el filtro.
 *  Devuelve { hum, vent, ventF, wind, windF, vac, lp, eco }. */
export function mezclaAmbiente({ loc = 'estacion', zona = 'dentro', noche = false, tormenta = 0 } = {}) {
  const dest = BASE[loc] ?? BASE.estacion; const b = { ...(dest[zona] ?? dest.dentro) };
  if (noche) { b.vent *= 0.7; b.hum *= 0.9; b.lp *= 0.85; if (loc === 'luna') b.vac *= 1.2; }
  if (loc === 'marte' && tormenta > 0) { const k = tormenta === 2 ? (zona === 'fuera' ? 1.8 : 2.5) : 1.5; b.wind = b.wind * k + (zona === 'fuera' ? 0 : 0.01 * tormenta); b.windF *= tormenta === 2 ? 1.25 : 1.12; b.lp *= 1.1; }
  for (const k of Object.keys(TOPE_AMB)) b[k] = clamp(b[k], 0, TOPE_AMB[k]);
  return b;
}

/** Variación leve de afinación para que los sonidos repetidos no cansen. r en 0..1 (azar del llamador), a = amplitud (0,05 = ±5 %). */
export const variar = (f, r, a = 0.05) => f * (1 + (r * 2 - 1) * clamp(a, 0, 0.2));

/** Acota un tono suelto de interfaz: volumen ≤ 0,06 y duración entre 30 ms y 1,2 s. */
export const acotaTono = (vol = 0.035, dur = 0.08) => ({ vol: clamp(+vol || 0, 0, 0.06), dur: clamp(+dur || 0.08, 0.03, 1.2) });

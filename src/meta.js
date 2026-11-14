// Progreso entre partidas: puntos, desbloqueos, medallas, racha, notas conocidas y reto diario.
// Todo vive en localStorage ('lfr.meta'); si no hay almacenamiento, el juego funciona igual (sin guardar).
import { PERKS, DIFS } from './common.js';
import { NOTES } from './story.js';

export const MEDALS = {
  primer: ['Primer regreso', 'Escapa por primera vez.'],
  fantasma: ['Fantasma', 'Escapa sin que te atrapen ni una vez.'],
  invisible: ['Invisible', 'Escapa sin que nadie te vea.'],
  relampago: ['Relámpago', 'Escapa en la campaña antes del día 4.'],
  apagon: ['Interruptor', 'Escapa con la IA apagada.'],
  motin: ['Capitán', 'Escapa por la ruta MOTÍN.'],
  sabotaje: ['Saboteador', 'Escapa por la ruta SABOTAJE.'],
  traidor: ['Lobo solitario', 'Escapa después de delatar a alguien.'],
  lealtad: ['Nadie se queda atrás', 'Escapa con los 3 compañeros de tu lado.'],
  archivo: ['Archivista', 'Encuentra las 6 notas de un destino.'],
  verdad: ['La verdad', 'Consigue un final verdadero.'],
  noche: ['Noctámbulo', 'Gana una partida de UNA NOCHE.'],
  terror: ['Sangre fría', 'Gana en Terror.'],
  pesadilla: ['Leyenda', 'Gana en Pesadilla.'],
  trotamundos: ['Trotamundos', 'Escapa de la Estación, la Luna y Marte.'],
  racha3: ['En racha', 'Gana 3 partidas seguidas.'],
  reto: ['Puntual', 'Completa un reto del día.'],
};

const KEY = 'lfr.meta';
const blank = () => ({ pts: 0, unlocked: ['novato'], medals: {}, notes: {}, wins: {}, streak: 0, bestStreak: 0, daily: {}, games: 0 });
export function load() { try { return { ...blank(), ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return blank(); } }
function save(m) { try { localStorage.setItem(KEY, JSON.stringify(m)); } catch { /* sin almacenamiento */ } }

export const isUnlocked = (m, perk) => m.unlocked.includes(perk) || !PERKS[perk]?.cost;
export const difUnlocked = (m, d) => !DIFS[d]?.locked || m.unlocked.includes('dif:' + d);
/** Compra un personaje o la dificultad secreta. Devuelve true si se pudo. */
export function buy(id) {
  const m = load(); const cost = id.startsWith('dif:') ? DIFS[id.slice(4)]?.locked : PERKS[id]?.cost;
  if (!cost || m.unlocked.includes(id) || m.pts < cost) return false;
  m.pts -= cost; m.unlocked.push(id); save(m); return true;
}
export const seenNotes = (loc) => load().notes[loc] ?? [];
/** Guarda las notas que encontraste (también a mitad de partida, para no perderlas). */
export function keepNotes(s) {
  if (!s.notes?.length) return; const m = load(); const k = new Set([...(m.notes[s.loc] ?? []), ...s.notes]); m.notes[s.loc] = [...k].sort((a, b) => a - b); save(m);
}

// ---------- reto del día ----------
export const today = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export function daily(d = new Date()) {
  const key = today(d); let h = 2166136261; for (const c of key) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  const n = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5);
  return { key, seed: (h >>> 0) & 0x7fffffff, loc: ['estacion', 'luna', 'marte'][n % 3], dif: 'normal', mode: 'noche', perk: 'novato' };
}
export const fmtTime = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;

/** Al terminar una partida: puntos, medallas nuevas, racha y récord del reto. Devuelve el resumen para la pantalla final. */
export function finish(s) {
  const m = load(); const o = s.over; const won = o.won; const got = [];
  const medal = (id, cond) => { if (cond && !m.medals[id]) { m.medals[id] = today(); got.push(id); } };
  const pieces = ['codigo', 'celda', 'traje', 'llave'].filter((id) => s.p.inv.includes(id) || s.stash.includes(id)).length;
  let pts = won ? 100 + 40 * o.stars : 15 + 10 * pieces + (s.mode === 'campana' ? 3 * s.day : 0);
  const known = new Set([...(m.notes[s.loc] ?? []), ...s.notes]); const newNotes = s.notes.filter((i) => !(m.notes[s.loc] ?? []).includes(i)).length;
  pts += 15 * newNotes; m.notes[s.loc] = [...known].sort((a, b) => a - b);
  if (won) { m.streak++; m.bestStreak = Math.max(m.bestStreak, m.streak); m.wins[s.loc] = (m.wins[s.loc] ?? 0) + 1; } else m.streak = 0;
  if (won && m.streak > 1) pts += 25 * Math.min(m.streak - 1, 4);
  m.games++;
  medal('primer', won); medal('fantasma', won && s.stats.caught === 0); medal('invisible', won && s.stats.spotted === 0);
  medal('relampago', won && s.mode === 'campana' && s.day < 4); medal('apagon', won && !s.iaOn);
  medal('motin', won && o.route === 'motin'); medal('sabotaje', won && o.route === 'sabotaje');
  medal('traidor', won && s.crew.some((c) => c.betrayed)); medal('lealtad', won && s.crew.every((c) => c.trust >= 2));
  medal('archivo', known.size >= NOTES[s.loc].length); medal('verdad', won && o.trueEnd); medal('noche', won && s.mode === 'noche');
  medal('terror', won && s.dif === 'dificil'); medal('pesadilla', won && s.dif === 'pesadilla');
  medal('trotamundos', ['estacion', 'luna', 'marte'].every((l) => m.wins[l])); medal('racha3', m.streak >= 3);
  let rec = null;
  if (s.daily) {
    const d = daily(); const prev = m.daily[d.key];
    rec = { won, t: s.t, best: prev?.best ?? null, isNew: won && (!prev?.best || s.t < prev.best) };
    if (rec.isNew) m.daily[d.key] = { best: s.t, stars: o.stars };
    else if (!prev) m.daily[d.key] = { best: null };
    medal('reto', won);
  }
  pts += 50 * got.length; m.pts += pts; save(m);
  return { pts, medals: got, streak: m.streak, total: m.pts, daily: rec, newNotes };
}

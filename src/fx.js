// Efectos de pantalla de CUSTODIA — preferencia «suave», sacudida de cámara y hitstop.
// Solo presentación: NO cambia el estado del juego ni usa azar. main.js decide cuándo congelar un instante
// el avance de update() (hitstop) y cuánto mover la cámara; core.js no se entera de nada de esto.
//
// Preferencia del jugador (localStorage 'lfr.fx'): 'normal' | 'suave'.
//   suave = sin sacudida, sin hitstop, sin viñetas ni destellos, menos partículas (para quien se marea o tiene fotosensibilidad).
//   Si el navegador pide «reducir movimiento» (prefers-reduced-motion) y no hay nada guardado, arranca en 'suave'.
// Para la interfaz: getFx(), setFx('suave'|'normal'), toggleFx(), onFx(cb). También en window.lfr.fx (ver main.js).

const KEY = 'lfr.fx';
let modo = null; const oyentes = [];

function leer() {
  try { const v = globalThis.localStorage?.getItem(KEY); if (v === 'suave' || v === 'normal') return v; } catch { /* sin almacenamiento */ }
  try { if (globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return 'suave'; } catch { /* sin matchMedia */ }
  return 'normal';
}
/** 'normal' o 'suave'. */
export const getFx = () => (modo ??= leer());
export const suave = () => getFx() === 'suave';
/** Cambia el modo y lo guarda. Devuelve el modo resultante. */
export function setFx(m) {
  modo = m === 'suave' ? 'suave' : 'normal';
  try { globalThis.localStorage?.setItem(KEY, modo); } catch { /* sin almacenamiento */ }
  HS.until = 0;
  for (const f of oyentes) { try { f(modo); } catch { /* un oyente roto no frena a los demás */ } }
  return modo;
}
export const toggleFx = () => setFx(suave() ? 'normal' : 'suave');
/** Avisa cuando cambia el modo (para que el botón de la interfaz refleje el estado). */
export const onFx = (cb) => { oyentes.push(cb); };
/** Solo para pruebas: olvida el modo leído para volver a consultar el almacenamiento. */
export const _reiniciar = () => { modo = null; HS.until = 0; HS.cool = 0; W.s = null; };

// ---------- hitstop: congelar el avance un instante (60-90 ms) al ser atrapado, recibir daño o salvar una emergencia ----------
const HS = { until: 0, cool: 0 };
/** Pide un congelado de `ms` milisegundos desde `now`. Se ignora en modo suave y si hubo otro hace muy poco (máx. ~2 por segundo). */
export function hitstop(ms, now) {
  if (suave() || now < HS.cool) return false;
  HS.until = now + ms; HS.cool = now + ms + 450; return true;
}
/** ¿Hay que saltarse G.update en este cuadro? (now = marca de tiempo de requestAnimationFrame, en ms). */
export const frozen = (now) => now < HS.until;

// ---------- sacudida de cámara ----------
/** Desplazamiento de la cámara en píxeles de pantalla. shake = s.shake del núcleo (0…~0,8 s restantes).
 *  Oscila lento (≈6-7 Hz, suave) y se apaga con una curva cuadrática; máximo ~4 px. En modo suave, siempre 0. */
export function shakeOffset(shake, t, out) {
  if (!(shake > 0) || suave()) { out.x = 0; out.y = 0; return out; }
  const k = Math.min(1, shake / 0.8); const a = k * k * 4;
  out.x = Math.round(a * Math.sin(t * 0.042)); out.y = Math.round(a * 0.6 * Math.sin(t * 0.035 + 1.3));
  return out;
}

// ---------- observador de eventos del juego (solo lee s) ----------
const W = { s: null, caught: 0, hit: 0, saved: 0, solved: 0 };
/** Banderas del último cuadro (se reutiliza el mismo objeto): golpe nuevo, captura, emergencia salvada, problema resuelto. */
export const EV = { hit: false, caught: false, saved: false, solved: false };
/** Llamar una vez por cuadro DESPUÉS de update(). Detecta cambios y pide el hitstop que toque. */
export function watch(s, now) {
  EV.hit = EV.caught = EV.saved = EV.solved = false;
  const c = s.stats?.caught ?? 0, h = s.p?.hit ?? 0, sv = s.sys?.st?.saved ?? 0, so = s.stats?.solved ?? 0;
  if (W.s !== s) { W.s = s; W.caught = c; W.hit = h; W.saved = sv; W.solved = so; return EV; }
  if (c > W.caught) { EV.caught = true; hitstop(90, now); }
  else if (h > W.hit + 0.3) { EV.hit = true; hitstop(70, now); } // un golpe nuevo salta de golpe; el daño continuo fija p.hit en 0,2 y no cuenta
  if (sv > W.saved) { EV.saved = true; hitstop(60, now); }
  else if (so > W.solved) EV.solved = true;
  W.caught = c; W.hit = h; W.saved = sv; W.solved = so;
  return EV;
}

// Audio de LIFELINE: Rutina — TODO el sonido pasa por aquí (WebAudio sintetizado, sin archivos, sin dependencias).
//   · Música generativa por destino; la intensidad (0 calma · 1 tensión · 2 persecución · 3 huida final) suma capas.
//   · Alertas del juego (`sting`), efectos de acción (`sfx`), pasos (`paso`), interfaz (`ui`, `tone`), latido y ambiente continuo (`ambiente`).
// Cadena: fuentes → (musBus | sfxIn | ambBus) → master → gate (mudo general) → compresor → salida.
// Las decisiones «qué suena cuándo» son funciones puras de sonido.js (con pruebas); aquí solo se genera el sonido.
// El audio NUNCA altera reglas ni estado; core.js jamás importa este archivo. Si no hay AudioContext todo se degrada en silencio.
import { suavizarNivel, lpObjetivo, variar, acotaTono, clamp } from './sonido.js';

const THEMES = {
  estacion: { bpm: 84, root: 45, scale: [0, 2, 3, 5, 7, 8, 10], prog: [0, 5, 3, 4], lead: 'triangle', pad: 'sawtooth' },   // La menor, frío y metálico
  luna: { bpm: 66, root: 50, scale: [0, 2, 3, 5, 7, 9, 10], prog: [0, 3, 5, 4], lead: 'sine', pad: 'triangle' },             // Re dórico, vacío y lento
  marte: { bpm: 96, root: 40, scale: [0, 1, 3, 5, 7, 8, 10], prog: [0, 1, 5, 4], lead: 'square', pad: 'sawtooth' },          // Mi frigio, áspero
};
/** Claves de s.sfx que `sting` sabe sonar (un test comprueba que todas las que emite el núcleo estén aquí). */
export const STINGS = ['visto', 'atrapado', 'alarma', 'radio', 'susto', 'nota', 'boom', 'sospecha', 'perdido', 'aviso'];
/** Efectos de acción para `sfx`. */
export const SFX = ['interactuar', 'recoger', 'soltar', 'lanzar', 'fabricar', 'mant', 'resuelto', 'salvado', 'golpe', 'emerg', 'tic', 'fin_bien', 'fin_mal'];
/** Sonidos de interfaz para `ui`. */
export const UI = ['click', 'abrir', 'cerrar', 'ok', 'error', 'info', 'paso'];

let ac = null, master = null, gate = null, musBus = null, sfxIn = null, ambBus = null, lp = null, delay = null, enabled = true, sfxEnabled = true;
let theme = THEMES.estacion, loc = null, level = 0, night = false, tens = 0, timer = null, step = 0, next = 0;
let noiseBuf = null, live = 0, foot = 0, lastLp = 0, lastSet = 0, ambEco = 0, pingNext = 0;
const est = { nivel: 0, resta: 0 }; const lastBy = {};
const MUS_VOL = 2.4;      // música (la cadena la comprime)
const AMB = 1.8;          // ambiente: se multiplica por las ganancias de sonido.js (ya muy bajas)
const MAX_VOCES = 40, TOPE_VOCES = 56; // presupuesto de fuentes sonando a la vez (efectos suaves se descartan antes)
const MAX_VOL_NOTA = 0.2; // ninguna nota suelta pasa de aquí
const hz = (m) => 440 * 2 ** ((m - 69) / 12);
const jit = (a = 0.04) => variar(1, Math.random(), a);

// ---------- arranque (siempre desde un gesto del jugador) ----------
let vol = 1; try { vol = +(localStorage.getItem('lfr.vol') ?? 1) || 1; } catch { /* nada */ }
try { enabled = localStorage.getItem('lfr.music') !== '0'; } catch { /* nada */ }
try { sfxEnabled = localStorage.getItem('lfr.sfx') !== '0'; } catch { /* nada */ }

let amb = null; // nodos del ambiente continuo
/** Crea el contexto y los buses (una sola vez) y lo reanuda. Se puede llamar en cada gesto; no arranca la música. */
export function wake() {
  try {
    if (ac) { if (ac.state === 'suspended') ac.resume()?.catch?.(() => {}); return; }
    ac = new AudioContext();
    // compresor al final: permite subir mucho el volumen sin que sature
    const comp = ac.createDynamicsCompressor(); comp.threshold.value = -18; comp.knee.value = 12; comp.ratio.value = 4; comp.connect(ac.destination);
    gate = ac.createGain(); gate.gain.value = enabled ? 1 : 0; gate.connect(comp);   // mudo general (tecla M / botón de música)
    master = ac.createGain(); master.gain.value = 1.6 * vol; master.connect(gate);
    musBus = ac.createGain(); musBus.gain.value = MUS_VOL;
    lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1800; lp.Q.value = 0.7;
    delay = ac.createDelay(1); delay.delayTime.value = 0.36; const fb = ac.createGain(); fb.gain.value = 0.35; const wet = ac.createGain(); wet.gain.value = 0.3;
    musBus.connect(lp).connect(master); lp.connect(delay); delay.connect(fb).connect(delay); delay.connect(wet).connect(master);
    // efectos: entrada con pasa-bajos suave (nada chillón) y su propio interruptor
    sfxIn = ac.createGain(); sfxIn.gain.value = sfxEnabled ? 1 : 0; const sl = ac.createBiquadFilter(); sl.type = 'lowpass'; sl.frequency.value = 6500; sl.Q.value = 0.5;
    sfxIn.connect(sl).connect(master);
    noiseBuf = ac.createBuffer(1, Math.ceil(ac.sampleRate * 4), ac.sampleRate); { const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; } // UN solo búfer de ruido para todo
    buildAmb();
    if (ac.state === 'suspended') ac.resume()?.catch?.(() => {});
  } catch { ac = null; /* sin audio */ }
}
/** Arranca la música (y el contexto). Desde botones de «jugar». */
export function start() {
  wake(); if (!ac) return;
  try { if (!timer) { next = ac.currentTime + 0.1; timer = setInterval(schedule, 25); } } catch { /* sin audio */ }
}
export const on = () => enabled;
export const sfxOn = () => sfxEnabled;
/** Volumen general 0.25..2 (botones − / + en la pausa). */
export function volume(d = 0) { vol = Math.max(0.25, Math.min(2, Math.round((vol + d) * 4) / 4)); try { if (master) master.gain.setTargetAtTime(1.6 * vol, ac.currentTime, 0.1); } catch { /* nada */ } try { localStorage.setItem('lfr.vol', vol); } catch { /* nada */ } return vol; }
/** Silencia/activa TODO el sonido (música, ambiente, efectos y latido). */
export function toggle() { enabled = !enabled; try { if (gate) gate.gain.setTargetAtTime(enabled ? 1 : 0, ac.currentTime, 0.15); } catch { /* nada */ } try { localStorage.setItem('lfr.music', enabled ? '1' : '0'); } catch { /* nada */ } return enabled; }
/** Silencia/activa solo los efectos (interfaz, pasos, alertas y acciones); la música y el ambiente siguen. */
export function toggleSfx() { sfxEnabled = !sfxEnabled; try { if (sfxIn) sfxIn.gain.setTargetAtTime(sfxEnabled ? 1 : 0, ac.currentTime, 0.05); } catch { /* nada */ } try { localStorage.setItem('lfr.sfx', sfxEnabled ? '1' : '0'); } catch { /* nada */ } return sfxEnabled; }

/** Lo llama el bucle del juego cada cuadro: destino, intensidad 0..3 (ya calculada con sonido.nivelMusica), noche y sospecha 0..1 (s.threat.sus). */
export function set(newLoc, lvl, isNight, sus = 0) {
  if (newLoc !== loc) { loc = newLoc; theme = THEMES[loc] ?? THEMES.estacion; step = 0; est.nivel = 0; est.resta = 0; }
  const now = (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000; const dt = Math.min(0.1, Math.max(0, now - lastSet)); lastSet = now;
  level = suavizarNivel(est, lvl, dt); night = isNight; tens = clamp(sus, 0, 1);
  if (lp && ac) { const f = lpObjetivo(level, night, tens); if (Math.abs(f - lastLp) > 40) { lastLp = f; lp.frequency.setTargetAtTime(f, ac.currentTime, 0.5); } }
}

// ---------- piezas básicas (todas con inicio y fin: se recolectan solas) ----------
const hayHueco = (n = 1, duro = false) => !!ac && live + n <= (duro ? TOPE_VOCES : MAX_VOCES);
function vive(src) { live++; src.onended = () => { live = Math.max(0, live - 1); }; }
function note(freq, t, dur, type, v, dest = musBus) {
  const o = ac.createOscillator(); const g = ac.createGain(); v = Math.min(v, MAX_VOL_NOTA);
  o.type = type; o.frequency.value = freq; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + Math.min(0.03, dur / 4)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(dest); vive(o); o.start(t); o.stop(t + dur + 0.05);
}
/** Nota que cambia de tono (de f0 a f1). */
function glide(f0, f1, t, dur, type, v, dest = sfxIn) {
  const o = ac.createOscillator(); const g = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.min(v, MAX_VOL_NOTA), t + Math.min(0.04, dur / 4)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(dest); vive(o); o.start(t); o.stop(t + dur + 0.05);
}
/** Ruido filtrado: usa el búfer compartido con un punto de inicio al azar (sin reservar memoria por golpe). fEnd ≠ null = barrido del filtro. */
function noise(t, dur, v, f = 6000, dest = musBus, type = 'highpass', fEnd = null) {
  const n = ac.createBufferSource(); n.buffer = noiseBuf;
  const hp = ac.createBiquadFilter(); hp.type = type; hp.frequency.setValueAtTime(f, t); if (fEnd) hp.frequency.exponentialRampToValueAtTime(fEnd, t + dur); if (type === 'bandpass') hp.Q.value = 0.9;
  const g = ac.createGain(); g.gain.setValueAtTime(Math.min(v, MAX_VOL_NOTA), t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  n.connect(hp).connect(g).connect(dest); vive(n); n.start(t, Math.random() * (noiseBuf.duration - dur - 0.1), dur + 0.02);
}
function kick(t, v = 0.5, dest = musBus) { const o = ac.createOscillator(); const g = ac.createGain(); o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.15); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25); o.connect(g).connect(dest); vive(o); o.start(t); o.stop(t + 0.3); }
/** Baja la música un instante para que una alerta se oiga clara. */
function duck(amt = 0.55, hold = 0.6) { if (!musBus) return; const t = ac.currentTime; musBus.gain.cancelScheduledValues(t); musBus.gain.setTargetAtTime(MUS_VOL * amt, t, 0.03); musBus.gain.setTargetAtTime(MUS_VOL, t + hold, 0.35); }
const puede = (n = 4) => !!ac && enabled && hayHueco(n);

// ---------- ambiente continuo por destino / zona (cama muy baja; cambia con rampas, nunca a golpes) ----------
function buildAmb() {
  const out = ac.createGain(); out.gain.value = 1; const alp = ac.createBiquadFilter(); alp.type = 'lowpass'; alp.frequency.value = 1200; alp.Q.value = 0.5; out.connect(alp).connect(master); ambBus = out;
  const nivel = () => { const g = ac.createGain(); g.gain.value = 0; return g; };
  const loopNoise = () => { const n = ac.createBufferSource(); n.buffer = noiseBuf; n.loop = true; n.start(0, Math.random() * 3); return n; };
  const lfo = (f, prof, dest) => { const o = ac.createOscillator(); o.frequency.value = f; const g = ac.createGain(); g.gain.value = prof; o.connect(g).connect(dest); o.start(); return o; };
  // zumbido grave de máquinas: dos senos casi iguales (laten despacio) + un armónico suave
  const hum = nivel(); hum.connect(out);
  for (const [f, v, ty] of [[55, 1, 'sine'], [55.6, 0.8, 'sine'], [110.5, 0.35, 'triangle']]) { const o = ac.createOscillator(); o.type = ty; o.frequency.value = f; const g = ac.createGain(); g.gain.value = v; o.connect(g).connect(hum); o.start(); }
  // ventilación: ruido en banda estrecha cuyo filtro respira muy despacio
  const vent = nivel(); const vbp = ac.createBiquadFilter(); vbp.type = 'bandpass'; vbp.frequency.value = 420; vbp.Q.value = 0.7; loopNoise().connect(vbp).connect(vent); vent.connect(out); lfo(0.07, 90, vbp.frequency);
  // viento: ruido con ráfagas (ganancia y filtro se mecen con dos LFO lentos)
  const wind = nivel(); const wbp = ac.createBiquadFilter(); wbp.type = 'bandpass'; wbp.frequency.value = 500; wbp.Q.value = 0.9; const gust = ac.createGain(); gust.gain.value = 0.7;
  loopNoise().connect(wbp).connect(gust).connect(wind); wind.connect(out); lfo(0.13, 0.3, gust.gain); lfo(0.21, 120, wbp.frequency);
  // vacío: dos tonos graves casi inaudibles
  const vac = nivel(); vac.connect(out); for (const f of [43, 64.7]) { const o = ac.createOscillator(); o.frequency.value = f; o.connect(vac); o.start(); }
  amb = { hum, vent, vbp, wind, wbp, vac, alp };
}
/** Aplica una mezcla de sonido.mezclaAmbiente (o null = silencio). Llamar SOLO cuando cambie (destino, zona, noche, tormenta). */
export function ambiente(m) {
  if (!ac || !amb) return; const t = ac.currentTime, tc = 1.6;
  try {
    amb.hum.gain.setTargetAtTime(m ? m.hum * AMB : 0, t, tc); amb.vent.gain.setTargetAtTime(m ? m.vent * AMB : 0, t, tc); amb.wind.gain.setTargetAtTime(m ? m.wind * AMB : 0, t, tc); amb.vac.gain.setTargetAtTime(m ? m.vac * AMB : 0, t, tc);
    if (m) { amb.vbp.frequency.setTargetAtTime(m.ventF, t, tc); amb.wbp.frequency.setTargetAtTime(m.windF, t, tc); amb.alp.frequency.setTargetAtTime(m.lp, t, tc); }
    ambEco = m?.eco ?? 0; if (ambEco && pingNext < t) pingNext = t + 3 + Math.random() * ambEco;
  } catch { /* nada */ }
}
/** Pantalla de título: el ambiente se apaga y la música vuelve a calma. */
export function idle() { ambiente(null); est.nivel = 0; est.resta = 0; level = 0; tens = 0; }

// ---------- música ----------
function schedule() {
  if (!ac) return;
  const bpm = theme.bpm * (level >= 3 ? 1.35 : level >= 2 ? 1.15 : 1);
  const sx = 60 / bpm / 4; // semicorchea
  while (next < ac.currentTime + 0.12) { if (enabled && hayHueco(6)) play(step, next, sx); step++; next += sx; }
  // eco lejano (Luna): una campanita suave cada cierto tiempo, con la cola del eco de la música
  if (enabled && ambEco && ac.currentTime > pingNext && hayHueco(4)) { pingNext = ac.currentTime + ambEco * (0.7 + Math.random() * 0.8); const th = theme; note(hz(th.root + 24 + th.scale[(Math.random() * 7) | 0]), ac.currentTime + 0.05, 3, 'sine', 0.016); }
}
function play(i, t, sx) {
  const th = theme; const bar = Math.floor(i / 16); const chordDeg = th.prog[Math.floor(bar / 2) % th.prog.length];
  const deg = (k) => { const n = chordDeg + k; return th.root + th.scale[((n % 7) + 7) % 7] + 12 * Math.floor(n / 7); };
  const pos = i % 16;
  // pad: acorde largo cada 2 compases
  if (i % 32 === 0) for (const k of [0, 2, 4]) { note(hz(deg(k) + 12), t, sx * 32, th.pad, 0.025); note(hz(deg(k) + 12) * 1.004, t, sx * 32, th.pad, 0.02); }
  // drone grave
  if (i % 16 === 0) note(hz(th.root - 12 + (th.scale[chordDeg % 7] ?? 0)), t, sx * 16, 'sine', 0.09);
  // arpegio: más denso con la tensión; la sospecha lo sube apenas
  const every = level >= 2 ? 2 : level === 1 ? 3 : 4;
  if (pos % every === 0) {
    const pat = [0, 2, 4, 7, 4, 2, 6, 4]; const k = pat[(i / every | 0) % pat.length];
    if (level > 0 || (i * 7) % 5 !== 0) note(hz(deg(k) + 24), t, sx * (level >= 2 ? 1.5 : 3), th.lead, (level >= 2 ? 0.035 : 0.028) * (1 + tens * 0.3));
  }
  // tensión: bajo pulsante
  if (level >= 1 && pos % 4 === 0) note(hz(deg(0)), t, sx * 2, 'square', 0.03);
  // persecución: latido y nota disonante
  if (level >= 2) { if (pos === 0 || pos === 3) kick(t, pos === 0 ? 0.45 : 0.3); if (pos === 8 && bar % 2) note(hz(deg(0) + 25), t, sx * 6, 'sawtooth', 0.02); }
  // huida final: platillos
  if (level >= 3) { if (pos % 2 === 0) noise(t, 0.04, 0.05); if (pos === 4 || pos === 12) noise(t, 0.12, 0.12, 1500); }
  // calma de noche: campanita lejana
  if (level === 0 && night && pos === 0 && bar % 4 === 3) note(hz(deg(4) + 36), t, 2, 'sine', 0.02);
}

/** Latido del corazón: lo llama el juego cuando algo te persigue (rate 0..1, sonido.tasaLatido). */
let beatNext = 0;
export function heartbeat(rate) {
  if (!ac || !enabled || rate <= 0 || !hayHueco(4)) return; const t = ac.currentTime; if (t < beatNext) return;
  const gap = 0.95 - rate * 0.55; beatNext = t + gap;
  for (const [dt, v] of [[0, 0.55], [0.16, 0.38]]) { const o = ac.createOscillator(); const g = ac.createGain(); o.frequency.setValueAtTime(70, t + dt); o.frequency.exponentialRampToValueAtTime(38, t + dt + 0.12); g.gain.setValueAtTime(0.0001, t + dt); g.gain.exponentialRampToValueAtTime(v * (0.4 + rate * 0.6), t + dt + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + dt + 0.18); o.connect(g).connect(master); vive(o); o.start(t + dt); o.stop(t + dt + 0.2); }
}

// ---------- alertas del núcleo (cola s.sfx) ----------
const GAP = { visto: 0.25, sospecha: 0.6, perdido: 0.6, aviso: 0.5 }; // separación mínima entre dos iguales
/** Golpes de sonido para las claves de s.sfx. opts.suave = el jugador pidió efectos suaves (todo más bajo). */
export function sting(kind, opts = {}) {
  if (!ac || !enabled || !sfxEnabled || !hayHueco(6, true)) return; const t = ac.currentTime + 0.01;
  if (t - (lastBy[kind] ?? -9) < (GAP[kind] ?? 0.1)) return; lastBy[kind] = t;
  const k = opts.suave ? 0.6 : 1; const D = sfxIn;
  if (kind === 'visto') { for (const f of [hz(theme.root + 24), hz(theme.root + 25), hz(theme.root + 31)]) note(f, t, 0.7, 'sawtooth', 0.05 * k, D); noise(t, 0.3, 0.08 * k, 3000, D); duck(0.6, 0.7); }
  else if (kind === 'atrapado') { kick(t, 0.6 * k, D); for (const f of [hz(theme.root - 12), hz(theme.root - 11)]) note(f, t, 1.4, 'sawtooth', 0.06 * k, D); duck(0.5, 1); }
  else if (kind === 'alarma') { const o = ac.createOscillator(); const g = ac.createGain(); o.type = 'square'; o.frequency.setValueAtTime(600, t); for (let i = 0; i < 4; i++) { o.frequency.linearRampToValueAtTime(900, t + i * 0.4 + 0.2); o.frequency.linearRampToValueAtTime(600, t + i * 0.4 + 0.4); } g.gain.setValueAtTime(0.03, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6); o.connect(g).connect(D); vive(o); o.start(t); o.stop(t + 1.7); duck(0.65, 1.2); }
  else if (kind === 'radio') { noise(t, 0.25, 0.06, 2000, D); note(1200, t + 0.25, 0.08, 'square', 0.03, D); note(1500, t + 0.36, 0.08, 'square', 0.03, D); }
  else if (kind === 'susto') { noise(t, 0.5, 0.18 * k, 800, D); for (const f of [hz(theme.root + 36), hz(theme.root + 37), hz(theme.root + 42)]) note(f, t, 1.1, 'sawtooth', 0.06 * k, D); kick(t, 0.6 * k, D); } // más suave que antes (público de 10 a 14 años)
  else if (kind === 'nota') { for (const [d, f] of [[0, 660], [0.12, 880], [0.24, 1320]]) note(f, t + d, 0.3, 'sine', 0.06, D); }
  else if (kind === 'boom') { noise(t, 0.8, 0.2 * k, 200, D); kick(t, 0.7 * k, D); }
  // ---- nuevas: la IA empieza a dudar (glissando suave hacia arriba, como una pregunta) ----
  else if (kind === 'sospecha') { const j = jit(0.03); glide(380 * j, 500 * j, t, 0.3, 'sine', 0.07, D); glide(380 * j * 2, 500 * j * 2, t, 0.3, 'sine', 0.02, D); duck(0.8, 0.4); }
  // ---- perdió el rastro (dos notas que bajan y un soplo de aire: alivio) ----
  else if (kind === 'perdido') { note(587, t, 0.2, 'triangle', 0.05, D); note(440, t + 0.17, 0.35, 'triangle', 0.045, D); noise(t + 0.1, 0.5, 0.03, 1800, D, 'lowpass'); }
  // ---- cuenta atrás de un peligro: tres golpecitos secos «ti-ti-TI» (no se parece a la alarma que barre) ----
  else if (kind === 'aviso') { [740, 740, 988].forEach((f, i) => note(f, t + i * 0.19, 0.09, 'triangle', 0.07, D)); duck(0.7, 0.8); }
}

// ---------- efectos de acción ----------
/** Efecto de una acción del jugador o del entorno. o.suave = efectos suaves; o.u = urgente (emergencia). */
export function sfx(kind, o = {}) {
  if (!puede(5) || !sfxEnabled) return; const t = ac.currentTime + 0.005; const D = sfxIn;
  if (kind === 'interactuar') { note(480 * jit(), t, 0.07, 'sine', 0.04, D); noise(t, 0.04, 0.03, 2500, D, 'bandpass'); }
  else if (kind === 'recoger') { note(620 * jit(), t, 0.08, 'sine', 0.045, D); note(930 * jit(), t + 0.06, 0.12, 'sine', 0.04, D); }
  else if (kind === 'soltar') { note(420 * jit(), t, 0.1, 'sine', 0.04, D); note(280 * jit(), t + 0.05, 0.13, 'sine', 0.035, D); noise(t + 0.04, 0.09, 0.04, 500, D, 'lowpass'); }
  else if (kind === 'lanzar') { noise(t, 0.3, 0.06, 1400, D, 'bandpass', 500); }
  else if (kind === 'fabricar') { for (let i = 0; i < 3; i++) { noise(t + i * 0.09, 0.05, 0.05, 2200, D, 'bandpass'); note(1100 * jit(0.05), t + i * 0.09, 0.06, 'triangle', 0.03, D); } note(880, t + 0.32, 0.22, 'sine', 0.05, D); note(1320, t + 0.4, 0.28, 'sine', 0.04, D); }
  else if (kind === 'mant') { [523, 659, 784].forEach((f, i) => note(f, t + i * 0.1, 0.18 + i * 0.1, 'sine', 0.05, D)); note(262, t, 0.55, 'triangle', 0.03, D); }
  else if (kind === 'resuelto') { note(784, t, 0.14, 'sine', 0.05, D); note(1175, t + 0.1, 0.4, 'sine', 0.045, D); note(1568, t + 0.1, 0.3, 'triangle', 0.015, D); }
  else if (kind === 'salvado') { [523, 659, 784, 1047].forEach((f, i) => note(f, t + i * 0.09, 0.3, 'sine', 0.05, D)); note(262, t, 0.8, 'triangle', 0.05, D); noise(t + 0.3, 0.6, 0.02, 2500, D, 'lowpass'); duck(0.6, 0.8); }
  else if (kind === 'golpe') { if (o.suave) { note(110, t, 0.14, 'sine', 0.05, D); noise(t, 0.08, 0.03, 600, D, 'lowpass'); } else { kick(t, 0.35, D); noise(t, 0.1, 0.07, 900, D, 'lowpass'); } }
  else if (kind === 'emerg') { const u = o.u ? 1.25 : 1; note(880 * u, t, 0.09, 'triangle', 0.05, D); note(660 * u, t + 0.11, 0.11, 'triangle', 0.05, D); }
  else if (kind === 'tic') { noise(t, 0.03, 0.05, 3000, D, 'bandpass'); note(1250 * jit(0.02), t, 0.035, 'sine', 0.03, D); }
  else if (kind === 'fin_bien') { [523, 659, 784, 1047, 1319].forEach((f, i) => note(f, t + i * 0.18, 0.6, 'sine', 0.05, D)); }
  else if (kind === 'fin_mal') { [392, 330, 262, 196].forEach((f, i) => note(f, t + i * 0.24, 0.7, 'triangle', 0.05, D)); }
}
/** Un paso sobre una superficie de sonido.superficiePaso ('metal' | 'polvo' | 'casco'); null = nada. Alterna pie y varía la afinación. */
export function paso(surf) {
  if (!surf || !puede(3) || !sfxEnabled) return; const t = ac.currentTime + 0.005; foot ^= 1; const j = jit(0.06) * (foot ? 1 : 0.93); const D = sfxIn;
  if (surf === 'metal') { noise(t, 0.05, 0.035, 1500 * j, D, 'bandpass'); note(160 * j, t, 0.06, 'sine', 0.03, D); }
  else if (surf === 'polvo') noise(t, 0.11, 0.05, 520 * j, D, 'lowpass');
  else if (surf === 'casco') { note(95 * j, t, 0.09, 'sine', 0.035, D); noise(t, 0.05, 0.02, 320, D, 'lowpass'); }
}

// ---------- interfaz ----------
/** Sonido de interfaz: 'click' | 'abrir' | 'cerrar' | 'ok' | 'error' | 'info' | 'paso'. Corto, suave y con separación mínima para que no se pisen. */
export function ui(kind) {
  if (!puede(4) || !sfxEnabled) return; const t = ac.currentTime;
  const g = kind === 'abrir' || kind === 'cerrar' ? 'panel' : kind; if (t - (lastBy['ui' + g] ?? -9) < (g === 'panel' ? 0.15 : 0.05)) return;
  if (kind === 'click' && t - (lastBy.uiotro ?? -9) < 0.12) return; // el clic cede ante el sonido propio de la acción (abrir, ok, error…)
  lastBy['ui' + g] = t; if (kind !== 'click') lastBy.uiotro = t;
  const d = t + 0.005; const j = jit(); const D = sfxIn;
  if (kind === 'click') note(1100 * j, d, 0.05, 'triangle', 0.03, D);
  else if (kind === 'abrir') { note(520 * j, d, 0.09, 'sine', 0.04, D); note(780 * j, d + 0.07, 0.12, 'sine', 0.035, D); }
  else if (kind === 'cerrar') { note(700 * j, d, 0.08, 'sine', 0.035, D); note(460 * j, d + 0.06, 0.11, 'sine', 0.035, D); }
  else if (kind === 'ok') { note(660 * j, d, 0.16, 'sine', 0.05, D); note(990 * j, d + 0.09, 0.22, 'sine', 0.045, D); }
  else if (kind === 'error') { note(190 * j, d, 0.2, 'triangle', 0.06, D); note(150 * j, d + 0.12, 0.25, 'triangle', 0.05, D); }
  else if (kind === 'info') note(740 * j, d, 0.12, 'sine', 0.03, D);
  else if (kind === 'paso') note(560 * j, d, 0.07, 'triangle', 0.035, D);
}
/** Tono suelto (compatibilidad con el viejo beep de main.js): sale por el mismo bus, con volumen y duración acotados. */
export function tone(f = 440, d = 0.08, type = 'square', v = 0.035) {
  if (!puede(2) || !sfxEnabled) return; const a = acotaTono(v, d); note(f, ac.currentTime + 0.005, a.dur, type, a.vol, sfxIn);
}

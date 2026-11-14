// Sistemas vitales de la base: soporte vital, energía, radiación y comida.
// La rutina de trabajo (08:00–12:00) ES el mantenimiento: sin él, los sistemas se degradan y se arrastran entre sí.
// Opcional: emergencias de REFLEJOS (meteoritos, sobrecargas…) que se disparan al hacer mantenimiento y matan si no las atiendes.
// Lógica pura (sin pantalla): todo vive en s.sys y se guarda con la partida.
import * as C from './core.js';

/** Los 4 sistemas. decay = puntos que baja por día sin mantenimiento (Normal ×0.7). */
export const SYS = {
  vida: { name: 'SOPORTE VITAL', task: 'Cambiar el filtro de CO₂', short: 'Filtro de CO₂', decay: 30, restore: 55 },
  energia: { name: 'ENERGÍA', task: 'Orientar los paneles solares', short: 'Paneles solares', decay: 26, restore: 55 },
  rad: { name: 'RADIACIÓN', task: 'Revisar el blindaje y el dosímetro', short: 'Blindaje y dosímetro', decay: 28, restore: 55 },
  comida: { name: 'COMIDA', task: 'Regar y cosechar el invernadero', short: 'Invernadero', decay: 28, restore: 50 },
};
export const SYS_IDS = Object.keys(SYS);

export const START_LVL = 90;
export const DOSE_DAY = 0.4;     // mSv/día con el blindaje al 100 % (en la ISS real: 0,2–0,5)
export const DOSE_LIMIT = 8;     // "límite de la misión" del juego (el real de la NASA es 600 mSv, pero para TODA la carrera)
export const WORK = { from: 480, to: 720 };
export const NASA_NOTE = 'Dato NASA: en la ISS un astronauta recibe 0,2–0,5 mSv al día. Su límite para TODA la carrera es 600 mSv (NASA-STD-3001), y el lema es ALARA: tan poca radiación como sea razonable.';

const clamp = (v) => Math.max(0, Math.min(100, v));

// Sabor y ESCASEZ propios de cada destino (L.sysFlavor en locs.js): textos de las tareas, dosis de radiación y eventos por días.
// Un evento (p. ej. la noche lunar) cambia el ritmo de un sistema durante varios días: obliga a elegir qué cuidar primero.
const fl = (s) => s.L.sysFlavor ?? {};
export const taskName = (s, id) => fl(s).tasks?.[id]?.[0] ?? SYS[id].task;
export const taskShort = (s, id) => fl(s).tasks?.[id]?.[1] ?? SYS[id].short;
/** Eventos de escasez activos hoy. */
export const mods = (s) => (fl(s).events ?? []).filter((e) => s.day >= e.from && s.day <= e.to);
const doseMul = (s) => fl(s).doseMul ?? 1;
const decayMul = (s, id) => mods(s).reduce((m, e) => (e.sys === id ? m * (e.decay ?? 1) : m), 1);
const restoreMul = (s, id) => mods(s).reduce((m, e) => (e.sys === id ? m * (e.restore ?? 1) : m), 1);

/** Emergencias de reflejos. sys = qué sistema las provoca; spot = 'estacion' (el panel del sistema) o 'brecha' (un punto cualquiera). */
export const EMERGS = {
  meteorito: { name: 'IMPACTO DE MICROMETEORITO', verb: 'Sellar la brecha', spot: 'brecha', sys: 'vida', hurt: 'integ',
    text: (room) => `¡Un micrometeorito perforó el casco en ${room}! Corre a la brecha y séllala antes de que se escape el aire.`,
    fatal: ['Despresurización', 'La brecha del casco no se selló a tiempo y la estación perdió su aire. Una fuga de presión es de las emergencias más graves en el espacio: por eso la tripulación entrena para reaccionar rápido.'] },
  sobrecarga: { name: 'SOBRECARGA ELÉCTRICA', verb: 'Reiniciar el panel de energía', spot: 'estacion', sys: 'energia',
    text: (room) => `¡Sobrecarga en los paneles! Ve a ${room} y reinicia el sistema antes de que se queme.`,
    fatal: ['Incendio eléctrico', 'La sobrecarga no se cortó a tiempo y se declaró un incendio eléctrico. El fuego es una de las emergencias más peligrosas en una nave cerrada.'] },
  co2: { name: 'ALARMA DE CO₂', verb: 'Purgar el depurador de aire', spot: 'estacion', sys: 'vida',
    text: (room) => `¡Alarma de CO₂ alto! Ve a ${room} y purga el depurador antes de perder el conocimiento.`,
    fatal: ['Intoxicación por CO₂', 'El CO₂ subió demasiado: sin filtros limpios el aire se vuelve irrespirable aunque haya oxígeno. Por eso el mantenimiento del soporte vital va primero.'] },
  llamarada: { name: 'LLAMARADA SOLAR', verb: 'Activar el refugio del blindaje', spot: 'estacion', sys: 'rad',
    text: (room) => `¡Llamarada solar! Corre a ${room} y activa el refugio de radiación antes de que lleguen las partículas.`,
    fatal: ['Dosis aguda de radiación', 'Las partículas solares te alcanzaron sin protección. La NASA limita la dosis de una tormenta solar a 250 mSv por evento y diseña refugios para eso.'] },
  incendio: { name: 'INCENDIO EN EL INVERNADERO', verb: 'Usar el extintor del invernadero', spot: 'estacion', sys: 'comida',
    text: (room) => `¡Fuego en el invernadero! Ve a ${room} y apágalo antes de que se extienda.`,
    fatal: ['Incendio a bordo', 'El fuego del invernadero se extendió por la estación. Con el aire reciclado y sin salida, un incendio no se puede dejar crecer.'] },
};

/** Estado inicial. Solo en destinos con L.systems y en modo campaña. */
export function init(s, opts = {}) {
  if (!s.L.systems || s.mode === 'noche') { s.sys = null; return; }
  s.sys = {
    lvl: Object.fromEntries(SYS_IDS.map((id) => [id, START_LVL])), dose: 0,
    done: {}, warn: {}, remind: false, emToday: 0, emerg: null,
    reflex: !!opts.reflex && !opts.daily,
    st: { done: 0, skipped: 0, perfect: 0, saved: 0 },
  };
}

export const dosePct = (s) => (s.sys.dose / DOSE_LIMIT) * 100;
export const station = (s, id) => s.objects.find((o) => o.t === 'mant' && o.sys === id);
const stationRoom = (s, id) => { const o = station(s, id); return o ? C.roomName(s, C.roomIdAt(s, o.x + 0.5, o.y + 0.5)) : '—'; };
export const pending = (s) => (s.sys ? SYS_IDS.filter((id) => !s.sys.done[id]) : []);

export function newDay(s) {
  const y = s.sys; if (!y) return;
  y.done = {}; y.remind = false; y.emToday = 0;
  for (const e of fl(s).events ?? []) {
    if (s.day === e.from) C.say(s, `${s.L.ai}: ${e.msg}`, 'bad');
    else if (s.day === e.to + 1) C.say(s, `${e.end}`, 'ok');
  }
  const miss = SYS_IDS.filter((id) => y.lvl[id] < 50).map((id) => SYS[id].name.toLowerCase());
  if (miss.length) C.say(s, `${s.L.ai}: sistemas débiles hoy → ${miss.join(', ')}. Hoy toca mantenimiento 08:00–12:00.`, 'ia');
}

/** Empieza el turno de mantenimiento. */
export function workStart(s) {
  if (!s.sys) return;
  C.say(s, `Turno de MANTENIMIENTO (08:00–12:00): ${SYS_IDS.length} revisiones obligatorias. Mira el panel SISTEMAS.`, 'info');
}

/** Termina un bloque. Si era el de trabajo, lo que quedó sin hacer se paga. */
export function blockEnd(s, prevId) {
  const y = s.sys; if (!y || prevId !== 'trabajo') return;
  const d = C.dif(s).dmg; const left = pending(s);
  if (!left.length) { y.st.perfect++; s.alert = Math.max(0, s.alert - 5); C.say(s, `${s.L.ai}: mantenimiento completo. Bien hecho, cadete. (−5 de alerta)`, 'ok'); return; }
  for (const id of left) {
    y.lvl[id] = clamp(y.lvl[id] - 10 * d); y.st.skipped++; s.integ -= 2;
    C.raise(s, 6, `Mantenimiento omitido: ${taskName(s, id).toLowerCase()}.`);
    C.say(s, `${SYS[id].name} se degradó por no hacer el mantenimiento (${Math.round(y.lvl[id])} %).`, 'warn', true); // el aviso de CUSTODIA de arriba ya lo cuenta: no se repite en pantalla
  }
}

/** Texto de la tecla E sobre un panel de mantenimiento. */
export function label(s, o) {
  const y = s.sys; if (!y) return '';
  return y.done[o.sys] ? `${SYS[o.sys].name}: revisado hoy ✔` : `Mantenimiento: ${taskName(s, o.sys)}`;
}

/** Tecla E sobre un panel: empieza la revisión (solo en el turno de trabajo). */
export function useStation(s, o) {
  const y = s.sys; if (!y) return;
  if (C.block(s).id !== 'trabajo') return C.flash(s, 'El mantenimiento se hace en el turno de trabajo (08:00–12:00).', 'info');
  if (y.done[o.sys]) return C.flash(s, `${SYS[o.sys].name}: ya lo revisaste hoy.`, 'info');
  if (s.p.energia < 6) return C.flash(s, 'Estás demasiado cansado para trabajar. Come o descansa.', 'warn');
  s.action = { kind: 'mant', need: 3, t: 0, o };
}

/** Terminó una acción de mantenimiento o de emergencia. */
export function finish(s, a) {
  const y = s.sys; if (!y) return;
  if (a.kind === 'mant') {
    const id = a.o.sys; y.done[id] = true; y.st.done++;
    y.lvl[id] = clamp(y.lvl[id] + SYS[id].restore * restoreMul(s, id)); s.p.energia = Math.max(0, s.p.energia - 2);
    C.say(s, `✔ ${taskName(s, id)}. ${SYS[id].name}: ${Math.round(y.lvl[id])} %.`, 'ok');
    if (pending(s).length === 0) C.say(s, 'Las 4 revisiones de hoy están listas.', 'ok');
    maybeEmergency(s, id);
  } else if (a.kind === 'emerg' && y.emerg) {
    const e = EMERGS[y.emerg.kind]; const id = e.sys;
    y.lvl[id] = clamp(y.lvl[id] + 15); y.emerg = null; y.st.saved++; s.stats.solved++;
    C.flash(s, `¡Controlado! ${e.name} resuelta.`, 'ok');
  }
}

/** ¿Hay una emergencia de reflejos cerca para atender con E? */
export function emergNear(s) {
  const e = s.sys?.emerg; if (!e) return null;
  const d = Math.hypot(e.x - s.p.x, e.y - s.p.y); return d < 1.6 ? { kind: 'emerg', d: -0.2 } : null;
}
export const emergLabel = (s) => `¡${EMERGS[s.sys.emerg.kind].verb}!`;
export function fixEmerg(s) { if (s.sys?.emerg) s.action = { kind: 'emerg', need: 1.5, t: 0, o: null }; }

/** Al terminar un mantenimiento, con REFLEJOS activado, puede saltar una emergencia. */
function maybeEmergency(s, justDone) {
  const y = s.sys; if (!y.reflex || y.emerg || y.emToday >= 2 || s.over) return;
  if (C.rand(s) > Math.min(0.7, 0.4 + 0.04 * (s.day - 1))) return;
  startEmergency(s, justDone);
}
export function startEmergency(s, avoidSys = null, forceKind = null) {
  const y = s.sys; if (!y || y.emerg) return null;
  let kinds = Object.keys(EMERGS).filter((k) => EMERGS[k].sys !== avoidSys || k === 'meteorito');
  if (forceKind) kinds = [forceKind];
  // causa y efecto: el sistema más descuidado provoca su propia emergencia
  const weak = SYS_IDS.filter((id) => y.lvl[id] < 40 && id !== avoidSys).sort((a, b) => y.lvl[a] - y.lvl[b])[0];
  const own = weak && kinds.filter((k) => EMERGS[k].sys === weak);
  const kind = !forceKind && own?.length && C.rand(s) < 0.6 ? own[0] : C.pick(s, kinds);
  const e = EMERGS[kind]; let x, y0;
  if (e.spot === 'estacion') { const o = station(s, e.sys); x = o.x + 0.5; y0 = o.y + 0.5; }
  else {
    const rooms = s.L.rooms.filter((r) => !r.restricted && !r.outside && r.id !== 'dorm' && r.id !== C.playerRoom(s));
    const r = C.pick(s, rooms); x = r.x + 1 + Math.floor(C.rand(s) * (r.w - 2)) + 0.5; y0 = r.y + 1 + Math.floor(C.rand(s) * (r.h - 2)) + 0.5;
  }
  const len = C.path(s, s.p.x, s.p.y, x, y0, 'p')?.length ?? 40;
  const total = (6 + len / 2.8) * (C.dif(s).react ?? 1);
  y.emerg = { kind, x, y: y0, t: total, total, room: C.roomIdAt(s, x, y0) };
  y.emToday++;
  if (e.hurt === 'integ') s.integ -= 3;
  s.sfx?.push('alarma');
  C.flash(s, `⚠ ${e.name}: ${e.text(C.roomName(s, y.emerg.room))} (${Math.ceil(total)} s)`, 'bad');
  return y.emerg;
}

/** Cada frame: desgaste, efectos en cascada, dosis, avisos y cuenta atrás. */
export function update(s, dt, dm) {
  const y = s.sys; if (!y || s.over) return;
  const p = s.p; const k = C.dif(s).dmg * dm / 1440; const L = y.lvl;
  const lowPower = L.energia < 35;
  L.energia = clamp(L.energia - SYS.energia.decay * k * decayMul(s, 'energia'));
  for (const id of ['vida', 'rad', 'comida']) L[id] = clamp(L[id] - SYS[id].decay * k * decayMul(s, id) * (lowPower ? 1.6 : 1));
  y.dose += DOSE_DAY * doseMul(s) * (1 + (100 - L.rad) / 60) * dm / 1440;

  let cause = null;
  if (L.vida < 30) p.energia = Math.max(0, p.energia - 0.05 * dm);
  if (L.vida <= 0) { p.salud -= 0.25 * dm; p.hit = 0.2; cause = 'vida'; }
  if (L.comida < 30) p.energia = Math.max(0, p.energia - 0.04 * dm);
  if (L.comida <= 0) { p.salud -= 0.08 * dm; p.hit = 0.2; cause ??= 'comida'; }
  for (const id of SYS_IDS) if (L[id] <= 0) s.integ -= 0.02 * dm;
  if (p.salud <= 0 && cause === 'vida') C.end(s, false, 'Sin aire respirable', 'El depurador de CO₂ dejó de funcionar y el aire se volvió irrespirable. En la estación real, el soporte vital es lo primero que se revisa cada día.');
  else if (p.salud <= 0 && cause === 'comida') C.end(s, false, 'Sin raciones', 'Se acabó la comida del invernadero y la tripulación no resistió. Producir alimento a bordo es parte del mantenimiento diario.');

  // avisos escalonados, como el sistema de Precaución y Advertencia de una nave
  for (const id of SYS_IDS) {
    const lvl = L[id]; const w = y.warn[id] ?? 0;
    if (lvl >= 60) y.warn[id] = 0;
    else if (lvl < 25 && w < 2) { y.warn[id] = 2; C.flash(s, `🚨 ADVERTENCIA: ${SYS[id].name} al ${Math.round(lvl)} %. ¡Hazle mantenimiento ya!`, 'bad'); }
    else if (lvl < 50 && w < 1) { y.warn[id] = 1; C.say(s, `⚠ PRECAUCIÓN: ${SYS[id].name} al ${Math.round(lvl)} %.`, 'warn'); }
  }
  const pct = dosePct(s);
  for (const [lim, key] of [[50, 'd50'], [75, 'd75'], [90, 'd90']]) if (pct >= lim && !y.warn[key]) { y.warn[key] = 1; C.say(s, `☢ Dosis de radiación: ${Math.round(pct)} % del límite de la misión.`, pct >= 90 ? 'bad' : 'warn'); }
  if (pct >= 100) C.end(s, false, 'Dosis límite superada', `Pasaste el límite de radiación de la misión (${y.dose.toFixed(1)} mSv). La NASA trabaja con ALARA: tan poca como sea razonable. Con el blindaje sin revisar, entró más radiación cada día.`);

  // recordatorio a las 11:00
  if (!y.remind && s.min >= 660 && C.block(s).id === 'trabajo' && pending(s).length) { y.remind = true; C.flash(s, `Queda 1 hora de turno. Falta: ${pending(s).map((id) => SYS[id].name.toLowerCase()).join(', ')}.`, 'warn'); }

  // cuenta atrás de la emergencia
  const e = y.emerg;
  if (e && !s.pending) {
    e.t -= dt;
    if (e.t <= 0) { const [title, text] = EMERGS[e.kind].fatal; y.emerg = null; C.end(s, false, title, text); }
  }
}

/** Datos listos para dibujar el panel. */
export function view(s) {
  const y = s.sys; if (!y) return null;
  const e = y.emerg; const ed = e ? EMERGS[e.kind] : null;
  return {
    meters: SYS_IDS.map((id) => ({ id, name: SYS[id].name, v: y.lvl[id], low: y.lvl[id] < 30 })),
    dose: y.dose, dosePct: dosePct(s), blind: y.lvl.rad, limit: DOSE_LIMIT, note: fl(s).note ?? NASA_NOTE, events: mods(s).map((e) => ({ name: e.name, text: e.hud })),
    tasks: SYS_IDS.map((id) => ({ id, name: taskName(s, id), short: taskShort(s, id), room: stationRoom(s, id), done: !!y.done[id] })),
    reflex: y.reflex,
    emerg: e ? { name: ed.name, verb: ed.verb, t: e.t, total: e.total, room: C.roomName(s, e.room), x: e.x, y: e.y } : null,
  };
}

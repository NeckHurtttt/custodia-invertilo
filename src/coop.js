// Cooperativo entre computadoras: ASTRONAUTA (juega en la base) + CONTROL DE MISIÓN (otra computadora, ve la base y ayuda).
// Lógica pura (sin pantalla ni red): la red vive en link.js y la pantalla en coopui.js. Así se puede probar en Node.
//   host  (astronauta)  → manda una foto de la base cada 0,5 s ('snap') y ejecuta las órdenes que llegan ('cmd').
//   guest (Control)     → dibuja la foto y manda órdenes. Solo puede ayudar con cosas de la lista de abajo: no mueve al astronauta.
// Mensajes (JSON): host→guest {t:'hi',loc,dif,mode,delay} · {t:'snap',...} · {t:'ack',k,ok,text}   guest→host {t:'cmd',k,...}
import * as C from './core.js';
import * as Sys from './sistemas.js';
import { T } from './i18n.js';
import { SIGNAL_DELAY } from './common.js';

export const SNAP_EVERY = 0.5;      // segundos reales entre fotos (Control de Misión)
export const SNAP_CREW_EVERY = 0.066; // el compañero que camina necesita ~15 estados por segundo
/** Retraso de la señal (s) que se simula. Realidad: Luna ≈ 1,3 s; Marte entre 3 y 22 MINUTOS (aquí acelerado para que se pueda jugar). */
export const DELAY = SIGNAL_DELAY;
export const DELAY_NOTE = { estacion: 'La ISS está a ~400 km: la señal llega casi al instante.', luna: 'La Luna está a ~1,3 s luz: cada orden tarda en llegar.', marte: 'Marte está a 3–22 minutos luz. Aquí lo acortamos a 6 s, pero las órdenes llegan tarde: anticípate.' };

/** Órdenes que puede dar Control. cd = segundos de espera antes de repetir la misma. */
export const CMD = {
  apoyo: { cd: 30, name: 'Reasignar recursos', help: '+12 al sistema elegido, −3 a los otros tres' },
  abrir: { cd: 8, name: 'Abrir escotilla', help: 'Abre a distancia una escotilla que la IA cerró (las de tarjeta no)' },
  marca: { cd: 6, name: 'Marcar un punto', help: 'Pone una baliza en el mapa del astronauta (20 s)' },
  aviso: { cd: 4, name: 'Mensaje', help: 'Un aviso corto para el astronauta' },
};
/** Mensajes prefabricados (sin texto libre: así no hay insultos ni líos en clase). */
export const AVISOS = {
  panel: ['Ve a un panel de mantenimiento: hay revisiones pendientes.', 'info'],
  emerg: ['¡Atiende la emergencia primero!', 'warn'],
  peligro: ['Peligro cerca: ¡aléjate!', 'warn'],
  mascara: ['Ponte la máscara y respira con calma.', 'warn'],
  refugio: ['¡Corre al refugio de radiación!', 'warn'],
  bien: ['Buen trabajo. Sigue así.', 'ok'],
};

/** Foto de la base para Control. `since` = último id de aviso que ya recibió. */
const enGet = (obj, prop, en) => { const es = obj[prop]; Object.defineProperty(obj, prop, { get: () => T(es, en), enumerable: true, configurable: true }); };
const DELAY_NOTE_EN = { estacion: 'The ISS is ~400 km away: the signal arrives almost instantly.', luna: 'The Moon is ~1.3 light-seconds away: every order takes time to arrive.', marte: 'Mars is 3–22 light-minutes away. Here we shorten it to 6 s, but orders still arrive late: plan ahead.' };
for (const k of Object.keys(DELAY_NOTE_EN)) enGet(DELAY_NOTE, k, DELAY_NOTE_EN[k]);
const CMD_EN = { apoyo: ['Reassign resources', '+12 to the chosen system, −3 to the other three'], abrir: ['Open hatch', 'Remotely opens a hatch the AI closed (card hatches stay shut)'], marca: ['Mark a spot', 'Puts a beacon on the astronaut map (20 s)'], aviso: ['Message', 'A short notice for the astronaut'] };
for (const [k, [n, h]] of Object.entries(CMD_EN)) { enGet(CMD[k], 'name', n); enGet(CMD[k], 'help', h); }
const AVISOS_EN = { panel: 'Go to a maintenance panel: there are pending checks.', emerg: 'Handle the emergency first!', peligro: 'Danger nearby: move away!', mascara: 'Put on your mask and breathe calmly.', refugio: 'Run to the radiation shelter!', bien: 'Good work. Keep it up.' };
for (const [k, en] of Object.entries(AVISOS_EN)) { const a = AVISOS[k]; const es = a[0]; Object.defineProperty(a, 0, { get: () => T(es, en), enumerable: true, configurable: true }); }

export function snapshot(s, since = 0, mark = null, paused = false) {
  const view = Sys.view(s); const b = C.block(s);
  return {
    t: 'snap', loc: s.L.id, lay: s.lay ?? null, day: s.day, min: Math.floor(s.min), clock: C.clock(s.min), block: { id: b.id, name: b.name }, paused,
    p: { x: +s.p.x.toFixed(2), y: +s.p.y.toFixed(2), salud: Math.round(s.p.salud), energia: Math.round(s.p.energia), room: C.roomName(s, C.playerRoom(s)), hidden: !!s.p.hidden },
    alert: Math.round(s.alert), integ: Math.round(s.integ), ia: s.iaOn,
    sys: view && { meters: view.meters.map((m) => ({ id: m.id, name: m.name, v: Math.round(m.v) })), dosePct: Math.round(view.dosePct), tasks: view.tasks.map((k) => ({ id: k.id, short: k.short, room: k.room, done: k.done })), events: view.events, emerg: view.emerg && { ...view.emerg, t: Math.ceil(view.emerg.t) }, clima: view.clima, storm: view.storm && { ...view.storm, t: Math.ceil(view.storm.t) } },
    haz: s.hazards.filter((h) => h.def.name).map((h) => ({ name: h.def.name, x: +h.x.toFixed(1), y: +h.y.toFixed(1), room: C.roomName(s, h.room ?? C.roomIdAt(s, h.x, h.y)) })).slice(0, 12),
    doors: s.map.doors.map((d) => (d.open ? 1 : 0) + (d.lock ? 2 : 0)),
    log: s.log.filter((l) => (l.id ?? 0) > since).slice(-8).map((l) => ({ id: l.id, text: l.text.replace(/<[^>]+>/g, ''), kind: l.kind })),
    logSeq: s.logSeq ?? 0, mark, over: s.over ? { won: !!s.over.won, title: s.over.title } : null,
  };
}

const hhmm = (min) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
/**
 * Lo que Control ve del clima espacial, listo para pintar (lógica pura, con pruebas): la llamarada REAL que viene, la cuenta atrás de la tormenta,
 * si el astronauta ya está en el refugio y si el aviso de Control llegaría tarde por el retraso de la señal (delay, en segundos).
 * Devuelve { modo: 'espera'|'tormenta'|'fin', lineas, urgente, boton, tarde } o null si este modo no tiene sistemas.
 */
export function climaView(sn, delay = 0) {
  const y = sn?.sys; const c = y?.clima; if (!c) return null;
  const st = y.storm;
  if (st) {
    const llega = st.phase === 'aviso'; const falta = !st.inShelter; const tarde = falta && delay >= st.t;
    return {
      modo: 'tormenta', urgente: falta, boton: falta, tarde,
      lineas: [
        T(`TORMENTA SOLAR ${st.n} de ${c.total}: ${llega ? `las partículas llegan en ${st.t} s` : `las partículas están pasando (${st.t} s más)`}.`, `SOLAR STORM ${st.n} of ${c.total}: ${llega ? `the particles arrive in ${st.t} s` : `the particles are passing (${st.t} s more)`}.`),
        st.source,
        T(`Refugio: ${st.shelter}. El astronauta ${st.inShelter ? 'YA ESTÁ en el refugio ✔' : 'está AFUERA'}.`, `Shelter: ${st.shelter}. The astronaut ${st.inShelter ? 'IS ALREADY in the shelter ✔' : 'is OUTSIDE'}.`),
        ...(falta && delay ? [tarde ? T(`⚠ Tu aviso tarda ${delay} s en llegar: casi no llega a tiempo.`, `⚠ Your message takes ${delay} s to arrive: it will barely make it.`) : T(`Tu aviso tarda ${delay} s en llegar: avisa ya.`, `Your message takes ${delay} s to arrive: warn now.`)] : []),
      ],
    };
  }
  if (c.day) return { modo: 'espera', urgente: false, boton: false, tarde: false, lineas: [T(`Próxima tormenta: día ${c.day} a las ${hhmm(c.min)} (ya pasaron ${c.n} de ${c.total}).`, `Next storm: day ${c.day} at ${hhmm(c.min)} (${c.n} of ${c.total} have passed).`), ...(c.flare ? [c.flare.text] : [])] };
  return { modo: 'fin', urgente: false, boton: false, tarde: false, lineas: [T(`Ya pasaron las ${c.total} tormentas de esta misión.`, `All ${c.total} storms of this mission have passed.`)] };
}

/** Ejecuta una orden de Control sobre la partida. Devuelve { ok, text }. Es la ÚNICA puerta por la que Control cambia algo. */
export function applyCommand(s, cmd, host = null) {
  if (!cmd || !CMD[cmd.k] || s.over) return { ok: false, text: T('Orden no válida.', 'Invalid order.') };
  switch (cmd.k) {
    case 'aviso': {
      const a = AVISOS[cmd.id]; if (!a) return { ok: false, text: T('Mensaje no válido.', 'Invalid message.') };
      const st = cmd.id === 'refugio' ? Sys.view(s)?.storm : null; // con tormenta en curso, el mensaje dice cuál es el refugio
      if (st && st.inShelter) { C.say(s, T('📡 Control de Misión: Buen trabajo, ya estás en el refugio. Quédate hasta que pase.', '📡 Mission Control: Good job, you are in the shelter. Stay until it passes.'), 'ok'); break; }
      C.say(s, `📡 ${T('Control de Misión', 'Mission Control')}: ${a[0]}${st ? T(` Refugio: ${st.shelter}.`, ` Shelter: ${st.shelter}.`) : ''}`, a[1]); break;
    }
    case 'apoyo': {
      if (!s.sys || !Sys.SYS_IDS.includes(cmd.sys)) return { ok: false, text: T('Ese sistema no existe aquí.', 'That system does not exist here.') };
      for (const id of Sys.SYS_IDS) s.sys.lvl[id] = Math.max(0, Math.min(100, s.sys.lvl[id] + (id === cmd.sys ? 12 : -3)));
      C.say(s, T(`📡 Control de Misión reasignó recursos a ${Sys.SYS[cmd.sys].name} (+12; los otros −3).`, `📡 Mission Control reassigned resources to ${Sys.SYS[cmd.sys].name} (+12; the others −3).`), 'ok'); break;
    }
    case 'abrir': {
      const d = s.map.doors[cmd.door]; if (!d) return { ok: false, text: T('Esa escotilla no existe.', 'That hatch does not exist.') };
      if (d.lock) return { ok: false, text: T('Esa escotilla tiene candado: no se abre a distancia.', 'That hatch is locked: it cannot be opened remotely.') };
      d.open = true; C.say(s, T(`📡 Control de Misión abrió una escotilla (${C.roomName(s, d.room)}).`, `📡 Mission Control opened a hatch (${C.roomName(s, d.room)}).`), 'info'); break;
    }
    case 'marca': {
      const x = Math.max(0, Math.min(s.L.W - 1, +cmd.x)), y = Math.max(0, Math.min(s.L.H - 1, +cmd.y)); if (!Number.isFinite(x + y)) return { ok: false, text: T('Punto no válido.', 'Invalid point.') };
      if (host) host.mark = { x: Math.floor(x) + 0.5, y: Math.floor(y) + 0.5, t: 20 };
      C.say(s, T(`📡 Control de Misión marcó un punto en: ${C.roomName(s, C.roomIdAt(s, x, y))}.`, `📡 Mission Control marked a point in: ${C.roomName(s, C.roomIdAt(s, x, y))}.`), 'info'); break;
    }
  }
  s.coopHelps = (s.coopHelps ?? 0) + 1;
  return { ok: true, text: CMD[cmd.k].name };
}

/** Lado del astronauta: recibe órdenes, aplica el retraso y los tiempos de espera, y manda fotos. */
export class HostSession {
  constructor(link, s, send = (m) => link.send(m)) {
    this.link = link; this.send = send; this.up = false; this.acc = SNAP_EVERY; this.accC = 0; this.rol = 'control'; this.who = null; this.reset(s);
    link.onpeer = (up) => { this.up = up; if (up) { this.hello(); this.acc = SNAP_EVERY; } else this.quita(); }; // si se cae el compañero, su personaje vuelve al piloto automático
    if (link.peerUp) link.onpeer(true); // Control ya estaba conectado en la sala de espera
    link.onmessage = (m) => this.onmsg(m, this.s);
  }
  /** Partida nueva (o primera): se olvidan órdenes pendientes, esperas y baliza. */
  reset(s) { this.s = s; this.who = null; this.loc = s.L.id; this.since = 0; this.mark = null; this.clock = 0; this.queue = []; this.cd = {}; this.delay = DELAY[s.L.id] ?? 0; }
  hello() { const s = this.s; this.send({ t: 'hi', v: 1, loc: s.L.id, lay: s.lay ?? null, dif: s.dif, mode: s.mode, delay: this.delay, note: DELAY_NOTE[s.L.id] ?? '', rol: this.rol, you: this.who, crew: s.crew.map((c) => ({ name: c.name, color: c.color, taken: !!c.human && c.name !== this.who, betrayed: !!c.betrayed })) }); }
  /** El invitado deja de ser tripulante (se fue o volvió a Control): su personaje vuelve al piloto automático. */
  quita() { if (this.rol === 'crew' && this.s) C.setHuman(this.s, null); this.who = null; this.rol = 'control'; }
  onmsg(m, s) {
    if (m?.t === 'hello') { if (m.rol === 'crew') this.rol = 'crew'; else this.quita(); this.hello(); this.acc = SNAP_EVERY; return; } // el invitado acaba de abrir su pantalla (como Control o como tripulante)
    if (this.rol === 'crew') { // el invitado maneja a un compañero: elegir quién, moverse y terminar revisiones
      if (m?.t === 'pick') { const c = s.crew.find((x) => x.name === m.who && !x.betrayed); if (c) { C.setHuman(s, c.name); this.who = c.name; this.accC = SNAP_CREW_EVERY; this.send({ t: 'you', who: c.name }); } return; }
      if (m?.t === 'inp') { if (this.who) C.crewInput(s, this.who, m.dx, m.dy); return; }
      if (m?.t === 'emerg' || m?.t === 'dis' || m?.t === 'give' || m?.t === 'search') { // acciones de la Fase 2: el invitado pide y el anfitrión valida
        const r = !this.who ? { ok: false, text: '' } : m.t === 'emerg' ? C.crewEmerg(s, this.who) : m.t === 'dis' ? C.crewDistract(s, this.who) : m.t === 'give' ? C.crewGive(s, this.who) : C.crewSearch(s, this.who, m.i);
        this.send({ t: 'ack', k: 'acc', ok: r.ok, text: r.text }); return;
      }
      if (m?.t === 'mant') { const r = this.who ? C.crewMaint(s, this.who, m.sys) : { ok: false, text: '' }; this.send({ t: 'ack', k: 'mant', ok: r.ok, text: r.text, sys: m.sys }); return; }
    }
    if (m?.t !== 'cmd' || !CMD[m.k]) return;
    const wait = (this.cd[m.k] ?? 0) - this.clock;
    if (wait > 0) return this.send({ t: 'ack', k: m.k, ok: false, text: T(`Espera ${Math.ceil(wait)} s para repetir esa orden.`, `Wait ${Math.ceil(wait)} s to repeat that order.`) });
    this.cd[m.k] = this.clock + CMD[m.k].cd;
    this.queue.push({ at: this.clock + this.delay, m }); this.send({ t: 'ack', k: m.k, ok: true, text: this.delay ? T(`Enviada: llegará en ${this.delay} s.`, `Sent: it will arrive in ${this.delay} s.`) : T('Enviada.', 'Sent.'), pending: true });
  }
  /** Llamar cada frame. paused = la pantalla de pausa está abierta (el reloj de la señal también se detiene). */
  tick(s, dt, paused = false) {
    if (s !== this.s) { this.reset(s); this.hello(); }
    if (!paused) {
      this.clock += dt;
      if (this.mark && (this.mark.t -= dt) <= 0) this.mark = null;
      for (const q of this.queue.filter((x) => x.at <= this.clock)) { const r = applyCommand(s, q.m, this); this.send({ t: 'ack', k: q.m.k, ok: r.ok, text: r.ok ? T(`✔ ${r.text}: ejecutada.`, `✔ ${r.text}: done.`) : r.text }); }
      this.queue = this.queue.filter((x) => x.at > this.clock);
    }
    if (this.rol === 'crew') { this.accC += dt; if (this.up && this.accC >= SNAP_CREW_EVERY) { this.accC = 0; this.send({ t: 'st', paused, s: C.serialize(s) }); } return; } // el tripulante ve el juego de verdad: manda el estado completo
    this.acc += dt; if (!this.up || this.acc < SNAP_EVERY) return;
    this.acc = 0; const snap = snapshot(s, this.since, this.mark, paused); this.since = snap.logSeq; this.send(snap);
  }
}

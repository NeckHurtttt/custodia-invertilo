// Cooperativo entre computadoras: ASTRONAUTA (juega en la base) + CONTROL DE MISIÓN (otra computadora, ve la base y ayuda).
// Lógica pura (sin pantalla ni red): la red vive en link.js y la pantalla en coopui.js. Así se puede probar en Node.
//   host  (astronauta)  → manda una foto de la base cada 0,5 s ('snap') y ejecuta las órdenes que llegan ('cmd').
//   guest (Control)     → dibuja la foto y manda órdenes. Solo puede ayudar con cosas de la lista de abajo: no mueve al astronauta.
// Mensajes (JSON): host→guest {t:'hi',loc,dif,mode,delay} · {t:'snap',...} · {t:'ack',k,ok,text}   guest→host {t:'cmd',k,...}
import * as C from './core.js';
import * as Sys from './sistemas.js';

export const SNAP_EVERY = 0.5;      // segundos reales entre fotos
/** Retraso de la señal (s) que se simula. Realidad: Luna ≈ 1,3 s; Marte entre 3 y 22 MINUTOS (aquí acelerado para que se pueda jugar). */
export const DELAY = { estacion: 0, luna: 2, marte: 6 };
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
export function snapshot(s, since = 0, mark = null, paused = false) {
  const view = Sys.view(s); const b = C.block(s);
  return {
    t: 'snap', loc: s.L.id, day: s.day, min: Math.floor(s.min), clock: C.clock(s.min), block: { id: b.id, name: b.name }, paused,
    p: { x: +s.p.x.toFixed(2), y: +s.p.y.toFixed(2), salud: Math.round(s.p.salud), energia: Math.round(s.p.energia), room: C.roomName(s, C.playerRoom(s)), hidden: !!s.p.hidden },
    alert: Math.round(s.alert), integ: Math.round(s.integ), ia: s.iaOn,
    sys: view && { meters: view.meters.map((m) => ({ id: m.id, name: m.name, v: Math.round(m.v) })), dosePct: Math.round(view.dosePct), tasks: view.tasks.map((k) => ({ id: k.id, short: k.short, room: k.room, done: k.done })), events: view.events, emerg: view.emerg && { ...view.emerg, t: Math.ceil(view.emerg.t) } },
    haz: s.hazards.filter((h) => h.def.name).map((h) => ({ name: h.def.name, x: +h.x.toFixed(1), y: +h.y.toFixed(1), room: C.roomName(s, h.room ?? C.roomIdAt(s, h.x, h.y)) })).slice(0, 12),
    doors: s.map.doors.map((d) => (d.open ? 1 : 0) + (d.lock ? 2 : 0)),
    log: s.log.filter((l) => (l.id ?? 0) > since).slice(-8).map((l) => ({ id: l.id, text: l.text.replace(/<[^>]+>/g, ''), kind: l.kind })),
    logSeq: s.logSeq ?? 0, mark, over: s.over ? { won: !!s.over.won, title: s.over.title } : null,
  };
}

/** Ejecuta una orden de Control sobre la partida. Devuelve { ok, text }. Es la ÚNICA puerta por la que Control cambia algo. */
export function applyCommand(s, cmd, host = null) {
  if (!cmd || !CMD[cmd.k] || s.over) return { ok: false, text: 'Orden no válida.' };
  switch (cmd.k) {
    case 'aviso': {
      const a = AVISOS[cmd.id]; if (!a) return { ok: false, text: 'Mensaje no válido.' };
      C.say(s, `📡 Control de Misión: ${a[0]}`, a[1]); break;
    }
    case 'apoyo': {
      if (!s.sys || !Sys.SYS_IDS.includes(cmd.sys)) return { ok: false, text: 'Ese sistema no existe aquí.' };
      for (const id of Sys.SYS_IDS) s.sys.lvl[id] = Math.max(0, Math.min(100, s.sys.lvl[id] + (id === cmd.sys ? 12 : -3)));
      C.say(s, `📡 Control de Misión reasignó recursos a ${Sys.SYS[cmd.sys].name} (+12; los otros −3).`, 'ok'); break;
    }
    case 'abrir': {
      const d = s.map.doors[cmd.door]; if (!d) return { ok: false, text: 'Esa escotilla no existe.' };
      if (d.lock) return { ok: false, text: 'Esa escotilla tiene candado: no se abre a distancia.' };
      d.open = true; C.say(s, `📡 Control de Misión abrió una escotilla (${C.roomName(s, d.room)}).`, 'info'); break;
    }
    case 'marca': {
      const x = Math.max(0, Math.min(s.L.W - 1, +cmd.x)), y = Math.max(0, Math.min(s.L.H - 1, +cmd.y)); if (!Number.isFinite(x + y)) return { ok: false, text: 'Punto no válido.' };
      if (host) host.mark = { x: Math.floor(x) + 0.5, y: Math.floor(y) + 0.5, t: 20 };
      C.say(s, `📡 Control de Misión marcó un punto en: ${C.roomName(s, C.roomIdAt(s, x, y))}.`, 'info'); break;
    }
  }
  s.coopHelps = (s.coopHelps ?? 0) + 1;
  return { ok: true, text: CMD[cmd.k].name };
}

/** Lado del astronauta: recibe órdenes, aplica el retraso y los tiempos de espera, y manda fotos. */
export class HostSession {
  constructor(link, s, send = (m) => link.send(m)) {
    this.link = link; this.send = send; this.up = false; this.acc = SNAP_EVERY; this.reset(s);
    link.onpeer = (up) => { this.up = up; if (up) { this.hello(); this.acc = SNAP_EVERY; } };
    if (link.peerUp) link.onpeer(true); // Control ya estaba conectado en la sala de espera
    link.onmessage = (m) => this.onmsg(m, this.s);
  }
  /** Partida nueva (o primera): se olvidan órdenes pendientes, esperas y baliza. */
  reset(s) { this.s = s; this.loc = s.L.id; this.since = 0; this.mark = null; this.clock = 0; this.queue = []; this.cd = {}; this.delay = DELAY[s.L.id] ?? 0; }
  hello() { const s = this.s; this.send({ t: 'hi', v: 1, loc: s.L.id, dif: s.dif, mode: s.mode, delay: this.delay, note: DELAY_NOTE[s.L.id] ?? '' }); }
  onmsg(m, s) {
    if (m?.t === 'hello') { this.hello(); this.acc = SNAP_EVERY; return; } // Control acaba de abrir su pantalla
    if (m?.t !== 'cmd' || !CMD[m.k]) return;
    const wait = (this.cd[m.k] ?? 0) - this.clock;
    if (wait > 0) return this.send({ t: 'ack', k: m.k, ok: false, text: `Espera ${Math.ceil(wait)} s para repetir esa orden.` });
    this.cd[m.k] = this.clock + CMD[m.k].cd;
    this.queue.push({ at: this.clock + this.delay, m }); this.send({ t: 'ack', k: m.k, ok: true, text: this.delay ? `Enviada: llegará en ${this.delay} s.` : 'Enviada.', pending: true });
  }
  /** Llamar cada frame. paused = la pantalla de pausa está abierta (el reloj de la señal también se detiene). */
  tick(s, dt, paused = false) {
    if (s !== this.s) { this.reset(s); this.hello(); }
    if (!paused) {
      this.clock += dt;
      if (this.mark && (this.mark.t -= dt) <= 0) this.mark = null;
      for (const q of this.queue.filter((x) => x.at <= this.clock)) { const r = applyCommand(s, q.m, this); this.send({ t: 'ack', k: q.m.k, ok: r.ok, text: r.ok ? `✔ ${r.text}: ejecutada.` : r.text }); }
      this.queue = this.queue.filter((x) => x.at > this.clock);
    }
    this.acc += dt; if (!this.up || this.acc < SNAP_EVERY) return;
    this.acc = 0; const snap = snapshot(s, this.since, this.mark, paused); this.since = snap.logSeq; this.send(snap);
  }
}

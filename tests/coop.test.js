import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as G from '../src/core.js';
import * as Sys from '../src/sistemas.js';
import * as Co from '../src/coop.js';

/** Un "cable" falso entre astronauta y control, sin red. */
function pair(s) {
  const out = []; const link = { onmessage: null, onpeer: null, send: (m) => out.push(m) };
  const host = new Co.HostSession(link, s); link.onpeer(true); return { host, link, out };
}
const last = (out, t) => out.filter((m) => m.t === t).at(-1);

test('coop: al conectarse, el astronauta saluda y manda una foto completa', () => {
  const s = G.newGame('luna', 5); const { host, out } = pair(s);
  const { crew, rol, you, ...hi } = out[0]; assert.deepEqual(hi, { t: 'hi', v: 1, loc: 'luna', dif: 'normal', mode: 'campana', delay: 2, note: Co.DELAY_NOTE.luna }); assert.equal(rol, 'control'); assert.equal(crew.length, 3);
  host.tick(s, 0.6); const f = last(out, 'snap');
  assert.equal(f.loc, 'luna'); assert.equal(f.sys.meters.length, 4); assert.equal(f.doors.length, s.map.doors.length);
  assert.ok(f.p.room && f.clock);
  assert.doesNotThrow(() => JSON.stringify(f));
});

test('coop: las fotos solo salen cada 0,5 s y los avisos no se repiten', () => {
  const s = G.newGame('estacion', 5); const { host, out } = pair(s);
  host.tick(s, 0.6); const n = out.filter((m) => m.t === 'snap').length; host.tick(s, 0.1); assert.equal(out.filter((m) => m.t === 'snap').length, n);
  C_say(s, 'hola'); host.tick(s, 0.6); assert.ok(last(out, 'snap').log.some((l) => l.text === 'hola'));
  host.tick(s, 0.6); assert.equal(last(out, 'snap').log.length, 0);
});
const C_say = (s, t) => G.say(s, t, 'info');

test('coop: Control solo puede hacer lo de la lista; todo lo demás se ignora', () => {
  const s = G.newGame('estacion', 5); const { host, link, out } = pair(s);
  link.onmessage({ t: 'cmd', k: 'matar' }); link.onmessage({ t: 'x' }); link.onmessage(null); host.tick(s, 1);
  assert.equal(out.filter((m) => m.t === 'ack').length, 0);
  assert.equal(Co.applyCommand(s, { k: 'aviso', id: '<script>' }).ok, false);
});

test('coop: reasignar recursos sube uno y baja los otros tres', () => {
  const s = G.newGame('estacion', 5); const antes = { ...s.sys.lvl }; s.sys.lvl.energia = 50;
  const r = Co.applyCommand(s, { k: 'apoyo', sys: 'energia' }); assert.ok(r.ok);
  assert.equal(s.sys.lvl.energia, 62); assert.equal(s.sys.lvl.vida, antes.vida - 3); assert.equal(s.sys.lvl.rad, antes.rad - 3); assert.equal(s.sys.lvl.comida, antes.comida - 3);
  s.sys.lvl.vida = 95; Co.applyCommand(s, { k: 'apoyo', sys: 'vida' }); assert.equal(s.sys.lvl.vida, 100);
  assert.equal(Co.applyCommand(s, { k: 'apoyo', sys: 'nada' }).ok, false);
  assert.equal(Co.applyCommand(G.newGame('estacion', 5, 'normal', { mode: 'noche' }), { k: 'apoyo', sys: 'vida' }).ok, false);
});

test('coop: abrir escotilla a distancia (no las que tienen candado)', () => {
  const s = G.newGame('estacion', 5); const libre = s.map.doors.findIndex((d) => !d.lock); const cerrada = s.map.doors.findIndex((d) => d.lock);
  s.map.doors[libre].open = false;
  assert.ok(Co.applyCommand(s, { k: 'abrir', door: libre }).ok); assert.equal(s.map.doors[libre].open, true);
  assert.equal(Co.applyCommand(s, { k: 'abrir', door: cerrada }).ok, false); assert.equal(s.map.doors[cerrada].open, false);
  assert.equal(Co.applyCommand(s, { k: 'abrir', door: 999 }).ok, false);
});

test('coop: marca un punto, dura 20 s y se mete dentro del mapa', () => {
  const s = G.newGame('estacion', 5); const { host, link, out } = pair(s);
  link.onmessage({ t: 'cmd', k: 'marca', x: 9999, y: -5 }); host.tick(s, 0.1);
  assert.deepEqual(host.mark && [host.mark.x, host.mark.y], [s.L.W - 0.5, 0.5]);
  host.tick(s, 19); assert.ok(host.mark); host.tick(s, 2); assert.equal(host.mark, null);
});

test('coop: el retraso de señal y el tiempo de espera se respetan; pausar detiene la señal', () => {
  const s = G.newGame('marte', 5); const { host, link, out } = pair(s);
  assert.equal(host.delay, 6); const antes = s.sys.lvl.vida;
  link.onmessage({ t: 'cmd', k: 'apoyo', sys: 'vida' }); assert.equal(last(out, 'ack').pending, true);
  host.tick(s, 5.9); assert.equal(s.sys.lvl.vida, antes); // aún no llega
  host.tick(s, 3, true); assert.equal(s.sys.lvl.vida, antes); // en pausa no corre la señal
  host.tick(s, 0.2); assert.equal(s.sys.lvl.vida, Math.min(100, antes + 12)); assert.match(last(out, 'ack').text, /ejecutada/);
  link.onmessage({ t: 'cmd', k: 'apoyo', sys: 'vida' }); assert.equal(last(out, 'ack').ok, false); assert.match(last(out, 'ack').text, /Espera/);
  const e = G.newGame('estacion', 5); const q = pair(e); q.link.onmessage({ t: 'cmd', k: 'aviso', id: 'bien' }); q.host.tick(e, 0.01);
  assert.ok(e.log.some((l) => /Control de Misión/.test(l.text))); // en la Estación no hay retraso
});

test('coop: no ejecuta nada cuando la partida ya terminó', () => {
  const s = G.newGame('estacion', 5); s.over = { won: false, title: 'x', text: 'y' };
  assert.equal(Co.applyCommand(s, { k: 'aviso', id: 'bien' }).ok, false);
});

// ---------- clima espacial real para Control de Misión (paso G) ----------
const alRefugio = (s) => { const r = s.L.rooms.find((x) => x.id === Sys.shelterOf(s).room); s.p.x = r.x + r.w / 2; s.p.y = r.y + r.h / 2; };

test('coop: Control ve la llamarada real que viene y cuándo llega la próxima tormenta', () => {
  const s = G.newGame('estacion', 5); const { host, out } = pair(s); host.tick(s, 0.6);
  const f = last(out, 'snap'); assert.ok(f.sys.clima && f.sys.clima.flare, 'la foto trae la llamarada de la próxima tormenta');
  assert.equal(f.sys.clima.total, 3); assert.equal(f.sys.clima.day, 2); assert.equal(f.sys.storm, null);
  assert.doesNotThrow(() => JSON.stringify(f));
  const v = Co.climaView(f, 0); assert.equal(v.modo, 'espera'); assert.equal(v.boton, false);
  assert.match(v.lineas.join(' '), /día 2 a las 15:00/); assert.match(v.lineas.join(' '), /REAL .*NASA DONKI/);
  assert.equal(Co.climaView(f, 0).lineas.length, 2);
  assert.equal(Co.climaView(Co.snapshot(G.newGame('estacion', 5, 'normal', { mode: 'noche' })), 0), null, 'sin sistemas no hay clima');
});

test('coop: con la tormenta en curso, Control ve la cuenta atrás, el refugio y si el astronauta ya llegó', () => {
  const s = G.newGame('estacion', 5); Sys.startStorm(s); Object.assign(s.p, { x: 5.5, y: 13.5 }); // el dormitorio es el refugio de la Estación: se sale al comedor
  assert.equal(Sys.inShelter(s), false);
  let v = Co.climaView(Co.snapshot(s), 0); assert.equal(v.modo, 'tormenta'); assert.equal(v.urgente, true); assert.equal(v.boton, true);
  assert.match(v.lineas[0], /TORMENTA SOLAR 1 de 3: las partículas llegan en \d+ s/); assert.match(v.lineas.join(' '), /AFUERA/);
  assert.ok(v.lineas.join(' ').includes(Sys.view(s).storm.shelter), 'dice cuál es el refugio');
  alRefugio(s); v = Co.climaView(Co.snapshot(s), 0);
  assert.equal(v.boton, false); assert.equal(v.urgente, false); assert.match(v.lineas.join(' '), /YA ESTÁ en el refugio/);
});

test('coop: el retraso de la señal se avisa a Control y si el mensaje llegaría tarde', () => {
  const s = G.newGame('marte', 5); Sys.startStorm(s);
  let v = Co.climaView(Co.snapshot(s), 6); assert.equal(v.tarde, false); assert.match(v.lineas.at(-1), /tarda 6 s.*avisa ya/);
  s.sys.storm.t = 3; v = Co.climaView(Co.snapshot(s), 6); assert.equal(v.tarde, true); assert.match(v.lineas.at(-1), /casi no llega a tiempo/);
});

test('coop: el aviso “¡al refugio!” llega con el retraso del destino y nombra el refugio', () => {
  const s = G.newGame('luna', 5); Sys.startStorm(s); const { host, link } = pair(s); const refugio = Sys.view(s).storm.shelter;
  link.onmessage({ t: 'cmd', k: 'aviso', id: 'refugio' });
  host.tick(s, 1.5); assert.ok(!s.log.some((l) => /Control de Misión/.test(l.text)), 'todavía no llegó (Luna: 2 s)');
  host.tick(s, 1); const l = s.log.find((x) => /Control de Misión/.test(x.text)); assert.ok(l, 'llegó tras el retraso');
  assert.ok(l.text.includes('refugio') && l.text.includes(refugio), l.text);
  // si el astronauta ya está en el refugio, Control lo felicita en vez de repetir la orden
  const t = G.newGame('estacion', 5); Sys.startStorm(t); alRefugio(t);
  assert.ok(Co.applyCommand(t, { k: 'aviso', id: 'refugio' }).ok); assert.ok(t.log.some((x) => /ya estás en el refugio/.test(x.text)));
  // sin tormenta, el mensaje sigue siendo el de siempre
  const u = G.newGame('estacion', 5); Co.applyCommand(u, { k: 'aviso', id: 'refugio' }); assert.ok(u.log.some((x) => x.text.includes('¡Corre al refugio de radiación!') && !/Refugio:/.test(x.text)));
});

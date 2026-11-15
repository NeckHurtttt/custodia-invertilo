import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as G from '../src/core.js';
import * as Sys from '../src/sistemas.js';
import * as Co from '../src/coop.js';

/** Cable falso: lo que manda el anfitrión queda en `out`; `link.onmessage(m)` es lo que le llega del invitado. */
function pair(s) {
  const out = []; const link = { onmessage: null, onpeer: null, send: (m) => out.push(m) };
  const host = new Co.HostSession(link, s); link.onpeer(true); return { host, link, out };
}
const ultimo = (out, t) => out.filter((m) => m.t === t).at(-1);
const quieto = (s) => { s.hazards = []; s.events = []; s.drones = []; s.grace = 9999; s.p.salud = 100; s.p.energia = 100; s.alert = 0; };
const avanza = (s, host, seg, paso = 0.05) => { for (let t = 0; t < seg; t += paso) { G.update(s, paso, { dx: 0, dy: 0 }); host.tick(s, paso); } };

test('tripulante: el invitado se une como tripulante, elige a María y la maneja; los otros siguen solos', () => {
  const s = G.newGame('estacion', 5, 'cadete'); quieto(s); s.p.sleep = false;
  const { host, link, out } = pair(s);
  link.onmessage({ t: 'hello', rol: 'crew' });
  const hi = ultimo(out, 'hi'); assert.equal(hi.rol, 'crew'); assert.deepEqual(hi.crew.map((c) => c.name), ['María', 'Kenji', 'Amara']); assert.ok(hi.crew.every((c) => !c.taken));
  link.onmessage({ t: 'pick', who: 'María' });
  assert.deepEqual(ultimo(out, 'you'), { t: 'you', who: 'María' }); assert.equal(G.humanCrew(s).name, 'María');
  link.onmessage({ t: 'pick', who: 'Nadie' }); assert.equal(G.humanCrew(s).name, 'María', 'un nombre falso no cambia nada');
  const m = s.crew[0], k = s.crew[1]; const x0 = m.x, y0 = m.y, kx0 = k.x, ky0 = k.y;
  avanza(s, host, 3); assert.ok(Math.hypot(m.x - x0, m.y - y0) < 0.01, 'sin entradas, María no se mueve sola');
  link.onmessage({ t: 'inp', dx: 1, dy: 0 }); for (let t = 0; t < 1; t += 0.05) { link.onmessage({ t: 'inp', dx: 1, dy: 0 }); G.update(s, 0.05, { dx: 0, dy: 0 }); host.tick(s, 0.05); }
  assert.ok(m.x - x0 > 0.5 && m.x - x0 < 3.3, `María camina hasta ~3 casillas por segundo (${m.x - x0})`);
  assert.ok(Math.hypot(k.x - kx0, k.y - ky0) > 0.01 || Math.hypot(k.x - kx0, k.y - ky0) === 0, 'Kenji sigue con su piloto automático');
});

test('tripulante: respeta paredes, se detiene si dejan de llegar entradas y la dirección se limita a −1…1', () => {
  const s = G.newGame('estacion', 5, 'cadete'); quieto(s); s.p.sleep = false;
  const { host, link } = pair(s); link.onmessage({ t: 'hello', rol: 'crew' }); link.onmessage({ t: 'pick', who: 'Kenji' });
  const c = G.humanCrew(s);
  link.onmessage({ t: 'inp', dx: 99, dy: -99 }); assert.deepEqual(c.inp, { dx: 1, dy: -1 }); link.onmessage({ t: 'inp', dx: 'x', dy: null }); assert.deepEqual(c.inp, { dx: 0, dy: 0 });
  // contra la pared del norte: nunca sale del mapa ni entra en una casilla sólida
  for (let t = 0; t < 20; t += 0.05) { link.onmessage({ t: 'inp', dx: -0.4, dy: -1 }); G.update(s, 0.05, { dx: 0, dy: 0 }); host.tick(s, 0.05); assert.ok(c.x > 0 && c.y > 0 && c.x < s.L.W && c.y < s.L.H); }
  assert.ok(!s.map.solid?.[Math.floor(c.y) * s.L.W + Math.floor(c.x)], 'no queda dentro de un objeto');
  link.onmessage({ t: 'inp', dx: 1, dy: 0 }); G.update(s, 0.05, { dx: 0, dy: 0 }); const x1 = c.x;
  for (let t = 0; t < 2; t += 0.05) { G.update(s, 0.05, { dx: 0, dy: 0 }); host.tick(s, 0.05); }
  assert.ok(Math.abs(c.x - x1) < 1.2, 'sin nuevas entradas por 0,7 s se detiene (red perdida)');
});

test('tripulante: la revisión del panel solo vale en el turno, cerca del panel y si está pendiente; ayuda igual que el astronauta', () => {
  const s = G.newGame('estacion', 5, 'cadete'); quieto(s); s.p.sleep = false;
  const { host, link, out } = pair(s); link.onmessage({ t: 'hello', rol: 'crew' }); link.onmessage({ t: 'pick', who: 'Amara' });
  const c = G.humanCrew(s); const o = Sys.station(s, 'vida');
  const intenta = () => { link.onmessage({ t: 'mant', sys: 'vida' }); return ultimo(out, 'ack'); };
  s.min = 5 * 60; assert.equal(intenta().ok, false, 'fuera del turno de trabajo no vale');
  s.min = 9 * 60; G.update(s, 0.05, { dx: 0, dy: 0 }); Object.assign(c, { x: o.x - 6, y: o.y + 0.5 }); assert.equal(intenta().ok, false, 'lejos del panel no vale');
  Object.assign(c, { x: o.x + 0.5, y: o.y + 1.5 }); s.sys.lvl.vida = 40; const e = s.p.energia;
  const ok = intenta(); assert.equal(ok.ok, true); assert.equal(s.sys.done.vida, true); assert.ok(s.sys.lvl.vida > 40, 'sube el nivel'); assert.equal(s.p.energia, e, 'no cansa al astronauta');
  assert.ok(s.log.some((l) => l.text.includes('Amara') && l.text.includes('✔')), 'queda en el registro con su nombre');
  assert.equal(intenta().ok, false, 'ya estaba hecha');
  assert.equal((link.onmessage({ t: 'mant', sys: 'inventada' }), ultimo(out, 'ack').ok), false);
});

test('tripulante: si se cae el invitado, su compañero vuelve al piloto automático; el invitado puede volver a Control', () => {
  const s = G.newGame('estacion', 5, 'cadete'); quieto(s); s.p.sleep = false;
  const { host, link } = pair(s); link.onmessage({ t: 'hello', rol: 'crew' }); link.onmessage({ t: 'pick', who: 'María' });
  assert.ok(G.humanCrew(s)); link.onpeer(false); assert.equal(G.humanCrew(s), null); assert.equal(host.rol, 'control');
  link.onpeer(true); link.onmessage({ t: 'hello', rol: 'crew' }); link.onmessage({ t: 'pick', who: 'María' }); assert.ok(G.humanCrew(s));
  link.onmessage({ t: 'hello' }); assert.equal(G.humanCrew(s), null, 'volver a Control suelta al compañero'); assert.equal(host.rol, 'control');
});

test('tripulante: el anfitrión manda el estado ~15 veces por segundo y el invitado lo reconstruye igual (sin mandar el mapa)', () => {
  const s = G.newGame('estacion', 5, 'cadete'); quieto(s); s.p.sleep = false;
  const { host, link, out } = pair(s); link.onmessage({ t: 'hello', rol: 'crew' }); link.onmessage({ t: 'pick', who: 'María' });
  out.length = 0; avanza(s, host, 2, 0.02);
  const sts = out.filter((m) => m.t === 'st'); assert.ok(sts.length >= 25 && sts.length <= 36, `estados por 2 s: ${sts.length}`); assert.ok(sts.every((m) => !out.some((q) => q.t === 'snap')), 'no manda fotos de Control');
  const tam = Math.max(...sts.map((m) => m.s.length)); assert.ok(tam < 20000, `cada estado pesa ${tam} caracteres`); assert.ok(!sts[0].s.includes('"grid"'), 'no manda el mapa fijo');
  // el invitado: arma la partida base y aplica el estado
  const g = G.newGame('estacion', 1, 'cadete'); G.applyState(g, ultimo(out, 'st').s);
  assert.equal(g.day, s.day); assert.ok(Math.abs(g.min - s.min) < 1); assert.equal(g.crew[0].human, true); assert.ok(Math.abs(g.p.x - s.p.x) < 0.01); assert.equal(g.map.doors.length, s.map.doors.length);
  assert.ok(g.sys.lvl.vida > 0 && g.hazards.every((h) => h.def), 'los peligros recuperan su definición');
});

test('tripulante: cambiar de partida (reintentar) saluda de nuevo y hay que volver a elegir; el modo Control no cambia', () => {
  const s = G.newGame('estacion', 5, 'cadete'); quieto(s);
  const { host, link, out } = pair(s); link.onmessage({ t: 'hello', rol: 'crew' }); link.onmessage({ t: 'pick', who: 'Kenji' });
  const s2 = G.newGame('estacion', 6, 'cadete'); out.length = 0; host.tick(s2, 0.05);
  const hi = ultimo(out, 'hi'); assert.ok(hi && hi.rol === 'crew' && hi.you === null, 'saluda otra vez, sin personaje elegido'); assert.equal(G.humanCrew(s2), null);
  const c = G.newGame('luna', 7, 'cadete'); const p = pair(c); p.link.onmessage({ t: 'hello' }); assert.equal(p.host.rol, 'control'); p.host.tick(c, 0.6); assert.ok(ultimo(p.out, 'snap'), 'Control sigue recibiendo sus fotos');
});

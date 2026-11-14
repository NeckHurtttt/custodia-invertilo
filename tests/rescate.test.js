// Proyecto Hackaton 2.0: la misión se gana cuidando la base hasta que llega el rescate (día 11).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as G from '../src/core.js';
import { resumenFin } from '../src/ui.js';

const toDay11 = (s) => { s.day = 10; s.min = 1439.9; G.update(s, 1 / 20, { dx: 0, dy: 0 }); };

test('al terminar el día 10 llega el rescate y se gana', () => {
  const s = G.newGame('estacion', 7, 'normal');
  toDay11(s);
  assert.equal(s.over?.won, true);
  assert.equal(s.over.title, G.RESCUE_TITLE);
  assert.equal(s.over.route, 'rescate');
  assert.ok(s.over.stars >= 1 && s.over.stars <= 3);
});

test('estrellas del rescate: sistemas cuidados y poca radiación', () => {
  const a = G.newGame('luna', 3, 'normal');
  for (const k of Object.keys(a.sys.lvl)) a.sys.lvl[k] = 95; a.sys.dose = 0; a.integ = 90;
  toDay11(a); assert.equal(a.over.stars, 3);
  const b = G.newGame('luna', 3, 'normal');
  for (const k of Object.keys(b.sys.lvl)) b.sys.lvl[k] = 30; b.integ = 20;
  toDay11(b); assert.equal(b.over.stars, 1);
});

test('el resumen del rescate explica la restricción real', () => {
  const s = G.newGame('marte', 5, 'normal'); toDay11(s);
  const r = resumenFin(s);
  assert.equal(r.ganaste, true);
  assert.match(r.aprende, /radiación/);
  assert.equal(r.estrellas.length, 3);
  assert.match(r.estrellas[0].txt, /rescate/);
});

test('el primer día cuenta que llega el rescate', () => {
  const s = G.newGame('estacion', 1, 'normal');
  assert.ok(s.log.some((l) => /rescate/.test(l.text)));
});

test('Cadete: si nadie resuelve un peligro, un compañero lo controla con su protocolo', () => {
  const s = G.newGame('estacion', 9, 'cadete'); s.drones = []; s.hazards.length = 0;
  G.spawnHazard(s, 'fuego'); assert.equal(s.hazards.length, 1);
  const i0 = s.integ;
  for (let t = 0; t < 50 * 20; t++) { s.hazards.forEach((h) => { h.t = 0; }); G.update(s, 1 / 20, { dx: 0, dy: 0 }); if (!s.hazards.length) break; }
  assert.equal(s.hazards.length, 0);
  assert.ok(s.log.some((l) => /siguiendo el protocolo/.test(l.text)));
  assert.ok(s.integ < i0);
});

test('en Normal los peligros NO se resuelven solos', () => {
  const s = G.newGame('estacion', 9, 'normal'); s.drones = []; s.hazards.length = 0;
  G.spawnHazard(s, 'fuego');
  for (let t = 0; t < 50 * 20; t++) { s.hazards.forEach((h) => { h.t = 0; }); G.update(s, 1 / 20, { dx: 0, dy: 0 }); }
  assert.ok(!s.log.some((l) => /siguiendo el protocolo/.test(l.text)));
});

test('Cadete: el armario de emergencia da la herramienta y se abre el protocolo real', () => {
  const s = G.newGame('estacion', 9, 'cadete'); s.drones = []; s.hazards.length = 0; s.p.inv = [];
  G.spawnHazard(s, 'fuego'); const h = s.hazards[0];
  s.p.x = (h.tiles[0] % s.L.W) + 0.5; s.p.y = ((h.tiles[0] / s.L.W) | 0) + 0.5; s.p.sleep = false;
  G.interact(s);
  assert.equal(s.pending?.kind, 'protocolo'); assert.equal(s.pending.id, 'fuego');
  G.resolveProtocol(s, true); assert.equal(s.hazards.length, 0);
});
test('Normal: sin herramienta no hay protocolo', () => {
  const s = G.newGame('estacion', 9, 'normal'); s.drones = []; s.hazards.length = 0; s.p.inv = [];
  G.spawnHazard(s, 'fuego'); const h = s.hazards[0];
  s.p.x = (h.tiles[0] % s.L.W) + 0.5; s.p.y = ((h.tiles[0] / s.L.W) | 0) + 0.5; s.p.sleep = false;
  G.interact(s); assert.equal(s.pending, null);
});

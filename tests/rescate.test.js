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

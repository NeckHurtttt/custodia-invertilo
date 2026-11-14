import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as G from '../src/core.js';
import { NOTES } from '../src/story.js';

const store = {}; globalThis.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };
const Meta = await import('../src/meta.js');

test('una noche: empieza 21:00 con 2 piezas en el escondite y pierde al amanecer', () => {
  const s = G.newGame('estacion', 3, 'normal', { mode: 'noche' });
  assert.equal(s.min, 1260); assert.equal(s.stash.filter((i) => G.PLAN_IDS.includes(i)).length, 2);
  s.drones = []; s.events = []; s.vil.events = []; s.vil.walkers = []; s.vil.missions = []; for (let i = 0; i < 20 * 460 && !s.over; i++) { if (s.day >= 2) { s.vil.events = []; s.vil.walkers = []; s.events = []; } s.p.salud = 100; G.update(s, 0.05); }
  assert.equal(s.over?.title, 'Amaneció');
});

test('personajes: la contrabandista lleva más y empieza con destornillador', () => {
  const s = G.newGame('luna', 1, 'normal', { perk: 'contrabandista' });
  assert.ok(s.p.inv.includes('destornillador')); assert.equal(G.capacity(s), G.capacity(G.newGame('luna', 1)) + 2);
});

test('rutas: motín con 3 compañeros leales; sabotaje con la IA apagada', () => {
  const s = G.newGame('marte', 2);
  s.p.inv = ['codigo', 'celda']; assert.equal(G.routes(s).find((r) => r.ok), undefined);
  s.crew.forEach((c) => (c.trust = 2)); assert.equal(G.routes(s).find((r) => r.ok).id, 'motin');
  const t = G.newGame('marte', 2); t.iaOn = false; t.p.inv = ['codigo', 'llave']; assert.equal(G.routes(t).find((r) => r.ok).id, 'sabotaje');
});

test('delatar baja la alerta, da tarjeta y el compañero ya no ayuda', () => {
  const s = G.newGame('estacion', 4); s.alert = 60; const c = s.crew[0]; s.p.x = c.x; s.p.y = c.y;
  G.betray(s); assert.ok(c.betrayed); assert.equal(s.alert, 25); assert.ok(s.p.inv.includes('tarjeta'));
});

test('notas: aparecen en orden y no se repiten las ya conocidas', () => {
  const s = G.newGame('luna', 9, 'normal', { seen: [0, 1] });
  assert.ok(G.findNote(s)); assert.deepEqual(s.notes, [2]);
  s.notes = [2, 3, 4, 5]; assert.equal(G.findNote(s), false); assert.equal(G.notesKnown(s), NOTES.luna.length);
});

test('meta: ganar da puntos, medallas y racha; comprar personaje', () => {
  const s = G.newGame('estacion', 5, 'normal', { mode: 'noche' }); s.over = { won: true, stars: 2, route: 'plan', trueEnd: false };
  const r = Meta.finish(s); assert.ok(r.pts >= 180); assert.ok(r.medals.includes('primer') && r.medals.includes('noche')); assert.equal(r.streak, 1);
  assert.ok(Meta.buy('atleta')); assert.ok(Meta.isUnlocked(Meta.load(), 'atleta')); assert.equal(Meta.buy('atleta'), false);
});

test('reto del día: misma semilla y destino para la misma fecha', () => {
  const d = new Date(2026, 10, 14); assert.deepEqual(Meta.daily(d), Meta.daily(new Date(2026, 10, 14, 23)));
  assert.notEqual(Meta.daily(d).seed, Meta.daily(new Date(2026, 10, 15)).seed);
});

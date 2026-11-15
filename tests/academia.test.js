import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as G from '../src/core.js';
import * as A from '../src/academia.js';
import { LOCS } from '../src/locs.js';
import { setLang } from '../src/i18n.js';

// La Academia de Cadetes se juega de punta a punta con las acciones reales del juego (E, entrenar, estudiar, fabricar, la escotilla).
const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const nueva = () => { const s = G.newGame('academia', 5, 'cadete'); s.drones = []; return s; };
/** Pone al jugador en la casilla libre de al lado del objeto. */
function junto(s, o) {
  for (const [dx, dy] of N4) { const x = o.x + dx, y = o.y + dy; if (s.map.grid[y * s.L.W + x] === 1 && !s.map.solid[y * s.L.W + x]) { Object.assign(s.p, { x: x + 0.5, y: y + 0.5, hidden: null }); return; } }
  throw new Error(`no hay lugar junto a ${o.t}`);
}
/** E y esperar a que termine la acción (revisar, entrenar, estudiar…). */
function usa(s, o) { if (o) junto(s, o); G.interact(s); for (let i = 0; i < 200 && s.action; i++) G.update(s, 0.1); }
const sala = (s, id) => s.L.rooms.find((r) => r.id === id);
const centro = (s, id) => { const r = sala(s, id); Object.assign(s.p, { x: r.x + r.w / 2, y: r.y + r.h / 2 }); };

test('academia: 5 salas en fila, no aparece en el título y es un mapa jugable (todo alcanzable, nada tapa escotillas)', () => {
  const s = nueva(); assert.equal(s.mode, 'academia'); assert.deepEqual(s.L.rooms.map((r) => r.id), ['llegada', 'deposito', 'vigilancia', 'entreno', 'egreso']);
  assert.ok(!('academia' in LOCS), 'no es un destino del menú'); assert.ok(G.mapaValido(s.L));
  assert.equal(s.vil, null); assert.equal(s.sys, null); assert.equal(s.crew.length, 0); assert.equal(G.newGame('academia', 5).drones.length, 1, 'un solo dron');
  const m0 = s.min; for (let i = 0; i < 100; i++) G.update(s, 0.1); assert.equal(s.min, m0, 'el reloj no corre'); assert.equal(s.over, null);
});

test('academia: se completa sala por sala y al final se "pasa el juego"', () => {
  const s = nueva(); const tu = A.nuevo();
  assert.equal(A.actual(tu), 'llegada'); assert.ok(A.objetivo(tu, s));
  centro(s, 'deposito'); assert.ok(A.tick(tu, s)); assert.equal(A.actual(tu), 'recoger');
  // 2 · recolectar
  for (const o of s.objects.filter((x) => x.t === 'cajon' && x.loot.length)) usa(s, o);
  assert.ok(s.p.inv.includes('chip') && s.p.inv.includes('placa'), `mochila: ${s.p.inv}`); A.tick(tu, s); assert.equal(A.actual(tu), 'vigilancia');
  // 3 · cruzar la zona vigilada
  centro(s, 'entreno'); A.tick(tu, s); assert.equal(A.actual(tu), 'entrenar');
  // 4 · la caja pesada pide fuerza; no se puede fabricar sin saber
  const caja = s.objects.find((o) => o.t === 'caja'); usa(s, caja); assert.ok(!s.p.inv.includes('cable'), 'con 20 de fuerza la caja no se abre');
  const cinta = s.objects.find((o) => o.t === 'cinta'); usa(s, cinta); usa(s, cinta); assert.ok(s.p.fuerza >= A.FUERZA, `fuerza ${s.p.fuerza}`);
  usa(s, caja); assert.ok(s.p.inv.includes('cable'), 'la caja trae el cable');
  assert.equal(G.craft(s, 'tarjeta'), false, 'sin estudiar no sale la tarjeta'); assert.deepEqual(G.recipes(s).map((r) => r.id), ['tarjeta'], 'en la Academia solo se ve la receta de la tarjeta');
  const est = s.objects.find((o) => o.t === 'estudio'); usa(s, est); usa(s, est); assert.ok(s.p.conoc >= A.SABER, `saber ${s.p.conoc}`);
  assert.equal(G.craft(s, 'tarjeta'), true); A.tick(tu, s); assert.equal(A.actual(tu), 'salida');
  // 5 · la escotilla del egreso se abre con la tarjeta y el asiento termina la academia
  const puerta = s.map.doors.find((d) => d.room === 'egreso'); assert.equal(puerta.lock, 'tarjeta'); assert.ok(!puerta.open);
  const [tx, ty] = puerta.tiles[0]; Object.assign(s.p, { x: tx + 0.5, y: ty + 0.5 }); G.interact(s); assert.ok(puerta.open, 'la tarjeta abre la escotilla');
  const meta = s.objects.find((o) => o.meta); usa(s, meta); assert.ok(s.over?.won && s.over.title === 'Academia completada', JSON.stringify(s.over));
});

test('academia: si el dron te atrapa vuelves a la entrada de la zona vigilada SIN perder nada', () => {
  const s = G.newGame('academia', 5, 'cadete'); s.p.inv.push('chip', 'placa'); centro(s, 'vigilancia');
  G.lockdown(s, 'dron'); assert.deepEqual([s.p.x, s.p.y], s.L.reinicio); assert.deepEqual(s.p.inv, ['chip', 'placa']); assert.equal(s.alert, 0); assert.equal(s.over, null);
});

test('academia: textos en español e inglés para compu, tablet y teléfono; la ventana de contexto explica el juego', () => {
  const s = nueva(); const tu = A.nuevo();
  for (let i = 0; i < A.PASOS.length; i++) {
    tu.i = i; const pc = A.texto(tu, s), tab = A.texto(tu, s, true), tel = A.texto(tu, s, true, true);
    for (const x of [pc, tab, tel]) assert.ok(x.titulo && x.texto && x.n === `${i + 1}/5`, A.PASOS[i]);
    setLang('en'); try { const en = A.texto(tu, s); assert.ok(!/[áéíóúñ¡¿]/i.test(en.texto + en.titulo), en.texto); } finally { setLang('es'); }
  }
  tu.i = 2; assert.match(A.texto(tu, s).texto, /Shift/); assert.match(A.texto(tu, s, true, true).texto, /USAR/);
  const c = A.contexto(); assert.ok(c.parrafos.length === 3 && /IA/.test(c.parrafos[1]) && /rescate/.test(c.parrafos[1]));
});

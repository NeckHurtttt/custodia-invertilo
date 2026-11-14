import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as G from '../src/core.js';
import { LOCS } from '../src/locs.js';
import { HAZARDS, RECIPES, ITEMS, PROTOCOLS } from '../src/common.js';

const fresh = (loc = 'estacion') => G.newGame(loc, 1234);
const at = (s, x, y) => s.map.grid[y * s.L.W + x];

for (const loc of Object.keys(LOCS)) {
  test(`${loc}: salas, objetos, rutas, camas y conductos están bien puestos`, () => {
    const s = fresh(loc); const L = s.L;
    for (const d of s.map.doors) { d.open = true; assert.ok(d.tiles.length, `escotilla sin casillas hacia ${d.room}`); }
    for (const r of L.rooms) assert.ok(G.path(s, 3, 3, r.x + 1, r.y + 1, 'd'), `no se llega a ${r.name}`);
    for (const o of L.objects) assert.equal(at(s, o.x, o.y), 1, `${o.t} fuera del piso en ${o.x},${o.y}`);
    const seen = new Set(); for (const o of L.objects) { const k = `${o.x},${o.y}`; assert.ok(!seen.has(k), `dos objetos en ${k}`); seen.add(k); }
    for (const route of L.routes) for (const [x, y] of route) assert.ok(G.path(s, 3, 3, x, y, 'd'), `ruta rota en ${x},${y}`);
    for (const [x, y] of L.beds) assert.equal(at(s, x, y), 1);
    for (const t of ['registro', 'trabajo', 'caja', 'traje', 'asiento', 'palanca', 'nucleo', 'escondite', 'capcom']) assert.ok(L.objects.some((o) => o.t === t), `falta ${t}`);
    assert.deepEqual(L.objects.filter((o) => o.t === 'registro').map((o) => o.frag).sort(), [0, 1, 2]);
    s.p.inDuct = true;
    const q = [L.grates[0]]; const vis = new Set([L.grates[0].join()]);
    while (q.length) { const [x, y] = q.shift(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const k = [x + dx, y + dy]; if (G.walkable(s, ...k) && !vis.has(k.join())) { vis.add(k.join()); q.push(k); } } }
    for (const g of L.grates) { assert.ok(vis.has(g.join()), `rejilla ${g} desconectada`); assert.equal(at(s, ...g), 1, `rejilla ${g} fuera del piso`); }
    for (const k of L.hazards) assert.ok(HAZARDS[k], k);
    assert.ok(PROTOCOLS[L.finalProto]);
    for (const k of L.hazards) { const h = HAZARDS[k]; if (h.tool) assert.ok(ITEMS[h.tool], h.tool); if (h.proto) assert.ok(PROTOCOLS[h.proto], h.proto); if (h.tool && RECIPES.some((r) => r.id === h.tool)) assert.ok(G.recipes(s).some((r) => r.id === h.tool), `${loc} no puede fabricar ${h.tool}`); }
  });

  test(`${loc}: los problemas aparecen y se mueven sin romperse`, () => {
    const s = fresh(loc); s.min = 900; s.p.salud = 1e6; s.integ = 1e6;
    for (const k of s.L.hazards) G.spawnHazard(s, k);
    for (let i = 0; i < 400; i++) G.update(s, 0.1, { dx: Math.sin(i / 20), dy: Math.cos(i / 15) });
    assert.ok(!Number.isNaN(s.p.x) && !Number.isNaN(s.integ));
  });

  test(`${loc}: varios días seguidos no se traban`, () => {
    const s = fresh(loc);
    for (let i = 0; i < 6000 && !s.over; i++) G.update(s, 0.25, { dx: 0, dy: 0 });
    assert.ok(s.day >= 3 || s.over, `día ${s.day}`);
    assert.ok(s.crew.every((c) => Number.isFinite(c.x)));
  });

  test(`${loc}: con el plan listo, el final se gana`, () => {
    const s = fresh(loc); s.iaOn = false; s.drones = []; s.p.inv = ['codigo', 'celda', 'traje', 'llave'];
    const seat = s.L.objects.find((o) => o.t === 'asiento'); const lever = s.L.objects.find((o) => o.t === 'palanca');
    Object.assign(s.p, { x: seat.x + 0.5, y: seat.y + 0.5 }); G.interact(s); assert.ok(s.final);
    Object.assign(s.p, { x: lever.x + 0.5, y: lever.y + 0.5 }); G.interact(s); assert.equal(s.pending?.id, s.L.finalProto);
    G.resolveProtocol(s, true); assert.ok(s.final.lever);
    Object.assign(s.p, { x: seat.x + 0.5, y: seat.y + 0.5 }); G.interact(s);
    assert.ok(s.over?.won);
  });
}

test('afuera sin traje te asfixias; con traje aguantas', () => {
  const s = fresh('luna'); s.drones = []; Object.assign(s.p, { x: 48.5, y: 10.5 });
  for (let i = 0; i < 20; i++) G.update(s, 0.1); assert.ok(s.p.o2 < 80);
  const t = fresh('luna'); t.drones = []; t.p.inv.push('traje'); Object.assign(t.p, { x: 48.5, y: 10.5 });
  for (let i = 0; i < 20; i++) G.update(t, 0.1); assert.ok(t.p.o2 > 95);
});

test('la tormenta solar no hace daño dentro del refugio', () => {
  const s = fresh('luna'); s.drones = []; s.min = 900;
  Object.assign(s.p, { x: 29.5, y: 13.5 });
  const h = G.spawnHazard(s, 'radiacion'); h.phase = 'barre'; h.x = 35;
  const s0 = s.p.salud; for (let i = 0; i < 10; i++) G.update(s, 0.1); assert.ok(s.p.salud >= s0 - 0.5);
  Object.assign(s.p, { x: 18.5, y: 13.5 }); h.x = 25;
  for (let i = 0; i < 10; i++) G.update(s, 0.1); assert.ok(s.p.salud < s0 - 3);
});

test('robot: se inhibe con Q y se desarma con cables', () => {
  const s = fresh('marte'); s.drones = []; s.min = 900;
  const h = G.spawnHazard(s, 'robot'); Object.assign(s.p, { x: h.x + 1, y: h.y, inv: ['inhibidor', 'destornillador'] });
  G.useQ(s); assert.ok(h.stun > 0);
  G.interact(s); assert.equal(s.pending?.kind, 'cables');
  G.resolveProtocol(s, true); assert.equal(s.hazards.length, 0); assert.ok(G.has(s, 'chip'));
});

test('hackear los 3 registros da el código', () => {
  const s = fresh(); s.p.conoc = 20;
  for (const o of s.objects.filter((x) => x.t === 'registro')) { Object.assign(s.p, { x: o.x + 0.5, y: o.y + 0.5 }); G.interact(s); assert.equal(s.pending?.kind, 'codigo'); G.resolveCodigo(s, true); }
  assert.ok(G.has(s, 'codigo'));
});

test('favores: dar lo que pide un compañero te devuelve algo', () => {
  const s = fresh(); const c = s.crew[0]; s.p.inv.push(c.want); Object.assign(s.p, { x: c.x, y: c.y });
  G.interact(s); assert.equal(c.want, null); assert.equal(s.stats.favors, 1);
});

test('faltar al pase de lista sube la alerta; en el conducto no te ven', () => {
  const s = fresh(); s.drones = []; s.min = 365; s.block = -1; Object.assign(s.p, { x: 5.5, y: 14.5 });
  for (let i = 0; i < 40; i++) G.update(s, 0.25); assert.ok(s.alert > 15);
  const t = fresh(); Object.assign(t.p, { x: 16.5, y: 10.5, inDuct: true }); const d = t.drones[0]; Object.assign(d, { x: 17.5, y: 11.5, dir: Math.PI });
  assert.equal(G.canSee(t, d), false);
});

test('el pase de lista confisca si llevas 2 o más herramientas', () => {
  const s = fresh(); s.drones = []; s.min = 362; s.block = -1;
  Object.assign(s.p, { x: 19.5, y: 13.5, inv: ['destornillador', 'amarra', 'cinta'] });
  for (let i = 0; i < 40; i++) G.update(s, 0.25);
  assert.equal(s.p.inv.filter(G.isContraband).length, 1);
});

test('incendio: crece y el protocolo correcto lo apaga', () => {
  const s = fresh(); s.drones = []; s.min = 900;
  const h = G.spawnHazard(s, 'fuego', 'taller');
  for (let i = 0; i < 40; i++) G.update(s, 0.25);
  assert.ok(h.tiles.length > 1);
  s.p.inv.push('extintor'); Object.assign(s.p, { x: (h.tiles[0] % s.L.W) + 0.5, y: Math.floor(h.tiles[0] / s.L.W) + 0.5 });
  G.interact(s); assert.equal(s.pending?.id, 'fuego'); G.resolveProtocol(s, true);
  assert.equal(s.hazards.length, 0);
});

test('en la huida final un dron solo te quita segundos', () => {
  const s = fresh(); s.p.inv = ['codigo', 'celda', 'traje', 'llave'];
  Object.assign(s.p, { x: 41.5, y: 13.5 }); s.min = 900; G.interact(s);
  Object.assign(s.p, { x: 19.5, y: 13.5 }); const d = s.drones[0]; Object.assign(d, { x: 19.6, y: 13.5, mode: 'persigue', cd: 0 });
  const t0 = s.final.t; G.update(s, 0.05);
  assert.ok(s.final.t < t0 - 7); assert.equal(s.p.inv.length, 4);
});

test('guardar y cargar conserva la partida', () => {
  const s = fresh('marte'); s.min = 900; G.spawnHazard(s, 'plaga'); s.map.doors[0].open = false;
  const t = G.revive(JSON.parse(G.serialize(s)));
  assert.equal(t.L.id, 'marte'); assert.equal(t.map.doors[0].open, false); assert.equal(t.hazards[0].def, HAZARDS.plaga);
  G.update(t, 0.5);
});

test('10 días sin escapar = derrota', () => {
  const s = fresh(); s.drones = []; s.day = 10; s.min = 1430; G.update(s, 5); assert.equal(s.over?.won, false);
});

test('soltar y recoger cosas; los drones confiscan herramientas tiradas', () => {
  const s = fresh(); s.drones = [];
  s.p.inv = ['cinta', 'tornillos', 'destornillador']; s.p.dir = 0;
  assert.ok(G.dropItem(s, 0)); assert.equal(s.floor.length, 1); assert.deepEqual(s.p.inv, ['tornillos', 'destornillador']);
  G.interact(s); assert.equal(s.floor.length, 0); assert.ok(s.p.inv.includes('cinta'));
  s.p.inv.push('codigo'); assert.equal(G.dropItem(s, s.p.inv.length - 1), false);
  const r = G.revive(JSON.parse(G.serialize(s))); assert.deepEqual(r.floor, []);
});

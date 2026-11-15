import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as G from '../src/core.js';
import { LOCS } from '../src/locs.js';
import { FIJO, OPCIONALES, layDe, variante } from '../src/disposicion.js';

// Variantes del mapa: cada destino tiene su forma propia y cada partida cambia (salas intercambiadas, espejo, salas opcionales).
const FLUSH = ['cama', 'cajon', 'estudio', 'registro', 'capcom', 'mant', 'escondite', 'traje', 'palanca', 'trabajo', 'casillero'];
const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const firma = (s) => s.L.rooms.map((r) => `${r.id}@${r.x},${r.y}`).sort().join(' ');
const SEMILLAS = Array.from({ length: 40 }, (_, i) => 1000 + i * 37);

test('disposición: la Luna y Marte ya no copian la Estación (el dormitorio y el comedor están en otro lugar)', () => {
  const pos = (loc, id) => { const r = G.newGame(loc, 1).L.rooms.find((x) => x.id === id); return `${r.x},${r.y}`; };
  for (const loc of ['luna', 'marte']) assert.notEqual(pos(loc, 'dorm'), pos('estacion', 'dorm'), `${loc}: el dormitorio no está donde en la Estación`);
  assert.notEqual(G.newGame('luna', 1).L.rooms.find((r) => r.outside).x, G.newGame('marte', 1).L.rooms.find((r) => r.outside).x, 'la superficie queda de lados distintos');
});

for (const loc of Object.keys(LOCS)) {
  test(`disposición ${loc}: 40 partidas variadas son todas jugables (objetos pegados a la pared, nada tapa escotillas ni rejillas, todo alcanzable)`, () => {
    for (const seed of SEMILLAS) {
      const s = G.newGame(loc, seed, 'normal', { variar: true }); const { W, H } = s.L; const g = (x, y) => s.map.grid[y * W + x]; const sol = (x, y) => s.map.solid[y * W + x];
      for (const o of s.objects) {
        assert.equal(g(o.x, o.y), 1, `${seed}: ${o.t} fuera del piso`); assert.ok(!N4.some(([dx, dy]) => g(o.x + dx, o.y + dy) === 2), `${seed}: ${o.t} tapa una escotilla`);
        const r = s.L.rooms[s.map.room[o.y * W + o.x]];
        if (FLUSH.includes(o.t) && r && !r.outside) assert.ok(o.x === r.x || o.y === r.y || o.x === r.x + r.w - 1 || o.y === r.y + r.h - 1, `${seed}: ${o.t} en medio de ${r.name}`);
      }
      const [ix, iy] = G.inicio(s).map(Math.floor); assert.equal(s.L.rooms[s.map.room[iy * W + ix]]?.id, 'dorm', `${seed}: se empieza en el dormitorio`);
      const seen = new Set([`${ix},${iy}`]); const q = [[ix, iy]];
      while (q.length) { const [x, y] = q.pop(); for (const [dx, dy] of N4) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H || !g(nx, ny) || sol(nx, ny) || seen.has(`${nx},${ny}`)) continue; seen.add(`${nx},${ny}`); q.push([nx, ny]); } }
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (g(x, y) && !sol(x, y)) assert.ok(seen.has(`${x},${y}`), `${seed}: ${x},${y} aislada`);
      // lo imprescindible sigue: 4 paneles, 3 registros, el núcleo, el traje y las camas de la tripulación dentro del dormitorio
      const n = (t) => s.objects.filter((o) => o.t === t).length;
      assert.equal(n('mant'), 4); assert.equal(n('registro'), 3); assert.equal(n('nucleo'), 1); assert.equal(n('traje'), 1);
      const dorm = s.L.rooms.find((r) => r.id === 'dorm'); assert.ok(s.L.beds.every(([x, y]) => x >= dorm.x && y >= dorm.y && x < dorm.x + dorm.w && y < dorm.y + dorm.h), `${seed}: camas de la tripulación en el dormitorio`);
      for (const b of s.L.schedule) if (b.room) assert.ok(s.L.rooms.some((r) => r.id === b.room), `${seed}: falta la sala del horario ${b.room}`);
    }
  });
}

test('disposición: las partidas cambian de forma (y en la Estación también la cantidad de salas)', () => {
  for (const loc of Object.keys(LOCS)) {
    const formas = new Set(SEMILLAS.map((sd) => firma(G.newGame(loc, sd, 'normal', { variar: true }))));
    assert.ok(formas.size >= 6, `${loc}: solo ${formas.size} formas distintas en 40 partidas`);
  }
  const cuantas = new Set(SEMILLAS.map((sd) => G.newGame('estacion', sd, 'normal', { variar: true }).L.rooms.length));
  assert.ok(cuantas.size >= 3 && Math.min(...cuantas) >= 11 && Math.max(...cuantas) === 15, `salas por partida en la Estación: ${[...cuantas]}`);
  assert.deepEqual(OPCIONALES.luna, []); assert.deepEqual(OPCIONALES.marte, []);
});

test('disposición: la misma semilla da el mismo mapa; sin `variar` se usa la forma propia (las pruebas siguen fijas); no gasta el azar', () => {
  assert.equal(firma(G.newGame('marte', 77, 'normal', { variar: true })), firma(G.newGame('marte', 77, 'normal', { variar: true })));
  assert.deepEqual(G.newGame('luna', 3).lay, FIJO.luna);
  assert.deepEqual(layDe(LOCS.estacion, 9), layDe(LOCS.estacion, 9));
  const a = G.newGame('estacion', 55, 'normal'), b = G.newGame('estacion', 55, 'normal', { lay: { espejo: true, cambia: [], quita: [] } });
  assert.equal(a.drones.length, b.drones.length);
  assert.equal(variante(LOCS.estacion, null), LOCS.estacion, 'sin cambios devuelve el destino tal cual');
});

test('disposición: guardar/cargar y el cooperativo rearman EXACTAMENTE el mismo mapa', () => {
  const s = G.newGame('estacion', 4242, 'normal', { variar: true });
  const o = G.revive(JSON.parse(G.serialize(s))); assert.equal(firma(o), firma(s)); assert.deepEqual(o.objects.map((x) => `${x.t}${x.x},${x.y}`), s.objects.map((x) => `${x.t}${x.x},${x.y}`));
  const invitado = G.newGame('estacion', 1); const r = G.applyState(invitado, G.serialize(s)); assert.equal(firma(r), firma(s), 'el invitado arma la disposición del anfitrión');
  const viejo = JSON.parse(G.serialize(G.newGame('luna', 8))); delete viejo.lay; assert.equal(G.revive(viejo).L, LOCS.luna, 'una partida guardada antes de las variantes usa el mapa original');
});

test('E: entre un panel pendiente y la radio (a la misma distancia), E revisa el panel', () => {
  const s = G.newGame('estacion', 7); s.min = 8 * 60 + 5; s.drones = []; s.hazards = []; G.update(s, 0.1);
  const panel = s.objects.find((o) => o.t === 'mant' && o.sys === 'rad');
  s.objects.push({ t: 'capcom', x: panel.x + 2, y: panel.y, loot: [], used: false }); Object.assign(s.p, { x: panel.x + 1.5, y: panel.y + 0.5 });
  assert.equal(G.nearby(s)[0].o?.t, 'mant');
});

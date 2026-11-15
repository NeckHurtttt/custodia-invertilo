import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as G from '../src/core.js';
import { LOCS } from '../src/locs.js';

// Reglas de legibilidad del mapa: lo útil va pegado a las paredes, los objetos son sólidos y nada queda inalcanzable ni tapa una escotilla.
const FLUSH = ['cama', 'cajon', 'estudio', 'registro', 'capcom', 'mant', 'escondite', 'traje', 'palanca', 'trabajo', 'casillero'];
const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

for (const loc of Object.keys(LOCS)) {
  test(`${loc}: los objetos son sólidos, están pegados a la pared y no tapan nada`, () => {
    const s = G.newGame(loc, 4321); const { W, H } = s.L; const g = (x, y) => s.map.grid[y * W + x]; const sol = (x, y) => s.map.solid[y * W + x];
    const roomOf = (x, y) => s.L.rooms[s.map.room[y * W + x]];
    for (const o of s.objects) {
      assert.ok(sol(o.x, o.y), `${o.t} en ${o.x},${o.y} debe ser sólido`);
      assert.equal(g(o.x, o.y), 1, `${o.t} en ${o.x},${o.y} está fuera del piso o encima de una escotilla`);
      assert.ok(!N4.some(([dx, dy]) => g(o.x + dx, o.y + dy) === 2), `${o.t} en ${o.x},${o.y} tapa una escotilla`);
      assert.ok(!s.L.grates.some(([x, y]) => x === o.x && y === o.y), `${o.t} en ${o.x},${o.y} tapa una rejilla`);
      const r = roomOf(o.x, o.y);
      if (FLUSH.includes(o.t) && r && !r.outside) assert.ok(o.x === r.x || o.y === r.y || o.x === r.x + r.w - 1 || o.y === r.y + r.h - 1, `${o.t} en ${o.x},${o.y} (${r.name}) está en medio de la sala: debe ir pegado a una pared`);
    }
    // todo el piso libre se alcanza caminando desde el dormitorio, y cada objeto tiene un lado desde donde usarlo
    const [ix, iy] = G.inicio(s).map(Math.floor); const seen = new Set([`${ix},${iy}`]); const q = [[ix, iy]]; // desde el dormitorio de este mapa
    while (q.length) { const [x, y] = q.shift(); for (const [dx, dy] of N4) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H || !g(nx, ny) || sol(nx, ny) || seen.has(`${nx},${ny}`)) continue; seen.add(`${nx},${ny}`); q.push([nx, ny]); } }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (g(x, y) && !sol(x, y)) assert.ok(seen.has(`${x},${y}`), `la casilla ${x},${y} queda aislada`);
    for (const o of s.objects) assert.ok(N4.some(([dx, dy]) => seen.has(`${o.x + dx},${o.y + dy}`)), `${o.t} en ${o.x},${o.y} no se puede usar desde ningún lado`);
  });
}

test('el jugador no atraviesa un objeto y sus pies no entran en la pared de abajo', () => {
  const s = G.newGame('estacion', 1); s.grace = 999;
  Object.assign(s.p, { x: 3.5, y: 3.5 }); // la cama del dormitorio está justo arriba (3,2)
  for (let i = 0; i < 60; i++) G.update(s, 0.05, { dx: 0, dy: -1 });
  assert.ok(s.p.y >= 3 - 0.05 + 0.05 - 0.001 + 0.0, `no debe entrar en la cama (y=${s.p.y.toFixed(2)})`);
  Object.assign(s.p, { x: 4.5, y: 6.5 }); // la pared sur del dormitorio está en y=8
  for (let i = 0; i < 60; i++) G.update(s, 0.05, { dx: 0, dy: 1 });
  assert.ok(s.p.y + 0.45 <= 8 + 0.001, `los pies deben quedar sobre la pared (y=${s.p.y.toFixed(2)})`);
  assert.ok(s.p.y >= 7.4, 'debe poder llegar hasta la pared');
});

import { PROTOCOLS as _P, PROTO_FUENTE as _F, PROTO_NIVEL as _N } from '../src/common.js';
test('cada protocolo declara su fuente y su nivel de realismo', () => {
  for (const id of Object.keys(_P)) {
    assert.ok(_F[id], `falta fuente de ${id}`);
    assert.ok(_N[_F[id].nivel], `nivel inválido en ${id}`);
    assert.ok(_F[id].fuente.length > 10, `fuente vacía en ${id}`);
  }
});

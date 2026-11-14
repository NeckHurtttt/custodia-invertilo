// Tormenta solar real: refugio vs seguir con lo tuyo.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as G from '../src/core.js';
import * as S from '../src/sistemas.js';
import { STORM_DAYS, STORM_MIN, SHELTER } from '../src/clima.js';

const at = (s, roomId) => { const r = s.L.rooms.find((x) => x.id === roomId); s.p.x = r.x + Math.floor(r.w / 2) + 0.5; s.p.y = r.y + Math.floor(r.h / 2) + 0.5; s.p.sleep = false; };
const fresh = (loc, opts) => { const s = G.newGame(loc, 4, 'normal', opts); s.drones = []; s.hazards.length = 0; s.events.length = 0; if (s.vil) { s.vil.walkers = []; s.vil.mission = null; } return s; };
function runStorm(s, room) {
  s.day = STORM_DAYS[0]; s.min = STORM_MIN; const d0 = s.sys.dose, e0 = s.sys.lvl.energia;
  for (let i = 0; i < 20 * 120 && (s.sys.storm || s.sys.storms === 0); i++) { at(s, room); s.hazards.length = 0; G.update(s, 1 / 20, { dx: 0, dy: 0 }); }
  return { dose: s.sys.dose - d0, energia: e0 - s.sys.lvl.energia };
}

test('llega una tormenta en el día 2 con la llamarada de la misión', () => {
  const s = fresh('luna', { flares: [{ cls: 'X2.0', date: '2026-11-03', source: 'donki' }] });
  s.day = 2; s.min = STORM_MIN; G.update(s, 1 / 20, { dx: 0, dy: 0 });
  assert.equal(s.sys.storm?.flare.cls, 'X2.0');
  assert.ok(s.log.some((l) => /DONKI/.test(l.text)));
});

for (const loc of ['estacion', 'luna', 'marte']) {
  test(`${loc}: refugiarse da mucha menos dosis pero gasta energía`, () => {
    const a = runStorm(fresh(loc), SHELTER[loc].room);
    const b = runStorm(fresh(loc), 'comedor');
    assert.ok(a.dose < b.dose * 0.3, `${a.dose} vs ${b.dose}`);
    assert.ok(a.energia > b.energia, 'el refugio gasta energía');
  });
}

test('la tormenta excusa faltar al horario y deja el resumen de la decisión', () => {
  const s = fresh('estacion'); runStorm(s, 'dorm');
  assert.equal(s.sys.storms, 1); assert.equal(s.sys.lastStorm.refugio, true);
  assert.ok(s.log.some((l) => /Pasó la tormenta/.test(l.text)));
});

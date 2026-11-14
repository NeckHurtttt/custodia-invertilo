import { test } from 'node:test';
import assert from 'node:assert/strict';
import { flareRank, strongestFlares, missionFlares, stormDose, SHELTER, fetchFlares, ARCHIVED_FLARES } from '../src/clima.js';
import { LOCS } from '../src/locs.js';

test('clases de llamarada', () => {
  assert.ok(flareRank('X1') > flareRank('M9.9')); assert.ok(flareRank('M1') > flareRank('C9')); assert.equal(flareRank('?'), 0);
});
test('las 3 más fuertes de DONKI, completadas con archivadas', () => {
  const top = strongestFlares([{ classType: 'M1', beginTime: '2026-11-01T00:00Z' }, { classType: 'X2', beginTime: '2026-11-02T05:00Z' }, { classType: 'X1', beginTime: '2026-11-02T08:00Z' }]);
  assert.deepEqual(top.map((f) => f.cls), ['X2', 'M1']);
  const m = missionFlares(top); assert.equal(m.length, 3); assert.equal(m[2].source, 'archivo');
  assert.deepEqual(missionFlares(null), ARCHIVED_FLARES);
});
test('dosis: más fuerte da más; la Estación protege más que la Luna', () => {
  assert.ok(stormDose('X8.7', 'luna') > stormDose('M1', 'luna'));
  assert.ok(stormDose('X8.7', 'estacion') < stormDose('X8.7', 'luna'));
});
test('cada destino tiene una sala refugio que existe', () => {
  for (const [loc, sh] of Object.entries(SHELTER)) assert.ok(LOCS[loc].rooms.some((r) => r.id === sh.room), loc);
});
test('fetchFlares: usa DONKI si responde y devuelve null si todo falla', async () => {
  const ok = await fetchFlares({ fetchImpl: async () => ({ ok: true, json: async () => [{ classType: 'M3.1', beginTime: '2026-11-10T01:00Z' }] }) });
  assert.deepEqual(ok, [{ cls: 'M3.1', date: '2026-11-10', source: 'donki' }]);
  assert.equal(await fetchFlares({ fetchImpl: async () => { throw new Error('sin red'); } }), null);
});

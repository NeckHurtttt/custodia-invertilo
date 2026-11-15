import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as G from '../src/core.js';
import * as AI from '../src/ia.js';
import { susTime } from '../src/villains.js';

test('la vigilancia aumenta progresivamente y tiene límites en todos los niveles', () => {
  for (const dif of ['cadete', 'facil', 'normal', 'dificil']) {
    const s = G.newGame('estacion', 1, dif);
    let previous = AI.tuning(s);
    assert.equal(previous.speed, 1); assert.equal(previous.vision, 1);
    const reaction = susTime(s, 4);
    for (let day = 2; day <= 10; day++) {
      s.day = day; const t = AI.tuning(s);
      assert.ok(t.speed > previous.speed && t.vision > previous.vision);
      assert.ok(t.reaction < previous.reaction && t.persistence > previous.persistence);
      previous = t;
    }
    assert.ok(susTime(s, 4) < reaction);
    assert.ok(previous.speed <= 1.37 && previous.vision <= 1.3);
    s.day = 100; assert.deepEqual(AI.tuning(s), previous);
  }
  const s = G.newGame(); s.day = 10;
  s.dif = 'cadete'; const soft = AI.tuning(s).speed;
  s.dif = 'normal'; assert.ok(AI.tuning(s).speed > soft);
});
test('UNA NOCHE escala por tiempo activo; las partidas antiguas se pueden cargar', () => {
  const s = G.newGame('estacion', 1, 'normal', { mode: 'noche' });
  const early = AI.tuning(s); s.t = 210;
  assert.ok(AI.tuning(s).speed > early.speed);
  const old = G.revive(JSON.parse(G.serialize(s)));
  assert.equal(old.aiMemory, undefined);
  assert.doesNotThrow(() => G.update(old, 0.1));
});
function train(s, visible = true) {
  for (let i = 0; i < 12; i++) {
    s.t += 1; s.p.x = i % 2 ? 3.5 : 4.5;
    AI.observe(s, 1, visible);
  }
}
test('aprende recorridos observados, no posiciones secretas ni tiempo quieto', () => {
  const s = G.newGame(); s.day = 5; train(s);
  assert.ok(AI.predict(s));
  for (const kind of ['unseen', 'hidden', 'duct', 'sleep']) {
    const q = G.newGame(); q.day = 5;
    if (kind === 'hidden') q.p.hidden = { x: 3.5, y: 3.5 };
    if (kind === 'duct') q.p.inDuct = true;
    if (kind === 'sleep') q.p.sleep = true;
    train(q, kind !== 'unseen'); assert.equal(AI.predict(q), null);
  }
  const q = G.newGame(); q.day = 5;
  for (let i = 0; i < 20; i++) { q.t++; AI.observe(q, 1, true); }
  assert.equal(AI.predict(q), null);
});
test('memoria persistente, olvido, reinicio entre partidas e IA apagada', () => {
  const s = G.newGame(); s.day = 5; train(s);
  assert.deepEqual(G.revive(JSON.parse(G.serialize(s))).aiMemory, s.aiMemory);
  const before = JSON.stringify(s.aiMemory); s.iaOn = false; train(s);
  assert.equal(JSON.stringify(s.aiMemory), before); assert.equal(AI.predict(s), null);
  s.iaOn = true;
  for (let i = 0; i < 20; i++) { s.t += 61; AI.observe(s, 1, false); }
  assert.equal(AI.predict(s), null); assert.equal(G.newGame().aiMemory, undefined);
});
test('patrullas investigan rutas conocidas en los tres destinos y respetan emergencias y gracia', () => {
  for (const loc of ['estacion', 'luna', 'marte']) for (const safe of [false, true]) {
    const s = G.newGame(loc, 12, 'normal'); s.day = 10; train(s);
    s.p.hidden = { x: 3.5, y: 3.5 }; s.events = []; s.vil.events = [];
    s.grace = safe ? 60 : 0;
    G.update(s, 0.1);
    const searches = s.drones.filter(d => d.aiSearch > 0).length;
    assert.ok(safe ? searches === 0 : searches > 0 && searches <= 2);
    assert.ok(s.log.some(l => l.text.includes('Vigilancia nivel')));
  }
});
test('visión mejorada sigue respetando paredes, escondites y conductos', () => {
  const s = G.newGame(); s.day = 10;
  const d = s.drones[0]; d.x = s.p.x; d.y = s.p.y;
  assert.ok(G.canSee(s, d)); s.p.inDuct = true; assert.equal(G.canSee(s, d), false);
  s.p.inDuct = false; s.p.hidden = { x: s.p.x, y: s.p.y }; assert.equal(G.canSee(s, d), false);
});

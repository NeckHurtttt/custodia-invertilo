import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as G from '../src/core.js';
import * as V from '../src/villains.js';
import { VILLAINS, LOC_VILLAINS } from '../src/villains.js';

const run = (s, sec, inp = { dx: 0, dy: 0 }) => { for (let t = 0; t < sec; t += 0.05) { G.update(s, 0.05, typeof inp === 'function' ? inp(t) : inp); if (s.pending?.kind === 'respira') G.resolveBreath(s, t % 2 < 1); else if (s.pending) s.pending = null; } };

for (const loc of Object.keys(LOC_VILLAINS)) {
  test(`${loc}: los 10 villanos existen y aparecen sin romperse`, () => {
    assert.equal(LOC_VILLAINS[loc].length, 10);
    const s = G.newGame(loc, 11);
    for (const id of LOC_VILLAINS[loc]) {
      const d = VILLAINS[id]; assert.ok(d, id);
      if (d.kind === 'hazard') G.spawnHazard(s, d.hz);
    }
    s.vil.today = LOC_VILLAINS[loc].slice();
    for (let day = 0; day < 4; day++) {
      run(s, 60, (t) => ({ dx: Math.sin(t / 3), dy: Math.cos(t / 4), crouch: t % 9 < 3 }));
      s.p.salud = 100; s.integ = 100; s.over = null;
    }
    assert.ok(G.serialize(s).length > 100);
    const back = G.revive(JSON.parse(G.serialize(s)));
    run(back, 5);
  });
  test(`${loc}: cada día se sortean villanos distintos`, () => {
    const s = G.newGame(loc, 3); const seen = new Set();
    for (let d = 0; d < 9; d++) { s.vil.today.forEach((x) => seen.add(x)); s.min = 1439.9; s.p.salud = 100; s.integ = 100; s.alert = 0; G.update(s, 0.05); }
    assert.equal(s.vil.today[0], LOC_VILLAINS[loc][0]);
    assert.ok(seen.size >= 7, `vistos: ${seen.size}`);
  });
}

test('un dron te atrapa en cuanto te toca si llevas herramientas', () => {
  const s = G.newGame('estacion', 5); const d = s.drones[0];
  s.p.inv.push('destornillador'); s.p.x = d.x; s.p.y = d.y; s.min = 600;
  G.update(s, 0.05);
  assert.equal(s.p.x, 3.5); assert.ok(!G.has(s, 'destornillador'));
});

test('escondido no te ven; si te vio entrar, te busca y hay que contener la respiración', () => {
  const s = G.newGame('estacion', 5); const lock = s.objects.find((o) => o.t === 'casillero');
  s.min = 1400; s.p.x = lock.x + 0.5; s.p.y = lock.y + 0.5;
  const d = s.drones[0]; d.x = s.p.x + 3; d.y = s.p.y; d.mode = 'persigue'; d.lost = 0; d.target = [s.p.x, s.p.y];
  G.toggleHide(s); assert.ok(s.p.hidden); assert.equal(d.mode, 'busca');
  assert.equal(G.canSee(s, d), false);
  for (let i = 0; i < 200 && !s.pending; i++) G.update(s, 0.05);
  assert.equal(s.pending?.kind, 'respira');
  G.resolveBreath(s, true); assert.ok(s.p.hidden);
});

test('lanzar una pieza hace ruido', () => {
  const s = G.newGame('estacion', 5); G.throwItem(s); assert.ok(s.noise);
});

test('un compañero contento distrae a la vigilancia', () => {
  const s = G.newGame('estacion', 5); const c = s.crew[0]; c.want = null; s.p.x = c.x; s.p.y = c.y;
  G.interact(s); assert.ok(c.busyT > 0);
});

test('apagón: escotilla cerrada se abre con batería', () => {
  const s = G.newGame('marte', 5); const h = G.spawnHazard(s, 'apagon');
  const d = s.map.doors.find((x) => x.room === h.room); assert.equal(d.lock, 'energia'); assert.equal(d.open, false);
  run(s, 90); assert.notEqual(d.lock, 'energia');
});

test('misión: quedarse junto al objetivo la cumple', () => {
  const s = G.newGame('luna', 5); s.vil.missions = [0]; s.min = 600; G.update(s, 0.05);
  const m = s.vil.mission; assert.ok(m);
  s.iaOn = false; s.vil.walkers = []; s.p.x = m.x; s.p.y = m.y; G.interact(s);
  run(s, m.need + 1); assert.equal(s.vil.mission, null); assert.ok(s.stats.solved >= 1);
});

test('dificultad: Fácil ve menos, sortea menos villanos y da gracia tras un bloqueo', async () => {
  const G = await import('../src/core.js');
  const f = G.newGame('estacion', 7, 'facil'), t = G.newGame('estacion', 7, 'dificil');
  assert.equal(f.dif, 'facil'); assert.equal(G.newGame('luna', 1, 'xx').dif, 'normal');
  assert.ok(G.dif(f).see < G.dif(t).see && G.dif(f).alert < G.dif(t).alert);
  G.raise(f, 20); G.raise(t, 20); assert.ok(f.alert < t.alert);
  G.lockdown(f); assert.ok(f.grace > 0);
  f.day = 5; t.day = 5; (await import('../src/villains.js')).startDay(f); (await import('../src/villains.js')).startDay(t);
  assert.ok(f.vil.today.length < t.vil.today.length);
  const r = G.revive(JSON.parse(G.serialize(f))); assert.equal(r.dif, 'facil');
});

// ---------- IA enemiga: detección gradual, memoria, ruido, telegrafía (pase enemy-ai) ----------
const solo = (s, keep) => { for (const d of s.drones) if (d !== keep) d.stun = 9999; s.vil.walkers = []; s.vil.events = []; s.vil.missions = []; s.hazards = []; s.events = []; s.sfx = []; };
/** Dos casillas libres en línea recta (mismo y), a `dist` de distancia, con vista libre y fuera del dormitorio. */
function enLinea(s, dist) {
  const { W, H } = s.L;
  const libre = (x, y) => { const r = s.L.rooms.find((q) => q.id === G.roomIdAt(s, x + 0.5, y + 0.5)); return s.map.grid[y * W + x] === 1 && !s.map.solid[y * W + x] && r && r.id !== 'dorm' && !r.outside && !r.restricted; };
  for (let y = 2; y < H - 2; y++) for (let x = 2; x < W - dist - 2; x++) {
    let all = true; for (let k = 0; k <= dist; k++) if (!libre(x + k, y)) { all = false; break; }
    if (all && G.los(s, x + 0.5, y + 0.5, x + dist + 0.5, y + 0.5)) return [x + 0.5, y + 0.5, x + dist + 0.5, y + 0.5];
  }
  throw new Error('sin pasillo recto de ' + dist);
}
function cara(seed, dist, loc = 'estacion') {
  const s = G.newGame(loc, seed); const d = s.drones[0]; solo(s, d);
  const [dx, dy, px, py] = enLinea(s, dist);
  s.min = 1400; Object.assign(d, { x: dx, y: dy, dir: 0, mode: 'patrulla', path: null, pause: 0 }); Object.assign(s.p, { x: px, y: py, crouch: false });
  return { s, d };
}

test('dron: primero sospecha (?) y solo después persigue (!), con señales para VFX y audio', () => {
  const { s, d } = cara(5, 4); const modos = []; const claves = new Set();
  for (let t = 0; t < 3; t += 0.05) { G.update(s, 0.05); modos.push(d.mode); s.sfx.forEach((k) => claves.add(k)); s.sfx = []; if (d.mode === 'persigue') break; }
  const iS = modos.indexOf('sospecha'), iP = modos.indexOf('persigue');
  assert.ok(iS >= 0 && iP > iS, `modos: ${modos.join(',')}`);
  assert.ok((iP - iS) * 0.05 >= 0.4, 'el jugador tuvo al menos 0,4 s para reaccionar');
  assert.ok(claves.has('sospecha') && claves.has('visto'));
  assert.equal(d.sus, 1); assert.ok(d.alarmT > 0 && d.qT > 0); assert.ok(d.lastSeen);
});

test('dron: de cerca no hay ventaja (persigue al instante); la dificultad escala el tiempo de duda', () => {
  const { s, d } = cara(5, 1);
  G.update(s, 0.05); assert.equal(d.mode, 'persigue');
  const f = G.newGame('estacion', 5, 'facil'), t = G.newGame('estacion', 5, 'dificil');
  assert.ok(V.susTime(f, 4) > V.susTime(t, 4));
});

test('dron: si lo pierdes de vista antes de que se decida, duda, va a la última posición y vuelve a patrullar sin perseguir', () => {
  const { s, d } = cara(5, 4); const visto = [s.p.x, s.p.y]; const modos = new Set();
  G.update(s, 0.05); assert.equal(d.mode, 'sospecha'); assert.ok(d.sus > 0 && d.sus < 1);
  Object.assign(s.p, { x: 3.5, y: 3.5 }); s.min = 1400;
  for (let t = 0; t < 40; t += 0.05) { G.update(s, 0.05); modos.add(d.mode); }
  assert.ok(modos.has('investiga') && !modos.has('persigue'), [...modos].join());
  assert.ok(Math.abs(d.lastSeen[0] - visto[0]) < 1e-9 && d.sus === 0);
  assert.equal(d.mode, 'patrulla');
});

test('dron: tras perseguirte pierde el rastro, investiga donde te vio por última vez (memoria) y emite "perdido"', () => {
  const { s, d } = cara(7, 4);
  for (let t = 0; t < 3 && d.mode !== 'persigue'; t += 0.05) G.update(s, 0.05);
  assert.equal(d.mode, 'persigue'); s.sfx = []; const ult = d.lastSeen.slice();
  s.p.inDuct = true; Object.assign(s.p, { x: 3.5, y: 3.5 }); let investigo = false; // te metes en un conducto: ya no te ve
  for (let t = 0; t < 6; t += 0.05) { G.update(s, 0.05); if (d.mode === 'investiga') { investigo = true; break; } }
  assert.ok(investigo); assert.deepEqual(d.target, ult); assert.ok(s.sfx.includes('perdido')); assert.ok(d.qT > 0);
});

test('ruido: los vigilantes lo oyen, muestran "?" y van al lugar; con pared de por medio oyen menos lejos', () => {
  const s = G.newGame('estacion', 5); const d = s.drones[0]; solo(s, d);
  const [x0, y0] = enLinea(s, 4);
  Object.assign(d, { mode: 'patrulla', x: x0, y: y0, path: null, pause: 0 }); s.noise = { x: x0 + 3, y: y0, t: 6 }; s.p.x = 3.5; s.p.y = 3.5;
  G.update(s, 0.05); assert.equal(d.mode, 'investiga'); assert.ok(d.qT > 0); assert.deepEqual(d.target, [x0 + 3, y0]);
  const { W, H } = s.L; let par = null;
  for (let y = 1; y < H - 1 && !par; y++) for (let x = 1; x < W - 9 && !par; x++) for (const k of [7, 8, 9]) { if (s.map.grid[y * W + x] === 1 && s.map.grid[y * W + x + k] === 1 && !G.los(s, x + 0.5, y + 0.5, x + k + 0.5, y + 0.5)) { par = [[x + 0.5, y + 0.5], [x + k + 0.5, y + 0.5]]; break; } }
  assert.ok(par);
  s.noise = { x: par[1][0], y: par[1][1], t: 6 }; assert.equal(V.hearsNoise(s, { x: par[0][0], y: par[0][1] }), false);
  s.noise = { x: x0 + 8, y: y0, t: 6 }; assert.equal(V.hearsNoise(s, { x: x0, y: y0 }), G.los(s, x0, y0, x0 + 8, y0));
});

test('rondas con variaciones: se detienen a mirar, son deterministas con la misma semilla y sobreviven al guardado', () => {
  const corre = (seed) => {
    const s = G.newGame('estacion', seed); const d = s.drones[0]; solo(s, d); s.min = 600; s.p.x = 3.5; s.p.y = 3.5; let pausas = 0, antes = false; const wps = new Set();
    for (let t = 0; t < 150; t += 0.05) { s.p.salud = 100; s.p.inv = []; s.alert = 0; s.min = Math.min(s.min, 700); G.update(s, 0.05); const ahora = d.pause > 0; if (ahora && !antes) pausas++; antes = ahora; wps.add(d.wp); }
    return { s, d, pausas, wps: wps.size };
  };
  const a = corre(9), b = corre(9), c = corre(10);
  assert.ok(a.pausas >= 2, `pausas ${a.pausas}`); assert.ok(a.wps >= 2);
  assert.deepEqual([a.d.x, a.d.y, a.d.wp, a.d.step], [b.d.x, b.d.y, b.d.wp, b.d.step]);
  assert.notDeepEqual([a.d.x, a.d.y, a.d.wp, a.d.step], [c.d.x, c.d.y, c.d.wp, c.d.step]);
  const back = G.revive(JSON.parse(G.serialize(a.s))); run(back, 3); assert.ok(back.drones[0]);
});

test('robot (cazador): al engancharte se queda fijo un instante con "!" antes de embestir', () => {
  const s = G.newGame('estacion', 5); solo(s, null); s.drones.forEach((d) => { d.stun = 9999; });
  const [x0, y0, px, py] = enLinea(s, 5); const h = G.spawnHazard(s, 'cazador'); Object.assign(h, { x: x0, y: y0, path: null }); Object.assign(s.p, { x: px, y: py }); s.sfx = [];
  const sal = s.p.salud; G.update(s, 0.05);
  assert.ok(h.chasing && h.tele > 0 && h.alarmT > 0); assert.ok(s.sfx.includes('visto'));
  const x1 = h.x; for (let t = 0; t < 0.4; t += 0.05) G.update(s, 0.05);
  assert.equal(h.x, x1, 'quieto durante el aviso'); assert.equal(s.p.salud, sal);
  for (let t = 0; t < 1; t += 0.05) G.update(s, 0.05); assert.ok(Math.abs(h.x - x1) > 0.5, 'después sí avanza');
});

test('brazo robótico: espera quieto (aviso) al aparecer y en cada borde, y no golpea mientras espera', () => {
  const s = G.newGame('estacion', 5); solo(s, null); s.drones.forEach((d) => { d.stun = 9999; }); const h = G.spawnHazard(s, 'canadarm');
  assert.ok(h.pause > 0 && h.tele > 0);
  const r = s.L.rooms.find((x) => x.id === h.room); Object.assign(s.p, { x: h.x, y: r.y + 0.5, dir: 0 }); s.min = 600;
  const x0 = h.x; G.update(s, 0.05); assert.equal(h.x, x0); assert.equal(s.p.salud, 100);
  let pausas = 0, prev = true; for (let t = 0; t < 40; t += 0.05) { s.p.x = 1; s.p.y = 1; s.min = 600; G.update(s, 0.05); const ahora = h.pause > 0; if (ahora && !prev) pausas++; prev = ahora; }
  assert.ok(pausas >= 2, `pausas en bordes: ${pausas}`);
});

test('peligros nuevos nunca aparecen pegados al jugador y las cuentas atrás avisan con "aviso"', () => {
  const s = G.newGame('estacion', 5); solo(s, null); const r = [...s.L.rooms].filter((x) => !x.restricted && !x.outside && x.id !== 'dorm').sort((a, b) => b.w * b.h - a.w * a.h)[0];
  Object.assign(s.p, { x: r.x + r.w / 2, y: r.y + r.h / 2 });
  for (let i = 0; i < 25; i++) { const h = G.spawnHazard(s, 'fuego', r.id); const d = Math.hypot(h.x - s.p.x, h.y - s.p.y); assert.ok(d >= 3.5 || d >= 0, `a ${d}`); assert.ok(d >= 3.5, `fuego a ${d}`); s.hazards = []; }
  const b = G.spawnHazard(s, 'basura'); b.t = 10.5; s.sfx = []; for (let t = 0; t < 1; t += 0.05) G.update(s, 0.05);
  assert.ok(s.sfx.includes('aviso') && b.w10);
});

test('tras una captura todos pierden el rastro (gracia real) y s.threat resume el peligro', () => {
  const { s, d } = cara(5, 4);
  G.update(s, 0.05); assert.equal(s.threat.lvl, 1); assert.ok(s.threat.sus > 0);
  for (let t = 0; t < 3 && d.mode !== 'persigue'; t += 0.05) G.update(s, 0.05);
  assert.equal(s.threat.lvl, 2); assert.ok(s.threat.near < 10);
  const otro = s.drones[1]; Object.assign(otro, { mode: 'persigue', stun: 0, target: [1, 1], sus: 1 });
  G.lockdown(s);
  for (const x of [d, otro]) { assert.equal(x.mode, 'patrulla'); assert.equal(x.sus, 0); }
  G.update(s, 0.05); assert.equal(s.threat.lvl, 0); assert.ok(s.grace > 0);
});

test('cámara de SELENE: tarda un instante en reconocerte (sus) y avisa antes de dar la alarma', () => {
  const s = G.newGame('luna', 5); solo(s, null); const h = G.spawnHazard(s, 'camara'); s.min = 1400; s.drones.forEach((d) => { d.stun = 9999; });
  h.ph = 0; h.base = Math.PI / 2; Object.assign(s.p, { x: h.x, y: h.y + 2.5, crouch: false }); s.sfx = [];
  if (!G.los(s, h.x, h.y, s.p.x, s.p.y)) return; // sala rara: la detección ya la cubren las pruebas de drones
  G.update(s, 0.05); assert.ok(h.sees); assert.ok(!h.alarm && h.sus > 0 && h.qT > 0); assert.ok(s.sfx.includes('sospecha'));
  for (let t = 0; t < 2.5 && !h.alarm; t += 0.05) { h.ph = 0; G.update(s, 0.05); }
  assert.ok(h.alarm && s.sfx.includes('visto'));
});

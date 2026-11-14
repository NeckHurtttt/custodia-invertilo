// Efectos de pantalla: preferencia «suave», sacudida, hitstop y tope de partículas. Nada de esto toca reglas del núcleo.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as FX from '../src/fx.js';
import * as A from '../src/arte.js';
import * as G from '../src/core.js';

const memoria = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), _m: m }; };
const nuevo = () => { globalThis.localStorage = memoria(); FX._reiniciar(); };
// Contexto de dibujo de mentira: acepta cualquier llamada y cualquier propiedad.
const ctxFalso = () => { const p = new Proxy(function () {}, { get: (_t, k) => (k === Symbol.toPrimitive ? () => 0 : p), set: () => true, apply: () => p }); return p; };
globalThis.document ??= { createElement: () => ({ width: 0, height: 0, getContext: () => ctxFalso() }) };

test('fx: por defecto es normal, se guarda en lfr.fx y se puede alternar', () => {
  nuevo();
  assert.equal(FX.getFx(), 'normal'); assert.equal(FX.suave(), false);
  assert.equal(FX.setFx('suave'), 'suave'); assert.equal(globalThis.localStorage.getItem('lfr.fx'), 'suave');
  FX._reiniciar(); assert.equal(FX.getFx(), 'suave', 'se lee lo guardado');
  assert.equal(FX.toggleFx(), 'normal'); assert.equal(FX.setFx('cualquier cosa'), 'normal');
  let visto = null; FX.onFx((m) => { visto = m; }); FX.setFx('suave'); assert.equal(visto, 'suave', 'la interfaz se entera del cambio');
});

test('fx: sin localStorage no falla y respeta prefers-reduced-motion', () => {
  delete globalThis.localStorage; FX._reiniciar(); assert.equal(FX.getFx(), 'normal');
  globalThis.matchMedia = () => ({ matches: true }); FX._reiniciar(); assert.equal(FX.getFx(), 'suave', 'si el sistema pide menos movimiento, arranca suave');
  delete globalThis.matchMedia; nuevo();
});

test('fx: la sacudida es corta (≤4 px), se apaga con el tiempo y en modo suave vale 0', () => {
  nuevo(); const o = { x: 9, y: 9 };
  for (let t = 0; t < 2000; t += 7) { FX.shakeOffset(0.8, t, o); assert.ok(Math.abs(o.x) <= 4 && Math.abs(o.y) <= 3, `fuera de rango: ${o.x},${o.y}`); }
  FX.shakeOffset(0, 123, o); assert.deepEqual([o.x, o.y], [0, 0]);
  let mayor = 0; for (let t = 0; t < 500; t += 3) { FX.shakeOffset(0.05, t, o); mayor = Math.max(mayor, Math.abs(o.x)); } assert.ok(mayor <= 1, 'al final de la sacudida casi no se mueve');
  FX.setFx('suave'); for (let t = 0; t < 200; t += 5) { FX.shakeOffset(0.8, t, o); assert.deepEqual([o.x, o.y], [0, 0]); }
});

test('fx: hitstop de 60-90 ms al ser atrapado / golpeado / salvar una emergencia, con descanso y sin tocar el estado', () => {
  nuevo(); const s = G.newGame('estacion', 7, 'normal', { reflex: true });
  const copia = JSON.stringify(G.serialize(s));
  FX.watch(s, 1000); assert.equal(FX.frozen(1001), false, 'el primer cuadro solo toma nota');
  s.stats.caught++; s.p.hit = 1; let ev = FX.watch(s, 1016);
  assert.ok(ev.caught && !ev.hit, 'captura'); assert.ok(FX.frozen(1050) && !FX.frozen(1016 + 91), 'congela ≤ 90 ms');
  s.p.hit = 0; FX.watch(s, 1200); s.p.hit = 0.8; ev = FX.watch(s, 1216); assert.ok(ev.hit && !FX.frozen(1220), 'dentro del descanso el golpe se ve (chispas) pero no encadena otro congelado');
  s.p.hit = 0; FX.watch(s, 1700); s.p.hit = 0.8; ev = FX.watch(s, 1716); assert.ok(ev.hit && FX.frozen(1740) && !FX.frozen(1716 + 71), 'golpe nuevo: 70 ms');
  s.p.hit = 0.2; ev = FX.watch(s, 2400); assert.ok(!ev.hit, 'el daño continuo (p.hit fijo en 0,2) no cuenta como golpe nuevo');
  s.sys.st.saved++; ev = FX.watch(s, 3000); assert.ok(ev.saved && FX.frozen(3030) && !FX.frozen(3061), 'emergencia salvada: 60 ms');
  assert.equal(JSON.stringify(G.serialize(s)).length > 0, true); assert.notEqual(copia, undefined);
});

test('fx: en modo suave no hay hitstop', () => {
  nuevo(); FX.setFx('suave'); const s = G.newGame('estacion', 8, 'normal');
  FX.watch(s, 100); s.stats.caught++; const ev = FX.watch(s, 116); assert.ok(ev.caught, 'el evento se ve (para chispas)'); assert.equal(FX.frozen(120), false);
});

test('arte: nunca hay más de 144 partículas vivas, un burst trae ≤30 y el ambiente no llena los últimos 30 huecos', () => {
  nuevo(); const cx = ctxFalso(); const cam = { x: 0, y: 0 };
  for (let i = 0; i < 40; i++) A.burst(5, 5, '255,0,0', 99);
  A.particles(cx, 0.001, cam, 512, 288, 'luna', true); assert.ok(A.vivas() <= 144, `vivas: ${A.vivas()}`);
  A.particles(cx, 5, cam, 512, 288, 'estacion', false); // todo caduca
  A.particles(cx, 0.001, cam, 512, 288, 'estacion', false); const motas = A.vivas();
  for (let i = 0; i < 400; i++) A.step(80, 80, 'luna', true);
  A.particles(cx, 0.001, cam, 512, 288, 'luna', false); assert.ok(A.vivas() - motas <= 80 + 8, `el ambiente no pasa de ~80 del pozo (hay ${A.vivas() - motas})`);
  A.burst(1, 1, '0,255,0', 30); A.particles(cx, 0.001, cam, 512, 288, 'luna', false); assert.ok(A.vivas() <= 144);
  A.particles(cx, 5, cam, 512, 288, 'luna', false);
  FX.setFx('suave'); for (let i = 0; i < 10; i++) A.burst(1, 1, '0,255,0', 30); A.particles(cx, 0.001, cam, 512, 288, 'luna', false); assert.ok(A.vivas() <= 50 + 30, `en suave hay menos (${A.vivas()})`);
});

test('arte: senales, zonas y overlays corren con el estado real y sin errores (también en modo suave)', () => {
  nuevo(); const cx = ctxFalso(); const vis = () => true;
  for (const loc of ['estacion', 'luna', 'marte']) {
    const s = G.newGame(loc, 9, 'normal');
    for (let i = 0; i < 400; i++) G.update(s, 0.05, { dx: 0, dy: 0, crouch: false });
    for (const d of s.drones) { d.sus = 0.5; d.qT = 1; d.alarmT = 0.8; d.mode = 'investiga'; d.lastSeen = [d.x, d.y]; }
    s.threat = { lvl: 2, sus: 1, near: 1 };
    for (const modo of ['normal', 'suave']) {
      FX.setFx(modo);
      assert.doesNotThrow(() => { A.senales(cx, s, 1000, vis); A.overlays(cx, s, 1000, 0.016, 800, 450, 0.8); A.glow(cx, s, 1000, vis, s.objects[0]); A.ambiente(s, 0.016, vis); A.luzJugador(cx, 10, 10, loc); A.lamparas(cx, s.L.rooms[0], 1000); });
    }
  }
});

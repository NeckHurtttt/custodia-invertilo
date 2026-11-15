import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as G from '../src/core.js';
import * as Sys from '../src/sistemas.js';
import * as Meta from '../src/meta.js';
import * as UI from '../src/ui.js';
import { ARCHIVED_FLARES, SHELTER, dailyFlare, flareHit } from '../src/clima.js';
import { setLang } from '../src/i18n.js';

// Reto del día con la llamarada real del día (paso I): la misma para todos, a media noche, con un aviso de 30 s.
const dia = (y, m, d) => Meta.daily(new Date(y, m - 1, d));
/** Partida del reto de un día dado, lista para llegar a la hora de la llamarada. */
function reto(d = dia(2026, 11, 15)) {
  const s = G.newGame(d.loc, d.seed, d.dif, { mode: d.mode, perk: d.perk, daily: true, flare: d.flare, flareMin: d.flareMin });
  s.p.sleep = false; s.grace = 9999; s.events = []; s.hazards.length = 0; s.p.salud = 100; return { s, d };
}
/** Pone el reloj en un minuto corrido de la noche (pasada la medianoche es el día 2). */
const aMin = (s, m) => { s.day = m >= 1440 ? 2 : 1; s.min = m % 1440; };
const corre = (s, segs, dt = 0.05) => { for (let t = 0; t < segs; t += dt) { s.p.salud = Math.min(s.p.salud, 100); G.update(s, dt, { dx: 0, dy: 0 }); } };
const alRefugio = (s) => { const r = s.L.rooms.find((x) => x.id === SHELTER[s.loc].room); Object.assign(s.p, { x: r.x + r.w / 2, y: r.y + r.h / 2, inDuct: false, hidden: null }); };

test('reto del día: la llamarada y su hora salen de la fecha (igual para todos) y rotan entre las reales archivadas', () => {
  const a = dia(2026, 11, 15), b = dia(2026, 11, 15);
  assert.deepEqual(a, b, 'el mismo día da el mismo reto');
  assert.ok(ARCHIVED_FLARES.some((f) => f.cls === a.flare.cls && f.date === a.flare.date), 'es una llamarada real archivada de DONKI');
  assert.ok(a.flareMin >= 1380 && a.flareMin < 1560, `la llamarada llega entre las 23:00 y las 02:00 (${a.flareMin})`);
  const dias = Array.from({ length: 9 }, (_, i) => dia(2026, 11, 1 + i));
  assert.equal(new Set(dias.map((d) => d.flare.date)).size, ARCHIVED_FLARES.length, 'en 9 días salen todas las llamaradas');
  assert.ok(new Set(dias.map((d) => `${d.loc}/${d.flare.date}`)).size >= 6, 'destino y llamarada no se repiten en el mismo orden');
  assert.equal(dailyFlare(-1), dailyFlare(-1)); assert.ok(dailyFlare(0));
});

test('reto del día: solo el reto tiene llamarada; en una noche normal o en la campaña no hay', () => {
  const { s } = reto(); assert.ok(s.dFlare && !s.dFlare.done && s.dFlare.min >= 1380);
  assert.equal(G.newGame('estacion', 4, 'normal', { mode: 'noche' }).dFlare, undefined);
  assert.equal(G.newGame('estacion', 4, 'normal', { flare: ARCHIVED_FLARES[0], flareMin: 1400 }).dFlare, undefined);
  assert.doesNotThrow(() => JSON.stringify(s.dFlare));
});

test('reto del día: a la hora marcada llega la llamarada con 30 s de aviso y el refugio de cada destino', () => {
  for (const [y, m, d] of [[2026, 11, 14], [2026, 11, 15], [2026, 11, 16]]) {
    const { s, d: dd } = reto(dia(y, m, d)); aMin(s, dd.flareMin - 10); corre(s, 1); assert.equal(s.hazards.filter((x) => x.kind === 'llamarada').length, 0, 'todavía no');
    aMin(s, dd.flareMin); corre(s, 0.2);
    const h = s.hazards.find((x) => x.kind === 'llamarada'); assert.ok(h, `${dd.loc}: debe aparecer la llamarada`);
    assert.deepEqual(h.def.safe, [SHELTER[dd.loc].room]); assert.ok(h.t > 28 && h.t <= 30); assert.equal(h.def.hit, flareHit(dd.flare.cls, dd.loc)); assert.equal(Math.round(h.def.dmg * G.dif(s).dmg), h.def.hit, 'el golpe real (con el nivel) es el que dice el aviso');
    assert.ok(s.log.some((l) => l.text.includes(dd.flare.cls) && /30 s/.test(l.text)), 'el aviso dice la clase real y los 30 s');
    assert.equal(s.dFlare.done, true); aMin(s, dd.flareMin + 1); corre(s, 0.2); assert.equal(s.hazards.filter((x) => x.kind === 'llamarada').length, 1, 'llega una sola vez');
  }
  assert.ok(flareHit('X9.0', 'estacion') < flareHit('X9.0', 'marte') && flareHit('X9.0', 'marte') < flareHit('X9.0', 'luna'), 'en la Luna pega más que en la órbita');
});

test('reto del día: en el refugio no pierdes salud; afuera sí, y el resumen lo cuenta', () => {
  const a = reto(); aMin(a.s, a.d.flareMin); corre(a.s, 0.2); alRefugio(a.s); const solved = a.s.stats.solved; corre(a.s, 31);
  assert.equal(a.s.dFlare.result, 'refugio'); assert.equal(a.s.p.salud, 100); assert.equal(a.s.stats.solved, solved + 1); assert.equal(a.s.hazards.filter((x) => x.kind === 'llamarada').length, 0);
  const b = reto(); aMin(b.s, b.d.flareMin); corre(b.s, 0.2); const fuera = b.s.L.rooms.find((x) => x.id !== SHELTER[b.s.loc].room && !x.restricted && !x.outside && x.id !== 'esclusa'); Object.assign(b.s.p, { x: fuera.x + fuera.w / 2, y: fuera.y + fuera.h / 2 }); assert.notEqual(G.playerRoom(b.s), SHELTER[b.s.loc].room); const hit = b.s.hazards.find((x) => x.kind === 'llamarada').def.dmg;
  const antes = b.s.p.salud; for (let t = 0; t < 40 && !b.s.dFlare.result; t += 0.05) G.update(b.s, 0.05, { dx: 0, dy: 0 }); // se mide en el instante del impacto: después la salud se recupera sola
  assert.equal(b.s.dFlare.result, 'impacto'); assert.ok(Math.abs(antes - b.s.p.salud - flareHit(b.s.dFlare.flare.cls, b.s.loc)) <= 1, `perdió ${antes - b.s.p.salud} de salud (debía ser ${flareHit(b.s.dFlare.flare.cls, b.s.loc)})`);
  b.s.over = { won: true, title: 'x', text: 'y', stars: 1 }; a.s.over = { won: true, title: 'x', text: 'y', stars: 1 };
  assert.ok(UI.resumenFin(a.s).datos.some((x) => /te refugiaste/.test(x.txt))); assert.ok(UI.resumenFin(b.s).datos.some((x) => /te alcanzó afuera/.test(x.txt)));
  setLang('en'); try { assert.ok(UI.resumenFin(a.s).datos.some((x) => /you sheltered/.test(x.txt))); } finally { setLang('es'); }
});

test('reto del día: el mismo reto da la misma llamarada y el mismo resultado (determinista)', () => {
  const jugar = () => { const { s, d } = reto(); aMin(s, d.flareMin); corre(s, 0.2); alRefugio(s); corre(s, 31); return JSON.stringify([s.dFlare, s.p.salud, s.stats.solved, s.hazards.length]); };
  assert.equal(jugar(), jugar());
});

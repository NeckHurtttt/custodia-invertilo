import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as G from '../src/core.js';
import * as Sys from '../src/sistemas.js';
import { informe, estadoNivel, MAX_CAUSAS } from '../src/informe.js';
import { setLang } from '../src/i18n.js';

/** Avanza el reloj hasta el día pedido sin dejar que el jugador muera (solo interesa la bitácora). */
const hasta = (s, day, min = 5) => { let n = 0; while (!s.over && (s.day < day || s.min < min) && n++ < 400000) { s.p.salud = 100; s.p.energia = 100; s.alert = 0; s.grace = 9999; s.integ = Math.max(s.integ, 40); G.update(s, 0.5); } }; // ni el jugador ni la base se pierden

test('bitácora: anota un renglón por día cerrado y el día en curso, con niveles, dosis y revisiones', () => {
  const s = G.newGame('estacion', 11, 'cadete'); s.hazards = []; s.events = [];
  assert.equal(Sys.historial(s).length, 1, 'al empezar solo está el día 1 en curso');
  hasta(s, 3);
  const h = Sys.historial(s);
  assert.deepEqual(h.map((d) => d.day), [1, 2, 3]);
  assert.deepEqual(h[0].skip.sort(), [...Sys.SYS_IDS].sort(), 'nadie hizo el mantenimiento del día 1: las 4 quedaron omitidas');
  assert.ok(h[0].lvl.vida < Sys.START_LVL && h[0].dose > 0);
  assert.ok(h[1].dose > h[0].dose, 'la dosis solo sube');
  const inf = informe(s);
  assert.equal(inf.dias[0].hechas, 0); assert.equal(inf.perfectos, 1, 'solo el día en curso (aún sin turno) no tiene omisiones');
  assert.ok(inf.causas.some((c) => c.tipo === 'omitido' && /Día 1/.test(c.txt)), 'explica la omisión del día 1');
});

test('bitácora: la tormenta queda como refugio o afuera, con la dosis que costó, y es la causa más grave', () => {
  const s = G.newGame('estacion', 11, 'cadete'); s.hazards = []; s.events = [];
  hasta(s, 2, 14 * 60 + 30);
  Sys.startStorm(s); const sh = Sys.shelterOf(s).room; const r = s.L.rooms.find((x) => x.id === sh);
  // se queda afuera: lejos del refugio
  const otra = s.L.rooms.find((x) => x.id !== sh && !x.restricted); Object.assign(s.p, { x: otra.x + otra.w / 2, y: otra.y + otra.h / 2, inDuct: false });
  for (let i = 0; i < 2000 && s.sys.storm; i++) { s.p.salud = 100; s.grace = 9999; G.update(s, 0.1); }
  assert.equal(s.sys.storm, null, 'la tormenta terminó');
  const dia = Sys.historial(s).find((d) => d.storm);
  assert.ok(dia && dia.storm.ref === false && dia.storm.got > dia.storm.could, 'afuera se recibe más que en el refugio');
  const inf = informe(s);
  assert.equal(inf.dias.find((d) => d.day === dia.day).storm, 'afuera');
  const c = inf.causas.find((x) => x.tipo === 'afuera'); assert.ok(c && c.txt.includes('no se borran') && c.txt.includes(String(dia.storm.got)));
  assert.ok(r, 'el refugio existe en el mapa');
});

test('bitácora: nunca más de 4 causas, en orden de día, y sale en inglés', () => {
  const s = G.newGame('luna', 5, 'cadete'); s.hazards = []; s.events = [];
  hasta(s, 8);
  const inf = informe(s);
  assert.ok(inf.causas.length <= MAX_CAUSAS && inf.causas.length >= 1);
  assert.deepEqual(inf.causas.map((c) => c.day), [...inf.causas.map((c) => c.day)].sort((a, b) => a - b));
  assert.equal(inf.dias.length, 8);
  setLang('en'); try { const en = informe(s); assert.ok(en.causas.every((c) => /^Day \d+/.test(c.txt) && !/[áéíóúñ¡¿]/i.test(c.txt)), en.causas.map((c) => c.txt).join(' / ')); } finally { setLang('es'); }
});

test('bitácora: sin sistemas (UNA NOCHE) no hay informe; los colores salen del nivel', () => {
  assert.equal(informe(G.newGame('estacion', 3, 'normal', { mode: 'noche' })), null);
  assert.deepEqual([90, 59, 29].map(estadoNivel), ['ok', 'warn', 'bad']);
});

test('bitácora: una partida guardada sin historial no rompe nada', () => {
  const s = G.newGame('estacion', 11, 'cadete'); delete s.sys.hist; delete s.sys.hoy; s.day = 4;
  const h = Sys.historial(s); assert.equal(h.length, 1); assert.equal(h[0].day, 4);
  hasta(s, 5); assert.equal(Sys.historial(s).length, 2);
});

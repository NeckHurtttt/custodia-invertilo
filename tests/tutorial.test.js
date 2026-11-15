import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as G from '../src/core.js';
import * as Sys from '../src/sistemas.js';
import * as Tu from '../src/tutorial.js';
import { setLang } from '../src/i18n.js';

const juego = () => { const s = G.newGame('estacion', 5, 'cadete'); s.hazards = []; s.events = []; s.drones = []; s.grace = 9999; s.p.sleep = false; return s; };

test('tutorial: solo aplica en la campaña con sistemas, el día 1 y antes del turno; no en reto, noche ni día 2', () => {
  assert.equal(Tu.aplica(juego()), true);
  assert.equal(Tu.aplica(G.newGame('estacion', 5, 'normal', { mode: 'noche' })), false);
  const d = juego(); d.daily = true; assert.equal(Tu.aplica(d), false);
  const t = juego(); t.min = 9 * 60; assert.equal(Tu.aplica(t), false); const u = juego(); u.day = 2; assert.equal(Tu.aplica(u), false);
});

test('tutorial: recorre los 9 pasos en orden (moverse, barras, panel, usar, agacharse, esconderse, mapa, tormenta, finales) y adelanta el reloj al turno', () => {
  const s = juego(); const tu = Tu.nuevo(s); const est = Sys.station(s, 'vida');
  assert.equal(Tu.actual(tu), 'mover'); let r = Tu.tick(tu, s, 0.1, { estacion: est }); assert.equal(r.cambio, false, 'sin moverse no avanza');
  s.p.x += 3.2; r = Tu.tick(tu, s, 0.1, { estacion: est }); assert.equal(Tu.actual(tu), 'barras'); assert.equal(r.cambio, true);
  assert.equal(Tu.pideOk(tu), true); Tu.tick(tu, s, 5, { estacion: est }); assert.equal(Tu.actual(tu), 'barras', 'espera a ENTENDIDO');
  Tu.entendido(tu); r = Tu.tick(tu, s, 0.1, { estacion: est }); assert.equal(Tu.actual(tu), 'panel'); assert.equal(r.salta, Tu.HORA_TURNO, 'adelanta el reloj para llegar al turno');
  assert.deepEqual(Tu.objetivo(tu, est), { x: est.x + 0.5, y: est.y + 0.5 }, 'la flecha señala el panel');
  Tu.tick(tu, s, 0.1, { estacion: est }); assert.equal(Tu.actual(tu), 'panel', 'lejos del panel no avanza');
  Object.assign(s.p, { x: est.x + 0.5, y: est.y + 1.4 }); Tu.tick(tu, s, 0.1, { estacion: est }); assert.equal(Tu.actual(tu), 'usar');
  Tu.tick(tu, s, 1, { estacion: est }); assert.equal(Tu.actual(tu), 'usar'); s.sys.done.vida = true; Tu.tick(tu, s, 0.1, { estacion: est }); assert.equal(Tu.actual(tu), 'agachar');
  Tu.tick(tu, s, 1, { crouch: false }); assert.equal(Tu.actual(tu), 'agachar'); Tu.tick(tu, s, 0.3, { crouch: true }); assert.equal(Tu.actual(tu), 'agachar'); Tu.tick(tu, s, 0.3, { crouch: true }); assert.equal(Tu.actual(tu), 'esconder');
  assert.ok(tu.esc && Tu.objetivo(tu, est), 'la flecha señala el escondite más cercano'); Tu.tick(tu, s, 1); assert.equal(Tu.actual(tu), 'esconder', 'sin esconderse no avanza');
  s.p.hidden = { x: tu.esc.x, y: tu.esc.y, t: tu.esc.t }; Tu.tick(tu, s, 0.1); assert.equal(Tu.actual(tu), 'mapa'); s.p.hidden = null;
  Tu.tick(tu, s, 1, { mapa: false }); assert.equal(Tu.actual(tu), 'mapa', 'sin abrir el mapa no avanza'); Tu.tick(tu, s, 0.1, { mapa: true }); assert.equal(Tu.actual(tu), 'tormenta');
  Tu.entendido(tu); Tu.tick(tu, s, 0.1); assert.equal(Tu.actual(tu), 'finales'); Tu.entendido(tu); r = Tu.tick(tu, s, 0.1); assert.equal(r.fin, true); assert.equal(Tu.actual(tu), null);
  assert.equal(Tu.tick(tu, s, 0.1).fin, true, 'después del final sigue marcando fin');
});

test('tutorial: textos en español e inglés, distintos para compu y celular, y sin acentos en inglés', () => {
  const s = juego(); const tu = Tu.nuevo(s);
  for (let i = 0; i < Tu.PASOS.length; i++) {
    tu.i = i;
    const es = Tu.texto(tu, false, 'Taller'), esT = Tu.texto(tu, true, 'Taller'); setLang('en'); let en, enT; try { en = Tu.texto(tu, false, 'Workshop'); enT = Tu.texto(tu, true, 'Workshop'); } finally { setLang('es'); }
    for (const x of [es, esT, en, enT]) { assert.ok(x.titulo && x.texto && x.n === `${i + 1}/${Tu.PASOS.length}`, Tu.PASOS[i]); }
    assert.notEqual(es.texto, en.texto); assert.ok(!/[áéíóúñ¡¿]/i.test(en.texto + en.titulo), `${Tu.PASOS[i]}: inglés → ${en.texto}`);
    assert.ok(es.texto.length <= 230 && en.texto.length <= 250, `${Tu.PASOS[i]}: texto largo`);
    if (['mover', 'usar', 'agachar', 'esconder', 'mapa'].includes(Tu.PASOS[i])) assert.notEqual(es.texto, esT.texto, `${Tu.PASOS[i]}: compu y celular dicen cosas distintas`);
  }
  assert.match(Tu.texto({ ...tu, i: 0 }, false).texto, /WASD/); assert.match(Tu.texto({ ...tu, i: 0 }, true).texto, /dedo/); assert.match(Tu.texto({ ...tu, i: 4 }, false).texto, /Shift/); assert.match(Tu.texto({ ...tu, i: 4 }, true).texto, /AGACHAR/);
});

test('tutorial: no gasta el azar ni cambia el estado de la partida (solo lee)', () => {
  const s = juego(); const antes = JSON.stringify([s.seed, s.min, s.p.x, s.p.y, s.sys.lvl]); const tu = Tu.nuevo(s); Tu.tick(tu, s, 0.5, {}); Tu.texto(tu, true);
  assert.equal(JSON.stringify([s.seed, s.min, s.p.x, s.p.y, s.sys.lvl]), antes);
});

test('tutorial: no se puede saltar y termina mostrando finales normales y secretos (con pista)', () => {
  assert.ok(Tu.PASOS.includes('esconder') && Tu.PASOS.includes('mapa') && Tu.PASOS.at(-1) === 'finales');
  const F = Tu.FINALES(); assert.ok(F.filter((f) => !f.secreto).length >= 3, 'finales a la vista');
  const sec = F.filter((f) => f.secreto); assert.ok(sec.length >= 3 && sec.every((f) => f.nombre === '???' && f.como.length > 10 && f.revela && f.medalla), 'secretos como ??? con pista');
  const s = juego(); const tu = Tu.nuevo(s); for (let i = 0; i < 50; i++) Tu.tick(tu, s, 1, {}); assert.equal(Tu.actual(tu), 'mover', 'esperar no lo salta');
  const tel = Tu.texto({ ...tu, i: Tu.PASOS.indexOf('agachar') }, true, '', true); assert.match(tel.texto, /USAR/, 'en el teléfono explica la rueda');
});

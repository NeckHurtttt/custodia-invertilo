import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as Meta from '../src/meta.js';
import { PREGUNTAS, opciones, preguntaPara, resumen, textoResultado } from '../src/quiz.js';
import { setLang } from '../src/i18n.js';

const enIngles = (fn) => { setLang('en'); try { return fn(); } finally { setLang('es'); } };
/** localStorage de mentira para probar lo que guarda Meta. */
function conAlmacen(fn) {
  const mem = new Map(); const anterior = globalThis.localStorage;
  globalThis.localStorage = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k) };
  try { return fn(); } finally { if (anterior === undefined) delete globalThis.localStorage; else globalThis.localStorage = anterior; }
}

test('quiz: cada pregunta tiene 3 opciones, una correcta, explicación y fuente, en español e inglés', () => {
  const es = PREGUNTAS(); const en = enIngles(() => PREGUNTAS());
  assert.ok(es.length >= 6); assert.equal(es.length, en.length); assert.equal(es[0].id, 'radiacion-suma', 'la primera es la idea central: la dosis no se borra');
  assert.equal(new Set(es.map((q) => q.id)).size, es.length);
  for (const [i, q] of es.entries()) {
    for (const k of ['q', 'ok', 'expl', 'fuente']) { assert.ok(q[k] && en[i][k], `${q.id}: falta ${k} en los dos idiomas`); }
    assert.equal(q.mal.length, 2); assert.ok(q.mal.every((m) => m && m !== q.ok), `${q.id}: opciones distintas`);
    assert.notEqual(q.q, en[i].q, `${q.id}: sin traducir`); assert.ok(q.q.length < 120 && q.ok.length < 110 && q.mal.every((m) => m.length < 110), `${q.id}: textos cortos para leer rápido`);
    assert.match(q.fuente + en[i].fuente, /NASA|Chang|Curiosity|regla del juego|game rule|distances|Distancias/i, `${q.id}: la fuente debe nombrar de dónde sale`);
  }
});

test('quiz: las opciones se barajan según la semilla (igual semilla, mismo orden) y siempre hay una sola correcta', () => {
  const q = PREGUNTAS()[0]; const a = opciones(q, 123); assert.deepEqual(a, opciones(q, 123));
  assert.equal(a.length, 3); assert.equal(a.filter((o) => o.ok).length, 1); assert.equal(a.find((o) => o.ok).t, q.ok);
  const posiciones = new Set(); for (let s = 0; s < 40; s++) posiciones.add(opciones(q, s).findIndex((o) => o.ok)); assert.equal(posiciones.size, 3, 'la correcta no va siempre en el mismo lugar');
  assert.equal(enIngles(() => opciones(PREGUNTAS()[0], 7).findIndex((o) => o.ok)), opciones(q, 7).findIndex((o) => o.ok), 'el orden no cambia con el idioma');
});

test('quiz: la primera vez toca la idea central; después, las que aún no acertaste; al dominar todas, cualquiera', () => {
  const ids = PREGUNTAS().map((q) => q.id);
  for (const seed of [0, 1, 5, 99]) assert.equal(preguntaPara(seed, {}).id, ids[0]);
  const hist = { [ids[0]]: { ok: 1, mal: 0 } };
  for (const seed of [0, 1, 5, 99]) assert.notEqual(preguntaPara(seed, hist).id, ids[0], 'no repite la que ya acertó mientras queden otras');
  assert.equal(preguntaPara(3, hist).id, preguntaPara(3, hist).id, 'determinista');
  const fallada = { [ids[0]]: { ok: 0, mal: 2 } }; assert.ok(ids.includes(preguntaPara(4, fallada).id));
  const todas = Object.fromEntries(ids.map((id) => [id, { ok: 1, mal: 0 }])); assert.ok(ids.includes(preguntaPara(8, todas).id));
  const vistas = new Set(); for (let s = 0; s < 30; s++) vistas.add(preguntaPara(s, hist).id); assert.ok(vistas.size >= 4, 'con las semillas salen preguntas variadas');
});

test('quiz: Meta guarda aciertos y fallos, y el resumen y el texto para copiar los cuentan', () => conAlmacen(() => {
  assert.deepEqual(Meta.quizHist(), {});
  Meta.quizAnota('radiacion-suma', false); Meta.quizAnota('radiacion-suma', true); Meta.quizAnota('alara', true);
  const h = Meta.quizHist(); assert.deepEqual(h['radiacion-suma'], { ok: 1, mal: 1 }); assert.deepEqual(h.alara, { ok: 1, mal: 0 });
  const r = resumen(h); assert.deepEqual([r.aciertos, r.fallos, r.intentos, r.dominadas], [2, 1, 3, 2]); assert.equal(r.total, PREGUNTAS().length);
  assert.match(textoResultado('alara', true, h), /✔ acertó · aciertos 2 de 3 · preguntas dominadas 2\/7/);
  assert.match(enIngles(() => textoResultado('alara', false, h)), /✘ wrong · correct answers 2 of 3/);
  assert.equal(Meta.load().pts, 0, 'la pregunta no cambia los puntos ni el equilibrio');
}));

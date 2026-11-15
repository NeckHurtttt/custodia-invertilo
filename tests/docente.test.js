import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatoLinea, leeLinea, leeVarias, resumen, aCSV, VERSION, limpiaNombre, limpiaClase } from '../src/docente.js';
import { PREGUNTAS } from '../src/quiz.js';

const base = { clase: '5b', nombre: 'Ana María', fecha: '2026-11-15', destino: 'estacion', nivel: 'cadete', gano: true, estrellas: 3, dosis: 12.4, sistemas: 91.6, quizId: 'radiacion-suma', quizOk: true };

test('docente: la línea de resultado lleva lo justo, queda limpia (sin barras ni etiquetas) y se lee de vuelta igual', () => {
  const l = formatoLinea(base); assert.ok(l.startsWith(VERSION + '|5B|Ana María|2026-11-15|estacion|cadete|1|3|12|92|radiacion-suma|1'), l); assert.ok(!l.includes('\n'));
  assert.deepEqual(leeLinea(l), { clase: '5B', nombre: 'Ana María', fecha: '2026-11-15', destino: 'estacion', nivel: 'cadete', gano: true, estrellas: 3, dosis: 12, sistemas: 92, quizId: 'radiacion-suma', quiz: 1 });
  const sucia = formatoLinea({ ...base, nombre: '<b>Eva|X</b>\n"x"', clase: 'a|b', estrellas: 99, dosis: -5 }); assert.ok(!/[<>"\n]/.test(sucia) && sucia.split('|').length === 12, sucia);
  const p = leeLinea(sucia); assert.equal(p.estrellas, 3); assert.equal(p.dosis, 0); assert.ok(p.nombre.length <= 24);
  assert.equal(leeLinea(formatoLinea({ ...base, quizId: '' })).quiz, null, 'sin pregunta respondida');
  assert.equal(leeLinea(formatoLinea({ ...base, gano: false, estrellas: 0 })).gano, false);
});

test('docente: lo que no es de CUSTODIA, está roto o no trae nombre se ignora sin romper nada', () => {
  for (const x of ['', 'hola', 'CUSTODIA1|5B', 'OTRO|5B|Ana|2026-11-15|a|b|1|1|1|1|x|1', 'CUSTODIA1|5B||2026-11-15|a|b|1|1|1|1|x|1', null, undefined, 42]) assert.equal(leeLinea(x), null, String(x));
  assert.equal(leeLinea('CUSTODIA1|5B|Ana|fecha-rara|a|b|x|x|x|x|x|x').fecha, '', 'una fecha rara se descarta'); assert.equal(limpiaNombre('x'.repeat(99)).length, 24); assert.equal(limpiaClase(' 5b '), '5B');
});

test('docente: pegar muchas líneas cuenta las inválidas y las repetidas, y acepta texto alrededor (WhatsApp, correo)', () => {
  const a = formatoLinea(base), b = formatoLinea({ ...base, nombre: 'Leo', gano: false, estrellas: 0, quizOk: false });
  const texto = `Hola profe, mi resultado:\n${a}\n[10:31] Leo: ${b}\n${a}\nlínea suelta\nCUSTODIA1|roto`;
  const r = leeVarias(texto); assert.equal(r.partidas.length, 2); assert.equal(r.repetidas, 1); assert.equal(r.invalidas, 3);
  assert.deepEqual(leeVarias('').partidas, []); assert.deepEqual(leeVarias(null).partidas, []);
});

test('docente: el resumen da por alumno y por clase las partidas, ganadas, estrellas y aciertos, y señala la idea que más cuesta', () => {
  const L = (o) => leeLinea(formatoLinea({ ...base, ...o }));
  const ps = [L({}), L({ gano: false, estrellas: 0, quizOk: false, quizId: 'alara' }), L({ nombre: 'Leo', estrellas: 2, quizId: 'alara', quizOk: false }), L({ nombre: 'Leo', estrellas: 1, quizId: 'alara', quizOk: true }), L({ clase: '6A', nombre: 'Zoe', quizId: '' })];
  const r = resumen(ps);
  const ana = r.alumnos.find((a) => a.nombre === 'Ana María'), leo = r.alumnos.find((a) => a.nombre === 'Leo'), zoe = r.alumnos.find((a) => a.nombre === 'Zoe');
  assert.deepEqual([ana.partidas, ana.ganadas, ana.estrellasProm, ana.quizTotal, ana.pctQuiz], [2, 1, 3, 2, 50]); assert.deepEqual([leo.partidas, leo.estrellasProm, leo.pctQuiz], [2, 1.5, 50]); assert.equal(zoe.pctQuiz, null, 'sin preguntas: sin porcentaje');
  const c5 = r.clases.find((c) => c.clase === '5B'); assert.deepEqual([c5.alumnos, c5.partidas, c5.ganadas, c5.pctGanadas, c5.pctQuiz], [2, 4, 3, 75, 50]);
  assert.equal(r.masDificil.id, 'alara'); assert.equal(r.masDificil.pct, 33); assert.deepEqual(r.alumnos.map((a) => a.clase), ['5B', '5B', '6A'], 'ordenado por clase y nombre');
  assert.equal(resumen([]).masDificil, null); assert.deepEqual(resumen([]).alumnos, []);
});

test('docente: el CSV se abre en una hoja de cálculo (comillas dobladas) y los ids de pregunta existen en el juego', () => {
  const ps = [leeLinea(formatoLinea({ ...base, nombre: 'Ana "Ani"' }))]; const csv = aCSV(resumen(ps)).split('\n');
  assert.equal(csv.length, 2); assert.ok(csv[1].includes('"Ana ""Ani"""') === false, 'las comillas ya vienen limpias'); assert.match(csv[1], /^"5B","Ana Ani","1","1","3","1","100"$/);
  const ids = PREGUNTAS().map((q) => q.id); for (const id of ['radiacion-suma', 'alara', 'retraso-marte']) assert.ok(ids.includes(id), id);
});

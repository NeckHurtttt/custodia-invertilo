import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as G from '../src/core.js';
import * as Sys from '../src/sistemas.js';
import { LOCS } from '../src/locs.js';
import { PERSONAS, TIPOS, linea, voz, ficha } from '../src/personajes.js';
import { arranqueDebe, arranqueLineas, CONSEJOS, consejo } from '../src/inicio.js';
import { setLang } from '../src/i18n.js';

const enIngles = (fn) => { setLang('en'); try { return fn(); } finally { setLang('es'); } };
const todas = (nombre, tipo, lang) => PERSONAS[nombre][tipo].map(([es, en]) => (lang === 'en' ? en : es));
const PROHIBIDAS = /\b(sangre|matar|muert\w*|morir|asesin\w*|arma|armas|disparo\w*|blood|kill\w*|dead|die|murder\w*|gun|guns|shoot\w*)\b/i;

test('personajes: los 9 compañeros del juego tienen personalidad completa en español e inglés', () => {
  const nombres = Object.values(LOCS).flatMap((L) => L.crew.map((c) => c.name));
  assert.equal(new Set(nombres).size, 9, 'los nombres de la tripulación no se repiten entre destinos');
  for (const n of nombres) {
    const p = PERSONAS[n]; assert.ok(p, `falta la personalidad de ${n}`);
    for (const k of ['rol', 'rasgo', 'frase']) assert.ok(p[k][0] && p[k][1], `${n}: falta ${k} en los dos idiomas`);
    for (const tipo of TIPOS) {
      assert.ok(p[tipo]?.length >= 1, `${n}: sin frases de ${tipo}`);
      for (const [es, en] of p[tipo]) { assert.ok(es && en, `${n}/${tipo}: frase vacía`); assert.ok(es.length <= 75 && en.length <= 75, `${n}/${tipo}: demasiado larga para el globo de diálogo`); assert.ok(!PROHIBIDAS.test(es + ' ' + en), `${n}/${tipo}: lenguaje no apto: ${es}`); }
    }
    assert.ok(p.idle.length >= 4, `${n}: al menos 4 frases de charla`);
  }
  assert.equal(new Set(nombres.map((n) => PERSONAS[n].frase[0])).size, 9, 'cada uno tiene su frase');
});

test('personajes: la frase es determinista, cambia con la hora y NO toca el estado ni el azar de la partida', () => {
  const s = G.newGame('estacion', 11); const c = s.crew[0]; const antes = JSON.stringify(s);
  const a = voz(s, c, 'idle'); assert.equal(a, voz(s, c, 'idle')); assert.equal(JSON.stringify(s), antes, 'voz() no cambia la partida');
  const vistas = new Set(); for (let m = 0; m < 400; m += 7) vistas.add(linea(c.name, 'idle', `x|1|${m / 7}`)); assert.ok(vistas.size >= 3, 'con el tiempo dice cosas distintas');
  assert.equal(linea('Nadie', 'idle'), null); assert.equal(linea(c.name, 'inexistente'), null);
  assert.ok(todas(c.name, 'idle', 'es').includes(a));
  assert.ok(enIngles(() => todas(c.name, 'idle', 'en').includes(voz(s, c, 'idle'))), 'en inglés dice la versión en inglés');
  assert.deepEqual(enIngles(() => ficha('Kenji')), { rol: 'Engineer', rasgo: 'Joker and curious', frase: 'If it does not work, it needs more duct tape.' });
  assert.equal(ficha('Kenji').rol, 'Ingeniero'); assert.equal(ficha('Nadie'), null);
});

test('personajes: en la partida cada uno habla a su manera y reacciona a la tormenta, al alivio y al rescate', () => {
  for (const loc of ['estacion', 'luna', 'marte']) {
    const s = G.newGame(loc, 3, 'cadete'); s.grace = 9999; s.hazards.length = 0; s.events.length = 0;
    const dicho = new Map(s.crew.map((c) => [c.name, new Set()]));
    for (let t = 0; t < 120; t += 0.5) { G.update(s, 0.5, { dx: 0, dy: 0 }); for (const c of s.crew) if (c.say) dicho.get(c.name).add(c.say); }
    for (const c of s.crew) { const mias = new Set(TIPOS.flatMap((tp) => todas(c.name, tp, 'es'))); const propias = [...dicho.get(c.name)].filter((x) => mias.has(x)); assert.ok(propias.length >= 1, `${loc}/${c.name}: debió decir alguna de sus frases (dijo: ${[...dicho.get(c.name)].join(' | ')})`); }
  }
  const s = G.newGame('estacion', 4); Sys.startStorm(s);
  for (const c of s.crew) assert.ok(todas(c.name, 'tormenta', 'es').includes(c.say), `${c.name} reacciona a la tormenta`);
  s.sys.storm.t = 0; s.sys.storm.phase = 'barre'; s.sys.storm.t = 0.01; Sys.update(s, 0.05, 1);
  for (const c of s.crew) assert.ok(todas(c.name, 'alivio', 'es').includes(c.say), `${c.name} se alivia al pasar la tormenta`);
  const r = G.newGame('luna', 5); G.rescue(r); for (const c of r.crew) assert.ok(todas(c.name, 'rescate', 'es').includes(c.say), `${c.name} celebra el rescate`);
  const t = G.newGame('marte', 6); t.crew[0].betrayed = true; Sys.startStorm(t); assert.ok(!todas(t.crew[0].name, 'tormenta', 'es').includes(t.crew[0].say), 'el que te delató no te habla');
});

test('inicio: el arranque sale una vez por sesión, no en pruebas ni con ?jurado, y ?boot lo fuerza', () => {
  assert.equal(arranqueDebe({}), true); assert.equal(arranqueDebe({ visto: true }), false); assert.equal(arranqueDebe({ automatizado: true }), false);
  assert.equal(arranqueDebe({ search: '?jurado' }), false); assert.equal(arranqueDebe({ search: '?noboot' }), false);
  assert.equal(arranqueDebe({ search: '?boot', visto: true, automatizado: true }), true); assert.equal(arranqueDebe({ search: '?cadete' }), true);
});

test('inicio: las líneas del arranque cuentan la historia en los dos idiomas (con una señal perdida y la voz de la IA)', () => {
  const es = arranqueLineas(); const en = enIngles(() => arranqueLineas());
  assert.equal(es.length, en.length); assert.ok(es.some((l) => l.g && l.c === 'bad' && /SEÑAL PERDIDA/.test(l.t))); assert.ok(en.some((l) => /SIGNAL LOST/.test(l.t)));
  assert.ok(es.filter((l) => l.c === 'ia').length >= 2); assert.equal(es.filter((l) => l.g).length, 1, 'una sola sacudida: nada de parpadeos repetidos');
  assert.equal(es.at(-1).c, 'big'); assert.match(es.at(-1).t, /MANTÉN VIVA LA BASE/); assert.match(en.at(-1).t, /KEEP THE BASE ALIVE/);
  assert.ok(es.every((l) => l.t.length < 80));
});

test('inicio: los consejos «¿Sabías que…?» son datos reales con su fuente, en español e inglés', () => {
  const es = CONSEJOS(); const en = enIngles(() => CONSEJOS()); assert.equal(es.length, en.length); assert.ok(es.length >= 10);
  for (const [i, c] of es.entries()) { assert.match(c, /\(.+\)\s*$|\.$/, `consejo ${i} sin fuente`); assert.notEqual(c, en[i]); assert.ok(c.length < 190, `consejo ${i} muy largo`); }
  assert.ok(es.filter((c) => /NTRS|NASA|Curiosity|Chang|GeoHealth/.test(c)).length >= 9, 'casi todos citan una fuente');
  assert.equal(consejo(0), es[0]); assert.equal(consejo(es.length), es[0], 'da la vuelta'); assert.equal(consejo(-1), es.at(-1));
});

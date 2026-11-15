import { test } from 'node:test';
import assert from 'node:assert/strict';
import { limpiaTexto, partir, elegirVoz, idiomaVoz, hablar, parar, disponible, estaHablando, alCambiar } from '../src/voz.js';
import { setLang } from '../src/i18n.js';

const enIngles = (fn) => { setLang('en'); try { return fn(); } finally { setLang('es'); } };
/** Síntesis de voz de mentira: guarda lo que se le pide y deja terminar cada frase a mano. */
function conVozFalsa(fn, { voces = [] } = {}) {
  const dicho = []; const ant = { s: globalThis.speechSynthesis, u: globalThis.SpeechSynthesisUtterance };
  globalThis.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
  globalThis.speechSynthesis = { speak(u) { dicho.push(u); this.ultima = u; }, cancel() { this.cancelada = (this.cancelada ?? 0) + 1; this.ultima = null; }, getVoices: () => voces };
  try { return fn(dicho); } finally { parar(false); if (ant.s === undefined) delete globalThis.speechSynthesis; else globalThis.speechSynthesis = ant.s; if (ant.u === undefined) delete globalThis.SpeechSynthesisUtterance; else globalThis.SpeechSynthesisUtterance = ant.u; }
}

test('voz: el texto se limpia (sin etiquetas, emojis ni símbolos) y las unidades se dicen con palabras', () => {
  assert.equal(limpiaTexto('<p>Dosis <b>0,5 mSv</b> · 40% → Refugio ☀️ CO₂</p>'), 'Dosis 0,5 milisieverts, 40 por ciento a Refugio C O 2');
  assert.equal(enIngles(() => limpiaTexto('<p>Dose <b>0.5 mSv</b> · 40% → Shelter</p>')), 'Dose 0.5 millisieverts, 40 percent to Shelter');
  assert.equal(limpiaTexto('<style>.x{}</style><script>alert(1)</script>Hola&nbsp;&amp;&nbsp;chao'), 'Hola & chao');
  assert.equal(limpiaTexto('★★☆ ✔ ¡Correcto! ■ ♥♡'), '¡Correcto!'); assert.equal(limpiaTexto(null), ''); assert.equal(limpiaTexto('   '), '');
});

test('voz: los textos largos se parten en frases cortas sin perder nada (Chrome corta las voces largas)', () => {
  const largo = 'Primera frase corta. Segunda frase, un poco más larga, con comas para partir. ¿Una pregunta? Y una exclamación final! ' + 'palabra '.repeat(60) + 'fin.';
  const t = partir(largo, 80); assert.ok(t.length >= 4); assert.ok(t.every((x) => x.length <= 80), t.map((x) => x.length).join(','));
  assert.equal(t.join(' ').replace(/\s+/g, ' '), largo.replace(/\s+/g, ' ').trim(), 'al unir los trozos queda el mismo texto');
  assert.deepEqual(partir('Hola.'), ['Hola.']); assert.deepEqual(partir(''), []);
});

test('voz: elige la mejor voz del idioma (exacta y local primero; sin conexión, solo locales)', () => {
  const v = [{ name: 'a', lang: 'en-US', localService: true }, { name: 'b', lang: 'es-MX', localService: false }, { name: 'c', lang: 'es-ES', localService: false }, { name: 'd', lang: 'es-MX', localService: true }];
  assert.equal(elegirVoz(v, 'es').name, 'c', 'es-ES exacto gana'); assert.equal(elegirVoz(v, 'en').name, 'a');
  assert.equal(elegirVoz(v, 'es', true).name, 'd', 'sin conexión solo voces locales'); assert.equal(elegirVoz([{ lang: 'fr-FR' }], 'es'), null); assert.equal(elegirVoz([], 'es'), null);
  assert.equal(idiomaVoz('es'), 'es-ES'); assert.equal(idiomaVoz('en'), 'en-US'); assert.equal(enIngles(() => idiomaVoz()), 'en-US');
});

test('voz: sin síntesis de voz no hace nada ni falla', () => {
  assert.equal(disponible(), false); assert.equal(hablar('hola'), false); assert.doesNotThrow(() => parar());
});

test('voz: lee por trozos en orden, con el idioma y la voz del juego, y se puede parar', () => conVozFalsa((dicho) => {
  assert.equal(disponible(), true); const marcas = []; alCambiar((h) => marcas.push(h));
  assert.equal(hablar('<p>Primera frase. Segunda frase. Tercera frase.</p>', { html: true }), true);
  assert.equal(estaHablando(), true); assert.equal(dicho.length, 1); assert.equal(dicho[0].lang, 'es-ES'); assert.ok(dicho[0].rate > 0.8 && dicho[0].rate <= 1);
  assert.match(dicho[0].text, /^Primera frase\. Segunda frase\. Tercera frase\./); globalThis.speechSynthesis.ultima.onend();
  assert.equal(estaHablando(), false, 'al terminar el único trozo deja de hablar'); assert.deepEqual(marcas, [true, false], 'avisa al empezar y al terminar (para marcar el botón LEER/PARAR)');
  hablar('Una. Dos. Tres. ' + 'x'.repeat(200) + '.'); assert.ok(estaHablando()); parar(); assert.equal(estaHablando(), false); assert.ok(globalThis.speechSynthesis.cancelada >= 1);
  assert.equal(enIngles(() => { hablar('Hello there.'); return dicho.at(-1).lang; }), 'en-US');
}, { voces: [{ lang: 'es-ES', localService: true, name: 'Voz' }, { lang: 'en-US', localService: true, name: 'Voice' }] }));

test('voz: una alerta importante interrumpe; una de baja prioridad no corta lo que se está leyendo', () => conVozFalsa((dicho) => {
  hablar('Texto largo de una ventana. Otra frase.'); const antes = dicho.length;
  assert.equal(hablar('Aviso menor', { prio: 'baja' }), false); assert.equal(dicho.length, antes, 'no interrumpe');
  assert.equal(hablar('¡Alerta!', { prio: 'alta' }), true); assert.equal(dicho.at(-1).text, '¡Alerta!');
}));

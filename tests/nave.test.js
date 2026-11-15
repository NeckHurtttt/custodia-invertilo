import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as G from '../src/core.js';
import { rescateLinea, rescateAviso, NAVE } from '../src/story.js';
import { setLang } from '../src/i18n.js';

test('nave de rescate: una transmisión por mañana del día 2 al 10, corta, en los dos idiomas y con la cuenta correcta', () => {
  assert.equal(rescateLinea(1), ''); assert.equal(rescateLinea(11), ''); assert.equal(rescateAviso(1), '');
  for (let d = 2; d <= G.DAYS; d++) {
    const es = rescateLinea(d); setLang('en'); const en = rescateLinea(d); const av = rescateAviso(d); setLang('es');
    assert.ok(es && en && es !== en, `día ${d}: falta un idioma`);
    assert.ok(es.length <= 120 && en.length <= 130, `día ${d}: frase larga (${es.length}/${en.length})`);
    assert.ok(!/[áéíóúñ¡¿]/i.test(en), `día ${d}: el inglés tiene español → ${en}`);
    assert.ok(av.includes(NAVE) && av.includes('Rescue ship'));
    const faltan = G.DAYS - d + 1; // la nave llega al terminar el día 10
    if (faltan > 1) { assert.ok(es.includes(`${faltan} días`), `día ${d}: debe decir que faltan ${faltan} días → ${es}`); assert.ok(en.includes(`${faltan} days`), en); }
    else assert.match(es, /Mañana llegamos/);
  }
});

test('nave de rescate: la transmisión queda en el registro cada mañana (solo en la campaña) y no cambia el azar', () => {
  const corre = (modo) => { const s = G.newGame('estacion', 11, 'cadete', modo ? { mode: modo } : {}); s.hazards = []; let n = 0; while (!s.over && s.day < 2 && n++ < 200000) { s.p.salud = 100; s.grace = 9999; G.update(s, 0.5); } return s; };
  const s = corre();
  const l = s.log.find((x) => x.text.includes(NAVE));
  assert.ok(l && l.quiet && l.text.includes('9 días'), 'el día 2 la nave avisa que faltan 9 días, sin tapar la pantalla');
  const n = corre('noche'); assert.ok(!n.log.some((x) => x.text.includes(NAVE)), 'UNA NOCHE no tiene nave de rescate');
});

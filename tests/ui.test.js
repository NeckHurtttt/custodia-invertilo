import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ICONOS, ic, nivel, MARCA, UMBRALES, descripcion, seguir, DANIO, textoDanio, pulso, alterna, esAngosta, geomMinimapa, geomMapa, resumenFin } from '../src/ui.js';
import { LOCS } from '../src/locs.js';
import * as G from '../src/core.js';

const leer = (f) => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');

test('íconos: cada nombre de ICONOS existe como <symbol> en index.html, y cada ic(\'x\') del código apunta a uno que existe', () => {
  const html = leer('index.html');
  for (const n of ICONOS) assert.ok(html.includes(`id="i-${n}"`), `falta el símbolo i-${n} en index.html`);
  for (const f of ['src/main.js', 'src/ui.js']) for (const m of leer(f).matchAll(/\bic\('([a-z0-9]+)'/g)) assert.ok(ICONOS.includes(m[1]), `${f}: ic('${m[1]}') no está en ICONOS`);
  for (const id of Object.keys(LOCS)) { assert.ok(html.includes(`id="a-${id}"`), `falta la ilustración a-${id}`); assert.ok(ICONOS.includes(id), `falta el ícono de ${id}`); }
  assert.match(ic('salud', 'g'), /<use href="#i-salud"\/>/);
});

test('estado de las barras: verde / ámbar / rojo según el umbral, y la marca de texto acompaña al color', () => {
  assert.deepEqual([100, 60, 49, 25, 24, 0].map((v) => nivel('salud', v)), ['ok', 'ok', 'warn', 'warn', 'bad', 'bad']);
  assert.deepEqual([0, 39, 40, 69, 70, 100].map((v) => nivel('alerta', v)), ['ok', 'ok', 'warn', 'warn', 'bad', 'bad'], 'en la alerta, más alto es peor');
  assert.equal(nivel('rad', 74), 'warn'); assert.equal(nivel('rad', 75), 'bad');
  assert.equal(nivel('vida', 29), 'bad', 'coincide con el low (<30) de sistemas.js'); assert.equal(nivel('vida', 30), 'warn');
  assert.equal(nivel('fuerza', 0), 'ok', 'fuerza y saber son informativas'); assert.equal(nivel('inventado', 0), 'ok'); assert.equal(nivel('salud', NaN), 'ok');
  assert.deepEqual(MARCA, { ok: '', warn: '!', bad: '!!' });
  assert.equal(descripcion('Salud', 23.7, 'warn'), 'Salud 23: bajo'); assert.equal(descripcion('Alerta', 80, 'bad', true), 'Alerta 80: peligro'); assert.equal(descripcion('Salud', 90, 'ok'), 'Salud 90');
  for (const [id, u] of Object.entries(UMBRALES)) if (u.malo != null) assert.ok(u.mejor === 'alto' ? u.malo < u.medio : u.malo > u.medio, `${id}: los umbrales deben ser coherentes`);
});

test('aviso de daño: una caída brusca avisa una vez; el desgaste lento, subir o el enfriamiento no', () => {
  let r = seguir(null, 100, 0); assert.equal(r.caida, 0);
  r = seguir(r.est, 88, 100); assert.equal(r.caida, 12, 'un golpe de 12 avisa'); let est = r.est;
  r = seguir(est, 80, 400); assert.equal(r.caida, 0, 'otro golpe a los 300 ms: aún enfriándose'); est = r.est;
  r = seguir(est, 70, 1200); assert.ok(r.caida > 0, 'pasado el enfriamiento vuelve a avisar'); est = r.est;
  r = seguir(est, 75, 1300); assert.equal(r.caida, 0, 'subir nunca avisa');
  // desgaste lento: 0,5 puntos por segundo durante 10 s no debe avisar jamás
  let e = null; let v = 100; let avisos = 0; for (let t = 0; t < 10000; t += 200) { v -= 0.1; const x = seguir(e, v, t); e = x.est; if (x.caida > 0) avisos++; }
  assert.equal(avisos, 0, 'el desgaste lento no hace destellar la barra');
  // daño continuo rápido (soporte vital en 0): avisa, pero como mucho ~1 vez por segundo
  e = null; v = 100; avisos = 0; for (let t = 0; t < 10000; t += 120) { v -= 1.5; const x = seguir(e, v, t); e = x.est; if (x.caida > 0) avisos++; }
  assert.ok(avisos > 0 && avisos <= 10000 / DANIO.enfria, `con daño continuo avisa ${avisos} veces: bien por debajo de 3 por segundo`);
  assert.equal(seguir(null, 5, 0, 8).caida, 0); const bajo = seguir(seguir(null, 50, 0).est, 46, 50, 8); assert.equal(bajo.caida, 0, 'umbral propio: 4 puntos no bastan si pide 8');
  assert.equal(textoDanio(7.2), '−7'); assert.equal(textoDanio(8, true), '+8'); assert.equal(textoDanio(0.1), '−1');
});

test('pulso lento: suave y nunca más de ~1,5 ciclos por segundo (sin parpadeo rápido)', () => {
  for (let t = 0; t < 5000; t += 37) { const p = pulso(t); assert.ok(p >= 0 && p <= 1); }
  let cambios = 0, prev = alterna(0); for (let t = 1; t <= 10000; t++) { const a = alterna(t, 5); if (a !== prev) cambios++; prev = a; }
  assert.ok(cambios / 10 <= 3, `alterna() nunca pasa de 3 cambios por segundo, aunque se pida mucho (${cambios / 10}/s)`);
  let c2 = 0, p2 = pulso(0) > 0.5; for (let t = 1; t <= 10000; t++) { const a = pulso(t) > 0.5; if (a !== p2) c2++; p2 = a; }
  assert.ok(c2 / 10 <= 2, `pulso() a 0,8 Hz cruza la mitad ${c2 / 10} veces por segundo`);
});

test('regla de parpadeo en el código: ningún texto ni indicador alterna más rápido que cada 400 ms, y las animaciones infinitas de CSS duran ≥ 1 s', () => {
  const js = leer('src/main.js');
  for (const m of js.matchAll(/Math\.floor\((?:t|performance\.now\(\)) \/ (\d+)\) % 2/g)) assert.ok(+m[1] >= 400, `alternancia demasiado rápida en main.js: ${m[0]}`);
  const css = leer('style.css');
  for (const m of css.matchAll(/animation:\s*[\w-]+\s+([\d.]+)(m?s)[^;}]*infinite/g)) assert.ok((m[2] === 's' ? +m[1] : +m[1] / 1000) >= 1, `animación infinita demasiado rápida: ${m[0]}`);
  assert.ok(!/steps\(2\)/.test(css), 'sin parpadeos por pasos en el CSS');
});

test('modo suave en CSS: sin animaciones ni transiciones de las barras', () => {
  const css = leer('style.css');
  assert.match(css, /\.suave \*[^{]*\{\s*animation:\s*none\s*!important/);
  assert.match(css, /prefers-reduced-motion/);
});

test('pantalla angosta: cambia la forma del HUD y el minimapa se hace chico', () => {
  assert.ok(esAngosta(375)); assert.ok(esAngosta(600)); assert.ok(!esAngosta(601)); assert.ok(!esAngosta(1280));
  const a = geomMinimapa(375, 2, 44, 35), b = geomMinimapa(1280, 3, 44, 35);
  assert.equal(a.k, 1.5); assert.equal(a.w, 66); assert.equal(geomMinimapa(844, 2, 44, 35, 390).k, 1.5, 'teléfono acostado: minimapa chico'); assert.equal(b.k, 4); assert.equal(b.h, 140);
  const m = geomMapa(1280, 720, 44, 35); assert.ok(m.w <= 1280 && m.oy + m.h <= 720 && m.k > b.k, 'el mapa completo cabe y es más grande que el minimapa');
});

test('resumen del final: dice qué pasó, qué aprender y, si ganaste, cómo conseguir las 3 estrellas', () => {
  const s = G.newGame('estacion', 7, 'normal', { reflex: true });
  G.end(s, false, 'Sin aire respirable', 'El depurador de CO₂ dejó de funcionar.');
  let r = resumenFin(s); assert.equal(r.ganaste, false); assert.match(r.aprende, /SOPORTE VITAL/); assert.deepEqual(r.estrellas, []); assert.ok(r.datos.length >= 3);
  for (const t of ['Despresurización', 'Incendio eléctrico', 'Intoxicación por CO₂', 'Dosis aguda de radiación', 'Incendio a bordo']) { const x = G.newGame('estacion', 1, 'normal'); G.end(x, false, t, 'x'); assert.match(resumenFin(x).aprende, /REFLEJOS/, t); }
  for (const t of ['Evacuación médica', 'Base perdida', 'Sin raciones', 'Dosis límite superada', 'Amaneció', 'Sin salida', 'CUSTODIA ganó']) { const x = G.newGame('estacion', 1, 'normal'); G.end(x, false, t, 'x'); assert.ok(resumenFin(x).aprende.length > 30, t); }
  const w = G.newGame('luna', 3, 'normal'); G.end(w, true, 'Base recuperada', 'ok', 2); r = resumenFin(w);
  assert.equal(r.ganaste, true); assert.equal(r.estrellas.length, 3); assert.equal(r.estrellas[0].ok, true); assert.ok(r.aprende.length > 20);
  s.sys.st.skipped = 3; assert.ok(resumenFin(s).pistas.some((p) => /3 revisiones/.test(p)), 'avisa de las revisiones omitidas'); assert.ok(resumenFin(s).pistas.length <= 3);
});

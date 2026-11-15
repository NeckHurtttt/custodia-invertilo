import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, dirname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

// Sin internet: el service worker guarda estos archivos. Si se agrega uno y se olvida en PRECACHE, el juego se rompe sin conexión: aquí se comprueba.
const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (f) => readFileSync(join(raiz, f), 'utf8');
const sw = leer('sw.js');
const precache = [...sw.slice(sw.indexOf('const PRECACHE = ['), sw.indexOf('];', sw.indexOf('const PRECACHE = [')))].join('').match(/'([^']+)'/g).map((x) => x.slice(1, -1)).filter((x) => x !== 'PRECACHE');

/** Todos los módulos que carga src/main.js, de forma recursiva (import ... from './x.js'). */
function cierre(entrada) {
  const vistos = new Set(); const pila = [entrada];
  while (pila.length) {
    const f = pila.pop(); if (vistos.has(f)) continue; vistos.add(f);
    for (const m of leer(f).matchAll(/from\s+'(\.[^']+)'/g)) pila.push(normalize(join(dirname(f), m[1])).replaceAll('\\', '/'));
  }
  return [...vistos];
}
/** Ancho y alto de un PNG (cabecera IHDR). */
const dimPng = (f) => { const b = readFileSync(join(raiz, f)); assert.equal(b.toString('latin1', 1, 4), 'PNG', `${f} no es un PNG`); return [b.readUInt32BE(16), b.readUInt32BE(20)]; };

test('sin internet: PRECACHE tiene la página, los estilos, la fuente, los íconos y TODOS los módulos de src/', () => {
  for (const f of ['index.html', 'style.css', 'manifest.webmanifest', 'fonts/VT323-Regular.ttf', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png']) assert.ok(precache.includes(f), `falta ${f} en PRECACHE`);
  assert.ok(precache.includes('./'), 'falta la página principal ("./")');
  for (const f of readdirSync(join(raiz, 'src')).filter((x) => x.endsWith('.js'))) assert.ok(precache.includes(`src/${f}`), `falta src/${f} en PRECACHE: sin internet el juego no cargaría`);
  for (const f of cierre('src/main.js')) assert.ok(precache.includes(f), `main.js carga ${f} pero no está en PRECACHE`);
  for (const f of precache.filter((x) => x !== './')) assert.ok(existsSync(join(raiz, f)), `PRECACHE lista ${f}, que no existe`);
  assert.equal(new Set(precache).size, precache.length, 'sin repetidos');
});

test('sin internet: el service worker solo toca archivos de la propia página y deja pasar NASA y el cooperativo', () => {
  assert.match(sw, /const VERSION = 'custodia-v\d+'/); assert.match(sw, /u\.origin !== self\.location\.origin/); assert.match(sw, /pathname\.split\('\/'\)\.includes\('coop'\)/, 'deja pasar la ruta /coop/ del servidor, pero NO el archivo src/coop.js'); assert.match(sw, /r\.method !== 'GET'/);
  assert.match(sw, /skipWaiting/); assert.match(sw, /clients\.claim/); assert.match(sw, /caches\.delete/, 'borra las versiones viejas');
  assert.match(sw, /4000/, 'si la red tarda más de 4 s usa lo guardado');
});

test('sin internet: el manifiesto es válido y sus íconos existen con el tamaño que dicen', () => {
  const m = JSON.parse(leer('manifest.webmanifest'));
  assert.ok(m.name && m.short_name && m.start_url === './' && m.display === 'standalone' && m.theme_color && m.background_color);
  const tam = new Set(); for (const i of m.icons) { const [w, h] = i.sizes.split('x').map(Number); assert.deepEqual(dimPng(i.src), [w, h], `${i.src} no mide ${i.sizes}`); tam.add(i.sizes); assert.ok(precache.includes(i.src), `${i.src} debe estar en PRECACHE`); }
  assert.ok(tam.has('192x192') && tam.has('512x512')); assert.ok(m.icons.some((i) => i.purpose === 'maskable'));
  const html = leer('index.html'); assert.match(html, /<link rel="manifest" href="manifest\.webmanifest">/); assert.match(html, /<meta name="theme-color"/); assert.match(html, /apple-touch-icon/);
});

test('sin internet: main.js registra el service worker (no en localhost ni en pruebas salvo ?sw) y avisa "listo sin internet"', () => {
  const js = leer('src/main.js');
  assert.match(js, /serviceWorker\.register\('sw\.js'\)/); assert.match(js, /navigator\.webdriver\) && !new URLSearchParams\(location\.search\)\.has\('sw'\)/);
  assert.match(js, /Listo para jugar sin internet/); assert.match(js, /Ready to play offline/); assert.match(js, /beforeinstallprompt/);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dibujaCertificado, limpiaNombre, nombreArchivo, logro, ANCHO, ALTO } from '../src/certificado.js';
import { setLang } from '../src/i18n.js';

const falso = () => { const r = { rects: [], textos: [], strokes: 0 }; return { r, fillStyle: '', strokeStyle: '', lineWidth: 1, font: '', textAlign: 'left', fillRect(x, y, w, h) { r.rects.push({ x, y, w, h }); }, strokeRect() { r.strokes++; }, fillText(t, x, y) { r.textos.push({ t, x, y, font: this.font }); } }; };
const datos = { nombre: 'Leo', destino: 'Estación', estrellas: 3, dias: 10, sistemas: 91.4, dosis: 12.6, fecha: '15/11/2026', nivel: 'CADETE' };

test('certificado: el nombre se limpia (sin etiquetas ni saltos, máximo 24 letras) y el archivo tiene un nombre seguro', () => {
  assert.equal(limpiaNombre('  Ana   María  '), 'Ana María'); assert.equal(limpiaNombre('<b>x</b>\n'), 'bx/b'); assert.equal(limpiaNombre('a'.repeat(40)).length, 24); assert.equal(limpiaNombre(null), '');
  assert.equal(nombreArchivo({ nombre: 'José Ñandú' }), 'certificado-custodia-jose-nandu.png'); assert.equal(nombreArchivo({ nombre: '' }), 'certificado-custodia-cadete.png'); assert.match(nombreArchivo({ nombre: '../../x' }), /^certificado-custodia-x\.png$/);
});

test('certificado: dibuja el nombre, el destino, las estrellas y los datos de la misión dentro del lienzo, en español e inglés', () => {
  for (const lang of ['es', 'en']) {
    setLang(lang); try {
      const c = falso(); dibujaCertificado(c, datos); const todo = c.r.textos.map((x) => x.t).join(' | ');
      assert.ok(todo.includes('Leo') && todo.includes('Estación') && todo.includes('★★★') && todo.includes('91 %') && todo.includes('13 %') && todo.includes('15/11/2026'), `${lang}: ${todo}`);
      assert.ok(c.r.textos.every((x) => x.x >= 0 && x.x <= ANCHO && x.y > 0 && x.y <= ALTO), 'todo el texto cae dentro del lienzo'); assert.ok(c.r.strokes >= 2, 'marco doble');
      assert.ok(c.r.rects.every((q) => q.x >= 0 && q.y >= 0 && q.x + q.w <= ANCHO + 1 && q.y + q.h <= ALTO + 1), 'ningún rectángulo se sale');
      if (lang === 'en') assert.ok(todo.includes('CADET CERTIFICATE') && !/[áéíóúñ¡¿]/i.test(todo.replace('Estación', '')), todo); else assert.ok(todo.includes('CERTIFICADO DE CADETE'));
    } finally { setLang('es'); }
  }
  assert.match(logro(datos), /10 días/);
});

test('certificado: es repetible (mismo dibujo para los mismos datos), no usa azar y aguanta nombres vacíos o largos', () => {
  const una = (d) => { const c = falso(); dibujaCertificado(c, d); return JSON.stringify(c.r); };
  assert.equal(una(datos), una(datos)); assert.notEqual(una(datos), una({ ...datos, nombre: 'Sofía' }), 'las estrellitas del fondo cambian con el nombre');
  const antes = Math.random; let usos = 0; Math.random = () => { usos++; return 0.5; }; try { una(datos); } finally { Math.random = antes; } assert.equal(usos, 0);
  assert.doesNotThrow(() => una({ ...datos, nombre: '' })); assert.doesNotThrow(() => una({ ...datos, nombre: 'x'.repeat(200), estrellas: 9 }));
  const c = falso(); dibujaCertificado(c, { ...datos, estrellas: 1 }); assert.ok(c.r.textos.some((x) => x.t === '★☆☆'));
});

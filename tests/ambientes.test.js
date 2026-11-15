import { test } from 'node:test';
import assert from 'node:assert/strict';
import { objeto, MAT, detallePiso } from '../src/ambientes.js';

// Contexto falso que anota cada rectángulo pintado (color y posición): así se compara el «dibujo» sin navegador.
const lienzo = () => { const ops = []; return { ops, set fillStyle(c) { this.c = c; }, get fillStyle() { return this.c; }, fillRect(x, y, w, h) { ops.push(`${this.c}@${x},${y},${w},${h}`); } }; };
const dibuja = (t, theme, extra = {}) => { const b = lienzo(); const ok = objeto(b, { t, x: 0, y: 0, ...extra }, theme); return { ok, firma: b.ops.join('|'), ops: b.ops }; };
const TIPOS = ['cama', 'escondite', 'casillero', 'cajon', 'mesa', 'cinta', 'estudio', 'capcom', 'registro', 'traje', 'palanca', 'mant'];
const DESTINOS = ['estacion', 'luna', 'marte'];

test('ambientes: cada objeto tiene versión propia en los 3 destinos y se ve distinto en cada uno', () => {
  for (const t of TIPOS) {
    const f = DESTINOS.map((d) => dibuja(t, d, { sys: 'vida' }));
    assert.ok(f.every((x) => x.ok && x.ops.length >= 4), `${t}: se dibuja en los tres`);
    assert.equal(new Set(f.map((x) => x.firma)).size, 3, `${t}: la Estación, la Luna y Marte se ven distintos`);
  }
});

test('ambientes: todo cabe en su casilla (16×16, la palanca asoma 3 px arriba) y lo desconocido sigue con el dibujo de siempre', () => {
  for (const t of TIPOS) for (const d of DESTINOS) for (const op of dibuja(t, d, { sys: 'rad' }).ops) {
    const [x, y, w, h] = op.split('@')[1].split(',').map(Number);
    assert.ok(x >= 0 && x + w <= 16 && y >= -3 && y + h <= 16, `${t}/${d} se sale: ${op}`);
  }
  assert.equal(dibuja('nucleo', 'luna').ok, false); assert.equal(dibuja('cama', 'venus').ok, false);
});

test('ambientes: el panel de mantenimiento conserva el color de su sistema en todos los destinos (así se reconoce)', () => {
  for (const d of DESTINOS) for (const [sys, c] of [['vida', '#5fd3ff'], ['energia', '#ffd23d']]) assert.ok(dibuja('mant', d, { sys }).firma.includes(c), `${d}/${sys}`);
});

test('ambientes: la Estación no tiene polvo; la Luna y Marte sí, cada una con su color; el piso cambia por destino', () => {
  assert.equal(MAT.estacion.polvo, null); assert.notEqual(MAT.luna.polvo, MAT.marte.polvo);
  assert.ok(!dibuja('cama', 'estacion').firma.includes(MAT.luna.polvo)); assert.ok(dibuja('cama', 'marte').firma.includes(MAT.marte.polvo));
  const piso = (d) => { const b = lienzo(); for (let i = 0; i < 40; i++) detallePiso(b, d, 0, 0, i / 40, i % 2 === 0); return b.ops.join('|'); };
  assert.equal(new Set(DESTINOS.map(piso)).size, 3);
});

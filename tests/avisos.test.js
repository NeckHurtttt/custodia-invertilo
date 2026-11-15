import { test } from 'node:test';
import assert from 'node:assert/strict';
import { admite, MAX_AVISOS, PRIO, TTL } from '../src/avisos.js';
import * as G from '../src/core.js';

// Simula una cola de avisos como la de la pantalla: aplica admite() y devuelve lo que queda visible.
function simula(entradas, ctx = {}) {
  const vis = []; let id = 0;
  for (const e of entradas) {
    const r = admite(vis, e, ctx); for (const q of r.quitar) vis.splice(vis.findIndex((v) => v.id === q), 1);
    if (r.mostrar) vis.push({ id: ++id, ...e });
    assert.ok(vis.length <= MAX_AVISOS, 'nunca se pasa del tope');
  }
  return vis;
}

test('avisos: nunca hay más de 2 a la vez, pase lo que pase', () => {
  const lluvia = Array.from({ length: 40 }, (_, i) => ({ kind: ['info', 'ok', 'warn', 'bad', 'ia', 'day'][i % 6], text: `mensaje ${i}` }));
  assert.ok(simula(lluvia).length <= MAX_AVISOS);
});

test('avisos: lo importante desplaza a lo menor, y lo menor no desplaza a lo importante', () => {
  const grave = [{ kind: 'bad', text: 'a' }, { kind: 'ia', text: 'b' }];
  assert.deepEqual(simula([...grave, { kind: 'info', text: 'trivial' }]).map((v) => v.text), ['a', 'b'], 'info no entra si todo vale más');
  const r = simula([{ kind: 'info', text: 'x' }, { kind: 'ok', text: 'y' }, { kind: 'info', text: 'z' }, { kind: 'bad', text: 'URGENTE' }]);
  assert.ok(r.some((v) => v.text === 'URGENTE') && !r.some((v) => v.text === 'x'), 'sale el menor más viejo');
});

test('avisos: no se repite lo que ya está en pantalla, y lo "quiet" nunca sube', () => {
  assert.equal(simula([{ kind: 'warn', text: 'igual' }, { kind: 'warn', text: 'igual' }]).length, 1);
  assert.equal(simula([{ kind: 'warn', text: 'solo registro', quiet: true }]).length, 0);
});

test('avisos: en una emergencia solo pasan los avisos de prioridad 3 o más', () => {
  const r = simula([{ kind: 'info', text: 'charla' }, { kind: 'ok', text: 'bien' }, { kind: 'warn', text: 'aviso' }, { kind: 'bad', text: 'grave' }], { emergencia: true });
  assert.deepEqual(r.map((v) => v.text), ['aviso', 'grave']);
});

test('avisos: lo menor dura poco en pantalla y lo grave más', () => {
  assert.ok(TTL.info < TTL.warn && TTL.warn < TTL.bad); assert.ok(PRIO.bad > PRIO.warn && PRIO.warn > PRIO.info);
});

test('avisos: el juego marca como "quiet" lo que ya dice otro panel (AHORA) o repite otro aviso', () => {
  const s = G.newGame('estacion', 7, 'normal');
  // cada bloque nuevo anuncia "Ahora: …" en el registro, pero no debe subir a pantalla (el panel AHORA ya lo muestra)
  for (let i = 0; i < 4000 && !s.log.some((l) => l.text.startsWith('Ahora:')); i++) G.update(s, 0.5, { dx: 0, dy: 0 });
  const ahora = s.log.filter((l) => l.text.startsWith('Ahora:')); assert.ok(ahora.length > 0, 'el juego anunció algún bloque');
  assert.ok(ahora.every((l) => l.quiet === true));
});

test('avisos en teléfono: uno a la vez y solo lo importante', () => {
  const ctx = { max: 1, minPrio: 3 };
  assert.equal(simula([{ kind: 'info', text: 'i' }, { kind: 'ok', text: 'o' }], ctx).length, 0, 'info y ok no suben');
  const r = simula([{ kind: 'warn', text: 'w' }, { kind: 'bad', text: 'b' }], ctx);
  assert.deepEqual(r.map((v) => v.text), ['b'], 'lo grave reemplaza a lo anterior');
});

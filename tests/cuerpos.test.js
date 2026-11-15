import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dibujaCuerpo, marca, perfil, PERFIL, ROLES, reloj } from '../src/cuerpos.js';

/** Contexto falso: apunta cada rectángulo que se pinta (el dibujo es solo eso: fillRect). */
const falso = () => { const r = []; return { r, globalAlpha: 1, fillStyle: '', strokeStyle: '', lineWidth: 1, fillRect(x, y, w, h) { r.push({ x, y, w, h, c: this.fillStyle }); }, beginPath() {}, ellipse() {}, stroke() {} }; };
const NOMBRES = ['Comandante', 'María', 'Kenji', 'Amara', 'Sofía', 'Nikolai', 'Wei', 'Lucía', 'Tomás', 'Aisha'];

test('cuerpos: los 9 compañeros y el jugador tienen oficio y aspecto propios; cualquier otro nombre recibe uno estable', () => {
  for (const n of NOMBRES) { assert.ok(PERFIL[n], n); assert.ok(ROLES.includes(PERFIL[n].rol), n); }
  assert.equal(new Set(NOMBRES.filter((n) => n !== 'Comandante').map((n) => PERFIL[n].rol)).size, 9, 'cada compañero tiene un oficio distinto');
  assert.equal(perfil('Volkov').rol, 'generico'); assert.deepEqual(perfil('Volkov'), perfil('Volkov')); assert.notDeepEqual(perfil('Volkov').skin + perfil('Volkov').hair, perfil('Inspector').skin + perfil('Inspector').hair + 'x');
});

test('cuerpos: cada personaje se ve distinto y entra en la caja de 15×23 px en las 4 direcciones y con todos los ánimos', () => {
  reloj.t = 5000;
  const firmas = new Set();
  for (const n of NOMBRES) for (const f of ['d', 'u', 'l', 'r']) for (const emo of ['normal', 'habla', 'feliz', 'miedo', 'enojo']) {
    const c = falso(); dibujaCuerpo(c, { x: 100, y: 100, f, step: 1, key: n, shirt: '#ff8a3d', moving: true, emo, anim: true, ring: n === 'Comandante' });
    assert.ok(c.r.length > 20, `${n} ${f}: dibuja`);
    for (const q of c.r) assert.ok(q.x >= 100 - 8 && q.x + q.w <= 100 + 8 && q.y >= 100 - 16 && q.y + q.h <= 100 + 9, `${n} ${f} ${emo}: se sale de la caja → ${JSON.stringify(q)}`);
    if (f === 'd' && emo === 'normal') firmas.add(JSON.stringify(c.r));
  }
  assert.equal(firmas.size, NOMBRES.length, 'ningún personaje es igual a otro');
});

test('cuerpos: la animación es mínima y se apaga con efectos suaves; el dibujo no gasta azar', () => {
  const dibuja = (t, anim) => { reloj.t = t; const c = falso(); dibujaCuerpo(c, { x: 50, y: 50, f: 'd', key: 'Kenji', shirt: '#3da5ff', moving: false, anim }); return JSON.stringify(c.r); };
  const quieto = new Set(); for (let t = 0; t < 8000; t += 90) quieto.add(dibuja(t, false));
  assert.equal(quieto.size, 1, 'en modo suave no respira ni parpadea');
  const vivo = new Set(); for (let t = 0; t < 8000; t += 90) vivo.add(dibuja(t, true));
  assert.ok(vivo.size >= 2 && vivo.size <= 4, `respirar y parpadear: ${vivo.size} poses`);
  const antes = Math.random; let usos = 0; Math.random = () => { usos++; return 0.5; }; try { dibuja(1234, true); marca(falso(), 10, 10, '#fff'); } finally { Math.random = antes; }
  assert.equal(usos, 0, 'dibujar no usa Math.random');
});

test('cuerpos: el marcador del compañero lleva su color', () => {
  const c = falso(); marca(c, 40, 40, '#c86bff', false); assert.ok(c.r.some((q) => q.c === '#c86bff'));
});

// Sonido: reglas puras (sonido.js) y que music.js sea inofensivo sin AudioContext. NO se crea ningún AudioContext aquí.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as Snd from '../src/sonido.js';
import * as M from '../src/music.js';

test('sonido: nivelMusica sigue a s.threat (calma, tensión, persecución, huida)', () => {
  const t = (lvl, near, extra = {}) => Snd.nivelMusica({ threat: { lvl, sus: 0, near }, ...extra });
  assert.equal(Snd.nivelMusica({}), 0, 'sin datos: calma');
  assert.equal(t(0, 99), 0);
  assert.equal(t(1, 6), 1, 'sospechan cerca: tensión');
  assert.equal(t(1, 30), 0, 'sospecha muy lejos: sigue la calma');
  assert.equal(t(2, 5), 2, 'te persiguen cerca: persecución');
  assert.equal(t(2, 20), 1, 'te persiguen pero lejos: solo tensión');
  assert.equal(t(2, 11, { hidden: true }), 2, 'escondido con el perseguidor cerca sigue la tensión alta');
  assert.equal(t(2, 5, { final: true }), 3, 'la huida final manda');
  assert.equal(t(2, 5, { over: true, final: true }), 0, 'partida terminada: calma');
  assert.equal(t(0, 99, { alert: 60 }), 1, 'alerta alta sin nadie cerca: tensión');
  assert.equal(t(0, 99, { emerg: true }), 1);
  assert.equal(t(0, 99, { danger: 0.7 }), 2, 'los cazadores muy cerca siguen contando');
});

test('sonido: suavizarNivel sube al instante y baja de a un nivel, con espera', () => {
  const est = { nivel: 0, resta: 0 };
  assert.equal(Snd.suavizarNivel(est, 2, 0.016), 2, 'sube de golpe');
  for (let i = 0; i < 100; i++) Snd.suavizarNivel(est, 0, 0.016); // 1,6 s < 3 s de espera
  assert.equal(est.nivel, 2, 'aguanta mientras dura la espera');
  for (let i = 0; i < 200; i++) Snd.suavizarNivel(est, 0, 0.016); // ~4,8 s más
  assert.equal(est.nivel, 0, 'termina bajando a calma');
  const e2 = { nivel: 3, resta: 3 }; const vistos = new Set();
  for (let i = 0; i < 600; i++) vistos.add(Snd.suavizarNivel(e2, 0, 0.05));
  assert.deepEqual([...vistos].sort(), [0, 1, 2, 3], 'baja por todos los escalones, sin saltarse ninguno');
  assert.equal(Snd.suavizarNivel(e2, 1, 0.05), 1, 'si vuelve la tensión, sube otra vez al instante');
});

test('sonido: latido solo cuando te persiguen (lvl 2), más rápido cuanto más cerca', () => {
  assert.equal(Snd.tasaLatido({ threat: { lvl: 0, near: 2 } }), 0);
  assert.equal(Snd.tasaLatido({ threat: { lvl: 1, near: 2 } }), 0, 'sospechar no hace latir');
  const cerca = Snd.tasaLatido({ threat: { lvl: 2, near: 1 } }), lejos = Snd.tasaLatido({ threat: { lvl: 2, near: 30 } });
  assert.ok(cerca > lejos && lejos >= 0.3 && cerca <= 1);
  assert.equal(Snd.tasaLatido({ final: true }), 0.6);
  assert.equal(Snd.tasaLatido({}), 0);
});

test('sonido: pasos por superficie (metal, polvo, casco) y ninguno en conductos, agachado o dormido', () => {
  const p = (o) => Snd.superficiePaso(o);
  assert.equal(p({ loc: 'estacion' }), 'metal'); assert.equal(p({ loc: 'luna' }), 'metal', 'dentro de la base de la Luna también es metal');
  assert.equal(p({ loc: 'luna', outside: true }), 'polvo'); assert.equal(p({ loc: 'marte', outside: true }), 'polvo');
  assert.equal(p({ loc: 'estacion', outside: true }), 'casco');
  assert.equal(p({ loc: 'marte', inDuct: true }), null); assert.equal(p({ loc: 'marte', crouch: true }), null); assert.equal(p({ sleep: true }), null);
});

test('sonido: zonas del jugador', () => {
  assert.equal(Snd.zonaJugador({ inDuct: true, outside: true }), 'conducto');
  assert.equal(Snd.zonaJugador({ outside: true }), 'fuera');
  assert.equal(Snd.zonaJugador({ shelter: true }), 'refugio');
  assert.equal(Snd.zonaJugador({}), 'dentro');
});

test('sonido: ambiente distinto por destino y zona, con topes seguros y sin NaN', () => {
  const zonas = ['dentro', 'conducto', 'refugio', 'fuera'];
  for (const loc of ['estacion', 'luna', 'marte']) for (const zona of zonas) for (const noche of [false, true]) for (const tormenta of [0, 1, 2]) {
    const m = Snd.mezclaAmbiente({ loc, zona, noche, tormenta });
    for (const k of ['hum', 'vent', 'ventF', 'wind', 'windF', 'vac', 'lp', 'eco']) assert.ok(Number.isFinite(m[k]) && m[k] >= 0, `${loc}/${zona}/${k} = ${m[k]}`);
    for (const k of Object.keys(Snd.TOPE_AMB)) assert.ok(m[k] <= Snd.TOPE_AMB[k], `${loc}/${zona}: ${k} pasa el tope`);
  }
  const A = (o) => Snd.mezclaAmbiente(o);
  assert.ok(A({ loc: 'marte', zona: 'fuera' }).wind > A({ loc: 'marte', zona: 'dentro' }).wind * 3, 'en Marte el viento es mucho más fuerte afuera');
  assert.ok(A({ loc: 'marte', zona: 'fuera', tormenta: 2 }).wind > A({ loc: 'marte', zona: 'fuera' }).wind, 'la tormenta sube el viento');
  assert.ok(A({ loc: 'marte', zona: 'dentro' }).lp < A({ loc: 'marte', zona: 'fuera' }).lp, 'adentro suena amortiguado');
  assert.ok(A({ loc: 'estacion', zona: 'dentro' }).hum > A({ loc: 'luna', zona: 'dentro' }).hum, 'la Estación zumba más que la Luna');
  assert.equal(A({ loc: 'estacion', zona: 'dentro' }).wind, 0, 'sin viento en la Estación');
  assert.ok(A({ loc: 'luna', zona: 'fuera' }).eco > 0 && A({ loc: 'estacion', zona: 'dentro' }).eco === 0, 'la Luna tiene ecos lejanos');
  assert.ok(A({ loc: 'luna', zona: 'fuera' }).hum === 0 && A({ loc: 'luna', zona: 'fuera' }).vac > 0, 'afuera en la Luna: casi solo vacío');
  assert.ok(A({ loc: 'estacion', zona: 'dentro', noche: true }).vent < A({ loc: 'estacion', zona: 'dentro' }).vent, 'de noche baja la ventilación');
  assert.equal(A({ loc: 'inventado', zona: 'inventada' }).hum, A({ loc: 'estacion', zona: 'dentro' }).hum, 'valores desconocidos caen en la Estación');
});

test('sonido: variación de afinación acotada y tonos de interfaz con volumen seguro', () => {
  assert.equal(Snd.variar(440, 0.5), 440);
  for (const r of [0, 0.25, 1]) { const f = Snd.variar(1000, r, 0.05); assert.ok(f >= 950 && f <= 1050); }
  assert.ok(Snd.variar(1000, 1, 5) <= 1200, 'la amplitud también está acotada');
  assert.deepEqual(Snd.acotaTono(0.9, 30), { vol: 0.06, dur: 1.2 });
  assert.deepEqual(Snd.acotaTono(-1, 0.001), { vol: 0, dur: 0.03 });
  assert.ok(Snd.lpObjetivo(3, false, 1) > Snd.lpObjetivo(0, false, 0), 'más tensión abre el filtro');
  assert.equal(Snd.lpObjetivo(3, true, 1), 900, 'de noche se cierra');
});

test('music.js: sin AudioContext todo se degrada en silencio (ni lanza ni crea nada)', () => {
  assert.equal(typeof globalThis.AudioContext, 'undefined');
  for (const k of M.STINGS) M.sting(k);
  for (const k of M.SFX) M.sfx(k, { suave: true, u: true });
  for (const k of M.UI) M.ui(k);
  M.tone(440, 0.1, 'square', 0.5); M.paso('metal'); M.paso(null); M.heartbeat(1); M.ambiente(null); M.ambiente(Snd.mezclaAmbiente({}));
  M.set('marte', 2, true, 0.8); M.idle(); M.wake();
  assert.equal(typeof M.on(), 'boolean'); assert.equal(typeof M.sfxOn(), 'boolean');
});

test('music.js: sting conoce todas las claves que emite el núcleo (s.sfx)', () => {
  const claves = new Set();
  for (const f of ['core.js', 'villains.js', 'sistemas.js']) {
    const src = readFileSync(new URL(`../src/${f}`, import.meta.url), 'utf8');
    for (const m of src.matchAll(/\bsfx\(s, '([a-z_]+)'\)|\.sfx\??\.push\('([a-z_]+)'\)|\.sfx \?\?= \[\]\)\.push\('([a-z_]+)'\)|\(s\.sfx \?\?= \[\]\)\.push\('([a-z_]+)'\)|V\.sfx\(s, '([a-z_]+)'\)/g)) claves.add(m[1] ?? m[2] ?? m[3] ?? m[4] ?? m[5]);
  }
  assert.ok(claves.size >= 8, `se esperaban varias claves, salieron ${[...claves]}`);
  for (const k of claves) assert.ok(M.STINGS.includes(k), `la clave «${k}» sale del núcleo pero sting() no la suena`);
  for (const k of ['sospecha', 'perdido', 'aviso']) assert.ok(M.STINGS.includes(k));
});

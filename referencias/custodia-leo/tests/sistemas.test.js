import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as G from '../src/core.js';
import * as Sys from '../src/sistemas.js';

const fresh = (opts = {}, dif = 'normal', seed = 77) => G.newGame('estacion', seed, dif, opts);
/** Pone al jugador sobre un panel de mantenimiento, a media mañana (turno de trabajo). */
function atStation(s, id, min = 500) {
  const o = Sys.station(s, id); s.min = min; s.p.x = o.x + 0.5; s.p.y = o.y + 0.5; s.p.energia = 90; s.grace = 999;
  G.update(s, 0.01); return o;
}
const run = (s, secs, dt = 0.05) => { for (let t = 0; t < secs; t += dt) { s.hazards.length = 0; s.events.length = 0; G.update(s, dt); } };

test('sistemas: la campaña de los 3 destinos tiene los 4 medidores (en Noche no)', () => {
  const s = fresh(); assert.ok(s.sys);
  assert.deepEqual(Object.keys(s.sys.lvl), ['vida', 'energia', 'rad', 'comida']);
  for (const id of Sys.SYS_IDS) assert.equal(s.sys.lvl[id], Sys.START_LVL);
  assert.ok(G.newGame('luna', 1).sys); assert.ok(G.newGame('marte', 1).sys);
  assert.equal(G.newGame('luna', 1, 'normal', { mode: 'noche' }).sys, null);
  assert.equal(G.newGame('estacion', 1, 'normal', { mode: 'noche' }).sys, null);
});

test('sistemas: cada sistema tiene su panel en una sala distinta y el turno de trabajo no obliga a una sala', () => {
  const s = fresh(); const rooms = new Set();
  for (const id of Sys.SYS_IDS) { const o = Sys.station(s, id); assert.ok(o, `falta el panel de ${id}`); rooms.add(G.roomIdAt(s, o.x + 0.5, o.y + 0.5)); }
  assert.equal(rooms.size, 4);
  const work = s.L.schedule.find((b) => b.id === 'trabajo'); assert.equal(work.room, null);
});

test('sistemas: sin mantenimiento bajan solos (más en Terror que en Fácil)', () => {
  const normal = fresh(); Sys.update(normal, 0, 1440);
  assert.ok(Math.abs(normal.sys.lvl.vida - (90 - Sys.SYS.vida.decay * 0.7)) < 1e-9);
  assert.ok(normal.sys.lvl.comida < 90 && normal.sys.lvl.energia < 90 && normal.sys.lvl.rad < 90);
  const facil = fresh({}, 'facil'); Sys.update(facil, 0, 1440);
  const terror = fresh({}, 'dificil'); Sys.update(terror, 0, 1440);
  assert.ok(facil.sys.lvl.vida > normal.sys.lvl.vida && normal.sys.lvl.vida > terror.sys.lvl.vida);
});

test('sistemas: con poca energía, todo lo demás se degrada más rápido', () => {
  const a = fresh(); const b = fresh(); b.sys.lvl.energia = 20;
  Sys.update(a, 0, 1440); Sys.update(b, 0, 1440);
  assert.ok(b.sys.lvl.vida < a.sys.lvl.vida);
  assert.ok(b.sys.lvl.comida < a.sys.lvl.comida);
});

test('mantenimiento: se hace en el turno de trabajo, tarda y restaura el sistema', () => {
  const s = fresh(); s.sys.lvl.vida = 40;
  const o = atStation(s, 'vida');
  assert.equal(G.block(s).id, 'trabajo');
  assert.match(G.label(s, G.nearby(s)[0]), /Mantenimiento/);
  G.interact(s); assert.equal(s.action?.kind, 'mant');
  run(s, 3.5);
  assert.ok(s.sys.done.vida);
  assert.ok(s.sys.lvl.vida > 90, `vida ${s.sys.lvl.vida}`);
  assert.equal(s.sys.st.done, 1);
  assert.deepEqual(Sys.pending(s).sort(), ['comida', 'energia', 'rad']);
  G.interact(s); assert.equal(s.action, null, 'ya revisado hoy');
  assert.equal(o.t, 'mant');
});

test('mantenimiento: fuera del turno de trabajo no se puede', () => {
  const s = fresh(); atStation(s, 'energia', 900);
  assert.notEqual(G.block(s).id, 'trabajo');
  G.interact(s); assert.equal(s.action, null); assert.match(s.msg.text, /turno de trabajo/);
});

test('mantenimiento: omitir revisiones cuesta alerta, integridad y nivel; hacerlas todas baja la alerta', () => {
  const s = fresh(); s.min = 715; s.alert = 0; G.update(s, 0.01);
  assert.equal(G.block(s).id, 'trabajo');
  const integ = s.integ; const lvl = s.sys.lvl.rad;
  s.min = 719.9; G.update(s, 0.1); G.update(s, 0.1);
  assert.notEqual(G.block(s).id, 'trabajo');
  assert.equal(s.sys.st.skipped, 4);
  assert.ok(s.alert > 0, 'CUSTODIA debe notarlo');
  assert.ok(s.integ < integ);
  assert.ok(s.sys.lvl.rad < lvl);

  const t = fresh(); t.min = 715; t.alert = 30; G.update(t, 0.01);
  for (const id of Sys.SYS_IDS) t.sys.done[id] = true;
  t.min = 719.9; G.update(t, 0.1); G.update(t, 0.1);
  assert.equal(t.sys.st.perfect, 1); assert.ok(t.alert < 30);
});

test('mantenimiento: cada día vuelve a haber 4 revisiones', () => {
  const s = fresh(); for (const id of Sys.SYS_IDS) s.sys.done[id] = true;
  s.min = 1439.9; G.update(s, 0.1); G.update(s, 0.1);
  assert.equal(s.day, 2); assert.equal(Sys.pending(s).length, 4);
});

test('radiación: la dosis sube más rápido con el blindaje bajo y se mide en % del límite', () => {
  const a = fresh(); const b = fresh(); b.sys.lvl.rad = 0;
  Sys.update(a, 0, 1440); Sys.update(b, 0, 1440);
  assert.ok(b.sys.dose > a.sys.dose * 1.6, `${b.sys.dose} vs ${a.sys.dose}`);
  assert.ok(Math.abs(Sys.dosePct(a) - (a.sys.dose / Sys.DOSE_LIMIT) * 100) < 1e-9);
  const v = Sys.view(a); assert.match(v.note, /600 mSv/); assert.match(v.note, /ALARA/);
});

test('radiación: pasar el límite de la misión termina la partida con una explicación', () => {
  const s = fresh(); s.sys.dose = Sys.DOSE_LIMIT - 0.001; s.sys.lvl.rad = 0;
  Sys.update(s, 0, 600);
  assert.ok(s.over); assert.equal(s.over.title, 'Dosis límite superada'); assert.match(s.over.text, /ALARA/);
});

test('soporte vital: a cero te hace daño y acaba con una explicación; la comida a cero también, pero más lento', () => {
  const s = fresh(); s.sys.lvl.vida = 0; s.p.salud = 5;
  Sys.update(s, 0, 120);
  assert.ok(s.over); assert.equal(s.over.title, 'Sin aire respirable');

  const f = fresh(); f.sys.lvl.comida = 0; f.p.salud = 100; Sys.update(f, 0, 120);
  assert.ok(f.p.salud < 100 && f.p.salud > 80 && !f.over);
});

test('comida: cada ración gasta provisiones y sin provisiones no hay comida', () => {
  const s = fresh(); s.min = 430; s.p.x = 5.5; s.p.y = 13.5; s.grace = 999; G.update(s, 0.01);
  assert.equal(G.block(s).id, 'comer');
  const mesa = s.objects.find((o) => o.t === 'mesa'); s.p.x = mesa.x + 0.5; s.p.y = mesa.y + 0.5; s.p.energia = 20;
  G.interact(s); assert.ok(s.ate); assert.ok(Math.abs(s.sys.lvl.comida - 87) < 0.2, `comida ${s.sys.lvl.comida}`);
  const t = fresh(); t.min = 430; t.sys.lvl.comida = 0; G.update(t, 0.01);
  const m2 = t.objects.find((o) => o.t === 'mesa'); t.p.x = m2.x + 0.5; t.p.y = m2.y + 0.5; G.interact(t);
  assert.ok(!t.ate); assert.match(t.msg.text, /raciones/);
});

test('avisos: aparece PRECAUCIÓN y luego ADVERTENCIA al bajar los niveles', () => {
  const s = fresh(); s.sys.lvl.comida = 45; Sys.update(s, 0, 1);
  assert.ok(s.log.some((l) => /PRECAUCIÓN: COMIDA/.test(l.text)));
  s.sys.lvl.comida = 20; Sys.update(s, 0, 1);
  assert.ok(s.log.some((l) => /ADVERTENCIA: COMIDA/.test(l.text)));
});

// ---------- emergencias de reflejos ----------
test('reflejos: apagado por defecto no hay emergencias nunca', () => {
  const s = fresh(); assert.equal(s.sys.reflex, false);
  for (let i = 0; i < 40; i++) { for (const id of Sys.SYS_IDS) s.sys.done[id] = false; atStation(s, 'rad', 500 + i); G.interact(s); run(s, 3.2); }
  assert.equal(s.sys.emerg, null); assert.equal(s.sys.st.saved, 0); assert.ok(!s.over);
  assert.equal(fresh({ reflex: true, daily: true }).sys.reflex, false, 'el reto diario no usa reflejos');
});

test('reflejos: al hacer mantenimiento puede saltar una emergencia con cuenta atrás', () => {
  let fired = 0;
  for (let seed = 1; seed <= 12; seed++) {
    const s = fresh({ reflex: true }, 'normal', seed); atStation(s, 'rad'); G.interact(s); run(s, 3.2);
    if (s.sys.emerg) { fired++; assert.ok(s.sys.emerg.t > 5 && s.sys.emerg.t <= s.sys.emerg.total); assert.ok(s.sys.emToday === 1); assert.match(s.msg.text, /⚠/); }
  }
  assert.ok(fired >= 3 && fired <= 11, `saltó ${fired} de 12`);
});

test('reflejos: llegar y atender la emergencia a tiempo te salva', () => {
  const s = fresh({ reflex: true }); atStation(s, 'rad');
  const e = Sys.startEmergency(s, null, 'sobrecarga'); assert.ok(e);
  assert.equal(Sys.view(s).emerg.verb, 'Reiniciar el panel de energía');
  const o = Sys.station(s, 'energia'); s.p.x = o.x + 0.5; s.p.y = o.y + 0.5; s.sys.lvl.energia = 30;
  const n = G.nearby(s)[0]; assert.equal(n.kind, 'emerg'); assert.match(G.label(s, n), /Reiniciar/);
  G.interact(s); assert.equal(s.action.kind, 'emerg');
  run(s, 1.7);
  assert.equal(s.sys.emerg, null); assert.equal(s.sys.st.saved, 1); assert.ok(!s.over); assert.ok(s.sys.lvl.energia >= 44);
});

test('reflejos: si no llegas a tiempo, mueres (con explicación según la emergencia)', () => {
  for (const [kind, title] of [['meteorito', 'Despresurización'], ['sobrecarga', 'Incendio eléctrico'], ['co2', 'Intoxicación por CO₂'], ['llamarada', 'Dosis aguda de radiación'], ['incendio', 'Incendio a bordo']]) {
    const s = fresh({ reflex: true }); atStation(s, 'comida');
    const e = Sys.startEmergency(s, null, kind); assert.ok(e, kind);
    assert.ok(!s.over); run(s, e.total + 0.5);
    assert.ok(s.over && !s.over.won, kind); assert.equal(s.over.title, title);
  }
});

test('reflejos: el tiempo depende de la distancia y de la dificultad', () => {
  const a = fresh({ reflex: true }, 'facil'); atStation(a, 'comida'); const ea = Sys.startEmergency(a, null, 'sobrecarga');
  const b = fresh({ reflex: true }, 'pesadilla'); atStation(b, 'comida'); const eb = Sys.startEmergency(b, null, 'sobrecarga');
  assert.ok(ea.total > eb.total * 1.5);
  const c = fresh({ reflex: true }); atStation(c, 'energia'); const near = Sys.startEmergency(c, null, 'sobrecarga'); // ya estás ahí
  assert.ok(near.total < 9);
});

test('reflejos: el sistema más descuidado provoca su propia emergencia', () => {
  let own = 0;
  for (let seed = 1; seed <= 20; seed++) {
    const s = fresh({ reflex: true }, 'normal', seed); atStation(s, 'rad'); s.sys.lvl.comida = 10;
    const e = Sys.startEmergency(s, 'rad'); if (e.kind === 'incendio') own++;
  }
  assert.ok(own >= 8, `solo ${own}/20`);
});

test('reflejos: la cuenta atrás se detiene mientras hay un minijuego abierto', () => {
  const s = fresh({ reflex: true }); atStation(s, 'rad'); const e = Sys.startEmergency(s, null, 'co2'); const t0 = e.t;
  s.pending = { kind: 'cables' }; for (let i = 0; i < 100; i++) G.update(s, 0.05);
  assert.equal(s.sys.emerg.t, t0);
});

test('guardado: los sistemas y la emergencia sobreviven a guardar y cargar', () => {
  const s = fresh({ reflex: true }); atStation(s, 'rad'); Sys.startEmergency(s, null, 'meteorito'); s.sys.lvl.vida = 33.5; s.sys.dose = 1.25;
  const r = G.revive(JSON.parse(G.serialize(s)));
  assert.deepEqual(r.sys, s.sys);
  G.update(r, 0.05); assert.ok(r.sys.emerg.t < s.sys.emerg.t);
  const old = JSON.parse(G.serialize(s)); delete old.sys; assert.equal(G.revive(old).sys, null, 'partidas viejas siguen funcionando');
});

test('determinismo: misma semilla y mismas acciones, mismas emergencias', () => {
  const play = () => { const s = fresh({ reflex: true }, 'normal', 5); atStation(s, 'rad'); G.interact(s); run(s, 3.2); return JSON.stringify(s.sys); };
  assert.equal(play(), play());
});

test('sistemas: Luna y Marte tienen su sabor, su dosis y su evento de escasez', () => {
  const e = G.newGame('estacion', 3), l = G.newGame('luna', 3), m = G.newGame('marte', 3);
  for (const s of [l, m]) for (const id of Sys.SYS_IDS) assert.ok(Sys.station(s, id), `falta el panel de ${id} en ${s.L.id}`);
  assert.match(Sys.taskName(l, 'energia'), /noche lunar/i); assert.match(Sys.taskName(m, 'energia'), /polvo/i);
  assert.match(Sys.view(l).note, /Chang/); assert.match(Sys.view(m).note, /Curiosity/);
  // dosis: Luna > Marte > ISS con el mismo blindaje
  for (const s of [e, l, m]) Sys.update(s, 0, 1440);
  assert.ok(l.sys.dose > m.sys.dose && m.sys.dose > e.sys.dose);
  // la noche lunar (días 5–7) hace caer la energía más rápido y recuperarla peor
  const a = G.newGame('luna', 3), b = G.newGame('luna', 3); b.day = 5;
  assert.equal(Sys.mods(a).length, 0); assert.equal(Sys.mods(b).length, 1);
  Sys.update(a, 0, 1440); Sys.update(b, 0, 1440); assert.ok(b.sys.lvl.energia < a.sys.lvl.energia - 5);
  const c = G.newGame('luna', 3); c.day = 5; c.sys.lvl.energia = 20; c.sys.done = {}; c.s = c;
  Sys.finish(c, { kind: 'mant', o: Sys.station(c, 'energia') }); assert.ok(Math.abs(c.sys.lvl.energia - (20 + 55 * 0.6)) < 1e-9);
  // el aviso del evento sale en el log el día que empieza y el que termina
  const d = G.newGame('luna', 3); d.day = 5; Sys.newDay(d); assert.ok(d.log.some((x) => /NOCHE LUNAR/.test(x.text)));
  d.day = 8; Sys.newDay(d); assert.ok(d.log.some((x) => /Amanece/.test(x.text)));
});

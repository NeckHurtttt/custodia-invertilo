import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as G from '../src/core.js';
import * as Sys from '../src/sistemas.js';
import { PROTOCOLS, PROTO_FUENTE } from '../src/common.js';
import { hash, idMant, eventoDelDia, EVENTOS, PROB_EVENTO, VARIANTES } from '../src/variedad.js';
import { setLang } from '../src/i18n.js';

const hasta = (s, day, min = 5) => { let n = 0; while (!s.over && (s.day < day || s.min < min) && n++ < 400000) { s.p.salud = 100; s.p.energia = 100; s.alert = 0; s.grace = 9999; G.update(s, 0.5); } };

test('variedad: el hash es estable y el día 1 siempre trae las revisiones de siempre', () => {
  assert.equal(hash(1, 2, 3), hash(1, 2, 3)); assert.notEqual(hash(1, 2, 3), hash(1, 2, 4));
  for (const sys of ['vida', 'energia', 'rad', 'comida']) assert.equal(idMant(12345, 1, sys), `mant_${sys}`);
});

test('variedad: cada revisión tiene 3 versiones con 3 pasos, fuente y su inglés; a lo largo de una misión salen varias', () => {
  for (const sys of ['vida', 'energia', 'rad', 'comida']) for (const suf of VARIANTES) {
    const id = `mant_${sys}${suf}`, p = PROTOCOLS[id]; assert.ok(p?.mant, id); assert.equal(p.steps.length, 3, id); assert.equal(p.stepsEn.length, 3, id);
    assert.ok(PROTO_FUENTE[id]?.nivel === 'ficcion' && PROTO_FUENTE[id].fuente, `${id}: fuente`);
    assert.ok(!/[áéíóúñ¡¿]/i.test(p.stepsEn.join(' ')), `${id}: inglés sin acentos`);
  }
  for (const sys of ['vida', 'rad']) { const vistos = new Set(); for (let sem = 1; sem <= 30; sem++) for (let d = 2; d <= 10; d++) vistos.add(idMant(sem, d, sys)); assert.equal(vistos.size, 3, `${sys}: salen las 3 versiones`); }
  const a = new Set(); for (let d = 2; d <= 10; d++) a.add(idMant(777, d, 'vida')); assert.ok(a.size >= 2, 'en una misma partida cambia de un día a otro');
});

test('variedad: en la partida, el panel abre la versión del día y completarla cuenta igual', () => {
  const s = G.newGame('estacion', 21, 'cadete'); s.hazards = []; s.events = []; hasta(s, 3, 9 * 60);
  const o = Sys.station(s, 'vida'); Object.assign(s.p, { x: o.x + 0.5, y: o.y + 0.5, inDuct: false, hidden: null }); s.p.sleep = false;
  G.interact(s); assert.equal(s.pending?.id, idMant(s.sys.sem, 3, 'vida'), 'abre la versión de ese día');
  const pd = s.pending; G.resolveProtocol(s, true); assert.ok(s.sys.done.vida, 'cuenta como revisión hecha'); assert.ok(pd.mant);
});

test('variedad: los eventos del día son repetibles, ocurren ~70 % de los días (desde el 2) y nunca el día 1', () => {
  assert.equal(eventoDelDia(5, 1), null); assert.equal(eventoDelDia(5, 4)?.id, eventoDelDia(5, 4)?.id);
  let con = 0, total = 0; const ids = new Set(); for (let sem = 1; sem <= 200; sem++) for (let d = 2; d <= 10; d++) { total++; const e = eventoDelDia(sem, d); if (e) { con++; ids.add(e.id); } }
  assert.ok(Math.abs(con / total - PROB_EVENTO) < 0.06, `proporción ${con / total}`); assert.equal(ids.size, EVENTOS.length, 'salen todos los eventos');
  const buenos = EVENTOS.filter((e) => e.tipo === 'bueno').length, malos = EVENTOS.filter((e) => e.tipo === 'malo').length; assert.ok(buenos >= 3 && malos >= 4);
});

test('variedad: cada evento cambia la base de forma pequeña, se anuncia y sale en inglés; la prioridad premia y castiga', () => {
  for (const ev of EVENTOS) {
    const s = G.newGame('estacion', 3, 'normal'); const antes = { ...s.sys.lvl }; const integ = s.integ; const energia = s.p.energia; s.day = 4;
    const args = ev.aplica(s, s.sys, 1, (id) => Sys.SYS[id].name);
    const cambios = Object.keys(antes).map((k) => s.sys.lvl[k] - antes[k]); assert.ok(cambios.every((c) => Math.abs(c) <= 12), `${ev.id}: cambio pequeño ${cambios}`);
    assert.ok(ev.tipo === 'reto' || cambios.some((c) => c !== 0) || s.integ !== integ || s.p.energia !== energia, `${ev.id}: hace algo`);
    const sinNombre = { ...args, quien: args.quien ? 'Ana' : args.quien }; const es = ev.texto(sinNombre, (id) => Sys.SYS[id].name); setLang('en'); try { const en = ev.texto(sinNombre, (id) => Sys.SYS[id].name); assert.ok(en !== es && !/[áéíóúñ¡¿]/i.test(en), `${ev.id}: inglés → ${en}`); } finally { setLang('es'); }
  }
  const con = G.newGame('estacion', 3, 'normal'), sin = G.newGame('estacion', 3, 'normal'); con.sys.prio = 'rad'; con.sys.lvl.rad = 10; sin.sys.lvl.rad = 10;
  Sys.finish(con, { kind: 'mant', o: { sys: 'rad' } }); Sys.finish(sin, { kind: 'mant', o: { sys: 'rad' } });
  assert.equal(Math.round(con.sys.lvl.rad - sin.sys.lvl.rad), 8, 'la prioridad suma +8 extra');
  const t = G.newGame('estacion', 3, 'normal'); t.sys.prio = 'comida'; t.sys.lvl.comida = 80; t.sys.lvl.vida = 80; t.sys.done = { energia: true, rad: true };
  Sys.blockEnd(t, 'trabajo'); assert.equal(Math.round(t.sys.lvl.vida - t.sys.lvl.comida), Math.round(10 * G.dif(t).dmg), 'omitir la prioridad baja el doble');
});

test('variedad: una misión completa trae eventos en el panel y en la bitácora, (sin mantenimiento, solo para ver los eventos)', () => {
  const s = G.newGame('estacion', 99, 'cadete'); s.hazards = []; s.events = []; let vistos = 0;
  for (let d = 2; d <= 8; d++) { hasta(s, d, 3); if (Sys.view(s).events.some((e) => e.tipo)) vistos++; }
  assert.ok(vistos >= 2, `eventos vistos en el panel: ${vistos}`); assert.ok(Sys.historial(s).some((h) => h.evento), 'la bitácora anota el evento');
});

test('variedad: no gasta el azar de la partida (misma semilla, mismo desarrollo del resto)', () => {
  const a = G.newGame('luna', 5, 'cadete'), b = G.newGame('luna', 5, 'cadete');
  assert.equal(a.seed, b.seed); eventoDelDia(a.sys.sem, 4); idMant(a.sys.sem, 4, 'vida'); assert.equal(a.seed, b.seed);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as G from '../src/core.js';
import * as Sys from '../src/sistemas.js';
import * as UI from '../src/ui.js';
import { T, setLang, getLang, pickLang } from '../src/i18n.js';
import { LOCS, ROOM_EN } from '../src/locs.js';
import { DIFS, PERKS, PROTOCOLS, PROTO_FUENTE, PROTO_NIVEL, PROTO_NIVEL_EN, HAZARDS, ITEMS } from '../src/common.js';
import { restriccion, dosisReales, osdr, escala } from '../src/datos.js';
import { SHELTER, classText, sourceText } from '../src/clima.js';
import { VILLAINS, MISSIONS } from '../src/villains.js';
import { NOTES, TRUE_END } from '../src/story.js';
import { MEDALS } from '../src/meta.js';
import { CMD, AVISOS, DELAY_NOTE } from '../src/coop.js';

/** Corre `fn` en inglés y siempre vuelve a español (las demás pruebas esperan español). */
const enIngles = (fn) => { setLang('en'); try { return fn(); } finally { setLang('es'); } };

test('idioma: por defecto español; ?lang=en, ?en o lo guardado eligen inglés; nada raro cae en español', () => {
  assert.equal(getLang(), 'es'); assert.equal(T('hola', 'hello'), 'hola');
  assert.equal(pickLang('', null), 'es'); assert.equal(pickLang('?lang=en', null), 'en'); assert.equal(pickLang('?en', null), 'en');
  assert.equal(pickLang('', 'en'), 'en'); assert.equal(pickLang('?lang=es', 'en'), 'es', 'la dirección manda sobre lo guardado'); assert.equal(pickLang('?cadete&lang=EN-us', null), 'en');
  assert.equal(pickLang('?lang=fr', null), 'es'); assert.equal(setLang('xx'), 'es');
  enIngles(() => { assert.equal(T('hola', 'hello'), 'hello'); assert.equal(T('hola'), 'hola', 'sin traducción se queda en español'); });
  assert.equal(getLang(), 'es');
});

test('idioma: cada destino, nivel, personaje y sala tiene su versión en inglés', () => {
  for (const L of Object.values(LOCS)) {
    assert.ok(L.nameEn && L.tagEn, `${L.id}: falta nombre o lema en inglés`); assert.equal(L.introEn.length, L.intro.length, `${L.id}: la intro en inglés debe tener los mismos párrafos`);
    for (const r of L.rooms) assert.ok(ROOM_EN[r.name], `${L.id}: falta en inglés la sala "${r.name}"`);
  }
  for (const [k, d] of Object.entries(DIFS)) assert.ok(d.nameEn && d.descEn, `nivel ${k} sin inglés`);
  for (const [k, d] of Object.entries(PERKS)) assert.ok(d.nameEn && d.descEn, `personaje ${k} sin inglés`);
  for (const k of Object.keys(PROTO_NIVEL)) assert.ok(PROTO_NIVEL_EN[k], `nivel de protocolo ${k} sin inglés`);
});

test('idioma: los protocolos reales y los de mantenimiento se leen en inglés con su fuente', () => {
  for (const [k, f] of Object.entries(PROTO_FUENTE)) if (f.nivel !== 'ficcion' || PROTOCOLS[k].mant) assert.ok(f.fuenteEn && PROTOCOLS[k].titleEn, `${k}: falta título o fuente en inglés`);
  for (const k of Object.keys(PROTOCOLS).filter((x) => PROTOCOLS[x].mant)) assert.equal(PROTOCOLS[k].stepsEn.length, PROTOCOLS[k].steps.length, `${k}: mismos pasos en inglés`);
});

test('idioma: DATOS NASA (restricción, dosis, OSDR, escala) tiene las mismas filas en los dos idiomas', () => {
  const es = { r: restriccion(), d: dosisReales(), o: osdr(), e: escala() };
  const en = enIngles(() => ({ r: restriccion(), d: dosisReales(), o: osdr(), e: escala() }));
  assert.notEqual(en.r, es.r); assert.match(en.r, /never erases/);
  assert.equal(en.d.length, es.d.length); assert.equal(en.o.length, es.o.length); assert.equal(en.e.length, es.e.length);
  en.d.forEach((x, i) => { assert.notEqual(x.donde, es.d[i].donde); assert.ok(x.valor && x.fuente); });
  en.o.forEach((x, i) => { assert.equal(x.id, es.o[i].id); assert.notEqual(x.texto, es.o[i].texto); });
  assert.ok(enIngles(() => dosisReales().some((x) => x.valor === '600 mSv')), 'el límite real de 600 mSv se mantiene');
});

test('idioma: la tormenta solar, su fuente y el refugio salen en inglés sin cambiar los números', () => {
  const f = { cls: 'X8.7', date: '2024-05-14', source: 'archivo' };
  assert.match(sourceText(f), /Llamarada REAL archivada/);
  const s = G.newGame('estacion', 5); const esDosis = Sys.startStorm(s).dose;
  const en = enIngles(() => { const t = G.newGame('estacion', 5); const dosis = Sys.startStorm(t).dose; return { dosis, log: t.log.map((l) => l.text).join(' | '), src: sourceText(f), cls: classText('X1'), why: SHELTER.luna.why, sys: Sys.SYS.vida.name, sala: G.roomName(t, 'dorm') }; });
  assert.equal(en.dosis, esDosis, 'el idioma no cambia las reglas');
  assert.match(en.log, /SOLAR STORM 1 of 3/); assert.match(en.log, /The particles arrive in/); assert.match(en.src, /REAL archived solar flare from NASA DONKI: class X8\.7/);
  assert.equal(en.cls, 'X is the strongest class'); assert.match(en.why, /thick walls/); assert.equal(en.sys, 'LIFE SUPPORT'); assert.equal(en.sala, 'Dormitories');
  assert.equal(Sys.SYS.vida.name, 'SOPORTE VITAL', 'vuelve a español');
});

test('idioma: el resumen del final (qué pasó / qué aprender / estrellas) sale en inglés', () => {
  const s = G.newGame('luna', 3); G.rescue(s);
  const es = UI.resumenFin(s);
  const en = enIngles(() => { const t = G.newGame('luna', 3); G.rescue(t); return { r: UI.resumenFin(t), over: t.over }; });
  assert.equal(es.titulo, 'Rescate: misión cumplida'); assert.equal(en.r.titulo, 'Rescue: mission accomplished');
  assert.match(en.over.text, /The rescue ship arrived and found the base standing/); assert.match(en.r.aprende, /like on a real mission/);
  assert.equal(en.r.estrellas.length, es.estrellas.length); assert.match(en.r.estrellas[0].txt, /reached the rescue alive/);
  assert.match(en.r.datos.map((d) => d.txt).join(' '), /checks? done/);
  assert.equal(enIngles(() => UI.tituloFin('CUSTODIA ganó')), 'CUSTODIA won'); assert.equal(UI.tituloFin('Base perdida'), 'Base perdida');
  const sf = G.newGame('estacion', 2); sf.over = { won: false, title: 'Base perdida', text: 'x', stars: 0 };
  assert.match(enIngles(() => UI.resumenFin(sf).aprende), /INTEGRITY drops/);
});

test('idioma: peligros, objetos, protocolos, horario y tareas de mantenimiento tienen inglés (getters, sin cambiar los puntos de uso)', () => {
  const conGetter = (o, p) => typeof Object.getOwnPropertyDescriptor(o, p)?.get === 'function';
  for (const [k, h] of Object.entries(HAZARDS)) assert.ok(conGetter(h, 'name'), `peligro ${k} sin nombre en inglés`);
  for (const [k, it] of Object.entries(ITEMS)) { assert.ok(conGetter(it, 'name'), `objeto ${k} sin nombre en inglés`); if (it.info) assert.ok(conGetter(it, 'info'), `objeto ${k} sin descripción en inglés`); }
  for (const [k, p] of Object.entries(PROTOCOLS)) { assert.ok(p.titleEn, `protocolo ${k} sin título en inglés`); assert.equal(p.stepsEn?.length, p.steps.length, `protocolo ${k}: mismos pasos en inglés`); }
  const es = { fuego: HAZARDS.fuego.name, cinta: ITEMS.cinta.name }; assert.deepEqual(es, { fuego: 'INCENDIO', cinta: 'Cinta adhesiva' });
  const en = enIngles(() => { const s = G.newGame('luna', 5); const blq = (id) => s.L.schedule.find((b) => b.id === id).name; return { f: HAZARDS.fuego.name, c: ITEMS.cinta.name, i: ITEMS.extintor.info, tr: blq('trabajo'), lista: blq('lista'), t1: Sys.taskName(s, 'vida'), t2: Sys.taskShort(s, 'energia'), te: Sys.taskName(G.newGame('estacion', 5), 'rad') }; });
  assert.deepEqual(en, { f: 'FIRE', c: 'Duct tape', i: 'Puts out a fire.', tr: 'Lunar base maintenance', lista: 'Roll call', t1: 'Swap the CO₂ and dust filters', t2: 'Batteries', te: 'Check the shielding and the dosimeter' });
  const sp = G.newGame('luna', 5); assert.equal(Sys.taskName(sp, 'vida'), 'Cambiar los filtros de CO₂ y de polvo'); assert.equal(sp.L.schedule[0].name, 'Dormir');
  const aviso = enIngles(() => { const s = G.newGame('estacion', 5); G.spawnHazard(s, 'fuego'); return s.log.at(-1).text; }); assert.match(aviso, /FIRE in /);
});

test('idioma: villanos, misiones, notas, finales verdaderos, medallas, emergencias y textos de destino salen en inglés, sin acentos del español', () => {
  const esp = /[áéíóúñ¡¿]/i;
  const dist = [];
  const ver = (nombre, es, en) => { assert.ok(en && !esp.test(en), `${nombre}: sin traducir → ${en}`); dist.push([nombre, es, en]); };
  const es = {}; const en = {};
  const recoge = (dest, f) => { dest.villanos = Object.entries(VILLAINS).map(([k, v]) => `${k}|${v.name}|${v.desc}`); dest.notas = Object.entries(NOTES).flatMap(([l, a]) => a.map(([t, x]) => `${l}|${t}|${x}`)); dest.finales = Object.entries(TRUE_END).map(([k, v]) => `${k}|${v}`); dest.medallas = Object.entries(MEDALS).map(([k, [n, d]]) => `${k}|${n}|${d}`); dest.emerg = Object.entries(Sys.EMERGS).map(([k, e]) => `${k}|${e.name}|${e.verb}|${e.text('Sala')}|${e.fatal[1]}`); dest.misiones = MISSIONS.map((m) => `${m.id}|${m.verb}|${m.text('Laboratorio')}`); dest.destinos = Object.entries(LOCS).flatMap(([k, L]) => [`${k}|${L.ai}|${Object.values(L.labels).join('|')}|${L.aiLines.join('|')}|${L.win.join('|')}|${G.PLAN_IDS.map((p) => L.plan[p].name + '|' + L.plan[p].hint).join('|')}|${L.sysFlavor?.note ?? ''}|${(L.sysFlavor?.events ?? []).map((e) => [e.name, e.hud, e.msg, e.end].join('|')).join('|')}`]); dest.coop = [...Object.values(CMD).map((c) => `${c.name}|${c.help}`), ...Object.values(AVISOS).map((a) => a[0]), ...Object.values(DELAY_NOTE)]; };
  recoge(es, 0); enIngles(() => recoge(en, 1));
  for (const k of Object.keys(es)) {
    assert.equal(en[k].length, es[k].length, `${k}: mismo número de textos`);
    es[k].forEach((e, i) => { ver(`${k}[${i}]`, e, en[k][i].split('|').filter((p) => p).join(' | ')); assert.notEqual(en[k][i], e, `${k}[${i}] igual en los dos idiomas`); });
  }
  assert.equal(es.notas.length, 18); assert.equal(es.villanos.length, 30);
  // las etiquetas de objetos y los títulos de final también
  enIngles(() => { for (const t of ['Final verdadero', 'Base recuperada', 'Regreso silencioso', 'Por los pelos']) assert.ok(!esp.test(UI.tituloFin(t)), t); });
});

test('idioma: jugar en inglés no cambia las reglas (mismo estado, solo cambian los textos)', () => {
  const corre = () => { const s = G.newGame('estacion', 11, 'cadete'); for (let i = 0; i < 4000; i++) G.update(s, 0.1, { dx: i % 40 < 20 ? 1 : -1, dy: i % 70 < 35 ? 0 : 1 }); return { x: +s.p.x.toFixed(3), y: +s.p.y.toFixed(3), min: Math.floor(s.min), day: s.day, alert: Math.round(s.alert), integ: Math.round(s.integ), over: !!s.over, n: s.log.length }; };
  const a = corre(); const b = enIngles(corre);
  assert.deepEqual(b, a);
});

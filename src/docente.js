// Modo clase / panel docente, sin servidor y sin cuentas: cada alumno copia UNA línea con su resultado y el docente pega todas juntas para ver el resumen.
// Nada se envía por internet: la línea solo sale de aquí cuando el alumno la copia. Lógica pura (sin pantalla): formato, lectura segura y resumen. Pruebas: tests/docente.test.js.
import { T } from './i18n.js';

export const VERSION = 'CUSTODIA1';
export const MAX_NOMBRE = 24, MAX_CLASE = 12;
const limpia = (x, n) => String(x ?? '').replace(/[|\u0000-\u001f<>"]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);
export const limpiaNombre = (x) => limpia(x, MAX_NOMBRE);
export const limpiaClase = (x) => limpia(x, MAX_CLASE).toUpperCase();
const num = (v, lo, hi, d = 0) => { const n = Math.round(+v); return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : d; };
const fechaOk = (f) => (/^\d{4}-\d{2}-\d{2}$/.test(f) ? f : '');

/** Una partida terminada como línea de texto: CUSTODIA1|clase|nombre|fecha|destino|nivel|ganó|estrellas|dosis%|sistemas%|preguntaId|acertó(1/0/-). */
export function formatoLinea(d) {
  const q = d.quizId ? (d.quizOk ? '1' : '0') : '-';
  return [VERSION, limpiaClase(d.clase), limpiaNombre(d.nombre), fechaOk(d.fecha) || '', limpia(d.destino, 12).toLowerCase(), limpia(d.nivel, 12).toLowerCase(), d.gano ? 1 : 0, num(d.estrellas, 0, 3), num(d.dosis, 0, 100), num(d.sistemas, 0, 100), limpia(d.quizId, 32), q].join('|');
}

/** Lee una línea con cuidado (puede venir de cualquiera): devuelve la partida o null si no es de CUSTODIA o está rota. */
export function leeLinea(txt) {
  const p = String(txt ?? '').trim().split('|'); if (p[0] !== VERSION || p.length < 12) return null;
  const nombre = limpiaNombre(p[2]); if (!nombre) return null;
  return { clase: limpiaClase(p[1]) || '—', nombre, fecha: fechaOk(p[3]), destino: limpia(p[4], 12), nivel: limpia(p[5], 12), gano: p[6] === '1', estrellas: num(p[7], 0, 3), dosis: num(p[8], 0, 100), sistemas: num(p[9], 0, 100), quizId: limpia(p[10], 32), quiz: p[11] === '1' ? 1 : p[11] === '0' ? 0 : null };
}

/** Pega varias líneas (se aceptan restos de texto alrededor) y quita repetidas. { partidas, invalidas, repetidas }. */
export function leeVarias(texto) {
  const vistas = new Set(); const partidas = []; let invalidas = 0, repetidas = 0;
  for (const linea of String(texto ?? '').split(/\r?\n/)) {
    const i = linea.indexOf(VERSION); if (i < 0) { if (linea.trim()) invalidas++; continue; }
    const crudo = linea.slice(i).trim(); const p = leeLinea(crudo); if (!p) { invalidas++; continue; }
    if (vistas.has(crudo)) { repetidas++; continue; } vistas.add(crudo); partidas.push(p);
  }
  return { partidas, invalidas, repetidas };
}

/**
 * Resumen para el docente. Por alumno: partidas, ganadas, estrellas promedio y aciertos de la pregunta de cierre.
 * Por clase: alumnos, % que ganó, % de aciertos y la pregunta con más errores (la idea que cuesta más). Si no hay datos de preguntas devuelve null en esos campos.
 */
export function resumen(partidas) {
  const porAlumno = new Map(); const porPregunta = new Map(); const porClase = new Map();
  for (const p of partidas) {
    const k = `${p.clase}|${p.nombre}`; const a = porAlumno.get(k) ?? { clase: p.clase, nombre: p.nombre, partidas: 0, ganadas: 0, estrellas: 0, quizTotal: 0, quizOk: 0 };
    a.partidas++; if (p.gano) { a.ganadas++; a.estrellas += p.estrellas; } if (p.quiz !== null) { a.quizTotal++; a.quizOk += p.quiz; } porAlumno.set(k, a);
    if (p.quiz !== null && p.quizId) { const q = porPregunta.get(p.quizId) ?? { id: p.quizId, total: 0, ok: 0 }; q.total++; q.ok += p.quiz; porPregunta.set(p.quizId, q); }
  }
  const alumnos = [...porAlumno.values()].sort((x, y) => x.clase.localeCompare(y.clase) || x.nombre.localeCompare(y.nombre)).map((a) => ({ ...a, estrellasProm: a.ganadas ? Math.round((a.estrellas / a.ganadas) * 10) / 10 : 0, pctQuiz: a.quizTotal ? Math.round((a.quizOk / a.quizTotal) * 100) : null }));
  for (const a of alumnos) { const c = porClase.get(a.clase) ?? { clase: a.clase, alumnos: 0, partidas: 0, ganadas: 0, quizTotal: 0, quizOk: 0 }; c.alumnos++; c.partidas += a.partidas; c.ganadas += a.ganadas; c.quizTotal += a.quizTotal; c.quizOk += a.quizOk; porClase.set(a.clase, c); }
  const clases = [...porClase.values()].map((c) => ({ ...c, pctGanadas: c.partidas ? Math.round((c.ganadas / c.partidas) * 100) : 0, pctQuiz: c.quizTotal ? Math.round((c.quizOk / c.quizTotal) * 100) : null }));
  const preguntas = [...porPregunta.values()].map((q) => ({ ...q, pct: Math.round((q.ok / q.total) * 100) })).sort((x, y) => x.pct - y.pct || y.total - x.total);
  return { alumnos, clases, preguntas, masDificil: preguntas.find((q) => q.pct < 100) ?? null };
}

/** El resumen como CSV (con coma, comillas dobladas) para abrir en Excel o Google Sheets. */
export function aCSV(res) {
  const q = (x) => `"${String(x ?? '').replace(/"/g, '""')}"`;
  const cab = [T('Clase', 'Class'), T('Alumno', 'Student'), T('Partidas', 'Games'), T('Ganadas', 'Won'), T('Estrellas promedio', 'Average stars'), T('Preguntas respondidas', 'Questions answered'), T('% de aciertos', '% correct')];
  return [cab.map(q).join(','), ...res.alumnos.map((a) => [a.clase, a.nombre, a.partidas, a.ganadas, a.estrellasProm, a.quizTotal, a.pctQuiz ?? ''].map(q).join(','))].join('\n');
}

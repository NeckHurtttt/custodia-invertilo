// PREGUNTA DE CIERRE: al terminar cada partida, una pregunta de opción múltiple sobre lo que enseña el juego, con su explicación y su fuente.
// Sirve para medir si se aprendió (la idea central es la primera) y para mostrar evidencia en la entrega. Lógica pura: sin pantalla ni azar propio;
// la pregunta y el orden de las opciones salen de la semilla de la partida (determinista). Todo en español e inglés (ver i18n.js).
import { T } from './i18n.js';

const Q = (id, q, ok, mal1, mal2, expl, fuente) => ({ id, q, ok, mal: [mal1, mal2], expl, fuente });

/** Las preguntas, en el idioma activo. La primera es SIEMPRE la idea central del juego. Cada dato trae su fuente. */
export const PREGUNTAS = () => [
  Q('radiacion-suma',
    T('Estuviste afuera durante una tormenta solar. ¿Qué pasa con la radiación que ya recibiste?', 'You were outside during a solar storm. What happens to the radiation you already received?'),
    T('No se borra: se suma a tu dosis de toda la carrera', 'It does not go away: it adds to your whole-career dose'),
    T('Se borra cuando vuelves a entrar a la base', 'It goes away when you get back inside the base'),
    T('Solo cuenta si te sientes mal ese día', 'It only counts if you feel sick that day'),
    T('La dosis se acumula. Por eso NASA limita la radiación de TODA la carrera de un astronauta a 600 mSv, y por eso vale la pena ir al refugio.', 'The dose accumulates. That is why NASA limits an astronaut\'s WHOLE-career radiation to 600 mSv, and why going to the shelter is worth it.'),
    'NASA-STD-3001, Vol. 1'),
  Q('energia-vida',
    T('¿Por qué cuidar la energía también cuida el soporte vital?', 'Why does taking care of power also take care of life support?'),
    T('Porque sin energía se paran ventiladores y filtros, y los demás sistemas fallan más rápido', 'Because without power fans and filters stop, and the other systems fail faster'),
    T('Porque no tienen ninguna relación', 'Because they have no relationship at all'),
    T('Porque la energía solo sirve para las luces', 'Because power is only for the lights'),
    T('En una base todo depende de la electricidad. En el juego, con poca energía los demás sistemas bajan 1,6 veces más rápido.', 'In a base everything depends on electricity. In the game, with low power the other systems drop 1.6 times faster.'),
    T('Regla del juego, inspirada en cómo funciona una base', 'Game rule, inspired by how a base works')),
  Q('alara',
    T('¿Qué dice el principio ALARA de la NASA?', 'What does NASA\'s ALARA principle say?'),
    T('Tan poca radiación como sea razonable', 'As little radiation as reasonably achievable'),
    T('Hay que salir al espacio cada día', 'You must go out into space every day'),
    T('La radiación no importa si llevas traje', 'Radiation does not matter if you wear a suit'),
    T('Aunque estés por debajo del límite, se busca recibir lo mínimo posible: cada dosis cuenta.', 'Even below the limit, the goal is to receive as little as possible: every dose counts.'),
    'NASA-STD-3001'),
  Q('fuego-iss',
    T('Hay un incendio en la Estación Espacial Internacional. ¿Qué hace la tripulación?', 'There is a fire on the International Space Station. What does the crew do?'),
    T('Se reúne en un lugar seguro y se coordina con Control de Misión', 'It gathers in a safe haven and coordinates with Mission Control'),
    T('Cada uno se esconde en su cama', 'Everyone hides in their bed'),
    T('Espera a que el fuego se apague solo', 'It waits for the fire to go out by itself'),
    T('La respuesta es coordinada y metódica: la tripulación y varios centros de control trabajan juntos, y se entrena con simulacros.', 'The response is coordinated and methodical: the crew and several control centers work together, and it is trained with drills.'),
    'NASA NTRS 20120002562'),
  Q('retraso-marte',
    T('¿Por qué las órdenes de Control tardan en llegar a Marte?', 'Why do orders from Mission Control take so long to reach Mars?'),
    T('Porque Marte está a entre 3 y 22 minutos luz de la Tierra', 'Because Mars is between 3 and 22 light-minutes from Earth'),
    T('Porque Control se duerme', 'Because Mission Control falls asleep'),
    T('Porque el astronauta no escucha', 'Because the astronaut cannot hear'),
    T('La señal viaja a la velocidad de la luz, pero las distancias son enormes. Por eso en Marte hay que anticiparse.', 'The signal travels at the speed of light, but distances are huge. That is why on Mars you have to plan ahead.'),
    T('Distancias Tierra–Marte (NASA); en el juego se acortan a 6 s', 'Earth–Mars distances (NASA); in the game they are shortened to 6 s')),
  Q('dosis-luna',
    T('¿Dónde se midió MÁS radiación por día?', 'Where was MORE radiation measured per day?'),
    T('En la superficie de la Luna (≈ 1,4 mSv por día)', 'On the surface of the Moon (≈ 1.4 mSv per day)'),
    T('En la Estación Espacial (0,2–0,5 mSv por día)', 'On the Space Station (0.2–0.5 mSv per day)'),
    T('En la superficie de Marte (≈ 0,64 mSv por día)', 'On the surface of Mars (≈ 0.64 mSv per day)'),
    T('La Luna no tiene atmósfera ni campo magnético que protejan, así que recibe más.', 'The Moon has no atmosphere or magnetic field to protect it, so it receives more.'),
    "Chang'e-4 LND (Zhang et al., 2020) · Curiosity RAD (Hassler et al., 2014)"),
  Q('refugio-blindaje',
    T('Llega una tormenta solar. ¿Qué te protege mejor?', 'A solar storm is coming. What protects you best?'),
    T('Un refugio con blindaje: paredes gruesas, agua o provisiones alrededor', 'A shelter with shielding: thick walls, water or supplies around you'),
    T('Taparte con una manta', 'Covering yourself with a blanket'),
    T('Cerrar los ojos', 'Closing your eyes'),
    T('Para frenar las partículas hace falta material entre ellas y tú, y hay que avisar a tiempo para llegar al refugio.', 'To slow the particles you need material between them and you, and the crew must be warned in time to reach the shelter.'),
    'NASA-STD-3001 Technical Brief OCHMO-TB-020'),
];

/** Hash de texto → número sin signo (para barajar de forma determinista). */
const hs = (x) => { let h = 2166136261; for (const c of String(x)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
/** Mezcla determinista (misma semilla → mismo orden). */
function mezcla(n, semilla) {
  const a = Array.from({ length: n }, (_, i) => i); let h = semilla >>> 0;
  for (let i = n - 1; i > 0; i--) { h = (Math.imul(h ^ (h >>> 15), 2246822519) + 3266489917) >>> 0; const j = h % (i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
/** Las 3 opciones de una pregunta en orden barajado (según la semilla): [{ t, ok }]. */
export function opciones(q, seed) { const todas = [{ t: q.ok, ok: true }, { t: q.mal[0], ok: false }, { t: q.mal[1], ok: false }]; return mezcla(3, hs(`${q.id}|${seed}`)).map((i) => todas[i]); }

/**
 * Qué pregunta toca. hist = { id: { ok, mal } } (lo guardado en Meta). La primera vez: la idea central. Después: primero las que aún no acertaste,
 * y cuando ya acertaste todas, cualquiera. Siempre depende de la semilla de la partida (determinista).
 */
export function preguntaPara(seed = 0, hist = {}) {
  const qs = PREGUNTAS(); if (!hist[qs[0].id]) return qs[0];
  const pend = qs.filter((q) => !(hist[q.id]?.ok > 0)); const pool = pend.length ? pend : qs;
  return pool[Math.abs(Math.trunc(Number(seed) || 0)) % pool.length];
}
/** Totales para mostrar: aciertos / intentos y cuántas preguntas distintas ya acertaste. */
export function resumen(hist = {}) {
  let ok = 0, mal = 0, dominadas = 0; for (const v of Object.values(hist)) { ok += v.ok ?? 0; mal += v.mal ?? 0; if ((v.ok ?? 0) > 0) dominadas++; }
  return { aciertos: ok, fallos: mal, intentos: ok + mal, dominadas, total: PREGUNTAS().length };
}
/** Texto para copiar y pegar (por ejemplo, para un docente). */
export const textoResultado = (id, acerto, hist) => { const r = resumen(hist); return T(`CUSTODIA · Pregunta de cierre (${id}): ${acerto ? '✔ acertó' : '✘ falló'} · aciertos ${r.aciertos} de ${r.intentos} · preguntas dominadas ${r.dominadas}/${r.total}`, `CUSTODIA · Closing question (${id}): ${acerto ? '✔ correct' : '✘ wrong'} · correct answers ${r.aciertos} of ${r.intentos} · questions mastered ${r.dominadas}/${r.total}`); };

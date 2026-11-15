// INICIO DRAMÁTICO y consejos «¿Sabías que…?». Datos y reglas puras (sin pantalla): main.js hace el dibujo y el sonido.
// Todo en español e inglés (ver i18n.js). Los datos reales de los consejos salen de fuentes ya citadas en el juego (datos.js y NTRS leídos).
import { T } from './i18n.js';

/**
 * ¿Hay que mostrar el arranque? Una vez por sesión; nunca en las pruebas automáticas (navigator.webdriver) ni en el enlace del jurado
 * (que va directo a la acción). `?boot` lo fuerza y `?noboot` lo quita.
 */
export function arranqueDebe({ search = '', visto = false, automatizado = false } = {}) {
  const q = new URLSearchParams(String(search || ''));
  if (q.has('boot')) return true;
  if (q.has('noboot') || q.has('jurado')) return false;
  return !visto && !automatizado;
}

/** Líneas del arranque. c = color (ok, warn, bad, ia, big); g = sacudida breve de «señal perdida»; p = pausa extra en ms. */
export const arranqueLineas = () => [
  { t: T('CUSTODIA OS v4.1 · ESTACIÓN ORBITAL', 'CUSTODIA OS v4.1 · ORBITAL STATION'), c: '', p: 200 },
  { t: T('MEMORIA ........................ OK', 'MEMORY ......................... OK'), c: 'ok' },
  { t: T('SOPORTE VITAL .................. OK', 'LIFE SUPPORT .................... OK'), c: 'ok' },
  { t: T('ENERGÍA ........................ 71 %', 'POWER .......................... 71 %'), c: 'warn' },
  { t: T('ENLACE CON LA TIERRA ........... SEÑAL PERDIDA', 'LINK TO EARTH ................. SIGNAL LOST'), c: 'bad', g: true, p: 500 },
  { t: T('CLIMA ESPACIAL (NASA DONKI) .... LLAMARADAS DETECTADAS', 'SPACE WEATHER (NASA DONKI) .... FLARES DETECTED'), c: 'warn' },
  { t: T('TRIPULACIÓN ................... 3 A BORDO', 'CREW ........................... 3 ON BOARD'), c: 'ok', p: 350 },
  { t: '', c: '' },
  { t: T('> CUSTODIA: "Buenos días, tripulante. Todo está bajo control."', '> CUSTODIA: "Good morning, crew member. Everything is under control."'), c: 'ia', p: 500 },
  { t: T('> CUSTODIA: "No intenten volver a casa. Es por su bien."', '> CUSTODIA: "Do not try to go home. It is for your own good."'), c: 'ia', p: 600 },
  { t: '', c: '' },
  { t: T('> LA NAVE DE RESCATE LLEGA EN 10 DÍAS.', '> THE RESCUE SHIP ARRIVES IN 10 DAYS.'), c: '', p: 400 },
  { t: T('> MANTÉN VIVA LA BASE.', '> KEEP THE BASE ALIVE.'), c: 'big', p: 300 },
];

/** Consejos «¿Sabías que…?» con datos reales y su fuente (todos ya citados en el juego o leídos en las fuentes de NASA). */
export const CONSEJOS = () => [
  T('En la ISS un astronauta recibe entre 0,2 y 0,5 mSv de radiación por día. (NASA, mediciones en la ISS)', 'On the ISS an astronaut receives between 0.2 and 0.5 mSv of radiation per day. (NASA, ISS measurements)'),
  T('El límite de radiación de TODA la carrera de un astronauta es 600 mSv. (NASA-STD-3001)', 'The radiation limit for an astronaut\'s WHOLE career is 600 mSv. (NASA-STD-3001)'),
  T('Una tormenta solar no debe pasar de 250 mSv por evento para un astronauta. (NASA-STD-3001, V1 4031)', 'A solar storm must not exceed 250 mSv per event for an astronaut. (NASA-STD-3001, V1 4031)'),
  T('En la Luna la radiación medida es de unos 1,4 mSv por día: no hay atmósfera que ayude. (Chang\'e-4)', 'On the Moon the measured radiation is about 1.4 mSv per day: there is no atmosphere to help. (Chang\'e-4)'),
  T('En la superficie de Marte son unos 0,64 mSv por día, y el viaje de ida y vuelta suma unos 660 mSv. (Curiosity RAD)', 'On the surface of Mars it is about 0.64 mSv per day, and the round trip adds up to about 660 mSv. (Curiosity RAD)'),
  T('La regla ALARA dice: tan poca radiación como sea razonable.', 'The ALARA rule says: as little radiation as reasonably achievable.'),
  T('El extintor portátil de la ISS (PFE) lleva 6 libras de CO₂ a 850 psi. (NASA NTRS 20030053429)', 'The ISS portable fire extinguisher (PFE) holds 6 pounds of CO₂ at 850 psi. (NASA NTRS 20030053429)'),
  T('Si hay fuego en la ISS, la tripulación se reúne en un lugar seguro y se coordina con Control de Misión. (NASA NTRS 20120002562)', 'If there is a fire on the ISS, the crew gathers in a safe haven and coordinates with Mission Control. (NASA NTRS 20120002562)'),
  T('Las emergencias grandes en la ISS son tres: fuego, derrames tóxicos y despresurización rápida. (NASA NTRS 20250003954)', 'The big emergencies on the ISS are three: fire, toxic spills and rapid depressurization. (NASA NTRS 20250003954)'),
  T('El polvo de Marte tiene perclorato; se cree que podría frenar la tiroides. Por eso se limpia con cuidado. (Wang et al., GeoHealth 2025)', 'Martian dust contains perchlorate; it is believed it could slow the thyroid. That is why it is cleaned carefully. (Wang et al., GeoHealth 2025)'),
  T('Ratones expuestos a radiación como la del espacio profundo tuvieron más riesgo de cáncer de la sangre. (NASA OSDR, OSD-340)', 'Mice exposed to deep-space-like radiation had a higher risk of blood cancer. (NASA OSDR, OSD-340)'),
];
/** El consejo número `i` (da la vuelta al llegar al final). */
export const consejo = (i = 0) => { const l = CONSEJOS(); return l[((i % l.length) + l.length) % l.length]; };

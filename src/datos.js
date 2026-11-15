// DATOS REALES del juego y sus fuentes (pantalla "DATOS NASA" y README). Solo datos: sin DOM ni azar.
// Son funciones (no constantes) para que el texto salga en el idioma activo (español o inglés, ver i18n.js).
import { T } from './i18n.js';

/** La restricción que enseña el juego, en una frase. */
export const restriccion = () => T(
  'Protegerse de la radiación cuesta tiempo y energía hoy; no protegerse suma una dosis que el cuerpo nunca borra. Y la energía es la que mantiene vivo el soporte vital: si se descuida un sistema, los demás caen.',
  'Protecting yourself from radiation costs time and power today; not protecting yourself adds a dose your body never erases. And power is what keeps life support running: if one system is neglected, the others fall.');

/** Dosis de radiación medidas de verdad en cada destino. */
export const dosisReales = () => [
  { donde: T('Estación Espacial (órbita baja)', 'Space Station (low Earth orbit)'), valor: T('0,2–0,5 mSv por día', '0.2–0.5 mSv per day'), fuente: T('NASA, mediciones en la ISS', 'NASA, measurements on the ISS') },
  { donde: T('Superficie de la Luna', 'Moon surface'), valor: T('≈ 1,4 mSv por día', '≈ 1.4 mSv per day'), fuente: "Chang'e-4 LND (Zhang et al., Science Advances, 2020)" },
  { donde: T('Superficie de Marte', 'Mars surface'), valor: T('≈ 0,64 mSv por día', '≈ 0.64 mSv per day'), fuente: 'Curiosity RAD (Hassler et al., Science, 2014)' },
  { donde: T('Viaje a Marte (ida y vuelta)', 'Trip to Mars (round trip)'), valor: '≈ 660 mSv', fuente: 'Curiosity RAD (Zeitlin et al., Science, 2013)' },
  { donde: T('Límite de TODA la carrera de un astronauta', "Limit for an astronaut's WHOLE career"), valor: '600 mSv', fuente: 'NASA-STD-3001, Vol. 1 (2022)' },
];

/** Estudios reales del repositorio OSDR de NASA, resumidos para chicos. */
export const osdr = () => [
  { id: 'OSD-342', texto: T('Ratones que viajaron a la Estación (SpaceX-19) perdieron músculo y hueso; un remedio experimental que bloquea la "miostatina" los protegió.', 'Mice that flew to the Station (SpaceX-19) lost muscle and bone; an experimental treatment that blocks "myostatin" protected them.') },
  { id: 'OSD-417', texto: T('En ratones de la Estación (SpaceX-11) cambiaron las bacterias del intestino, y eso se relaciona con la pérdida de hueso.', 'In mice on the Station (SpaceX-11) the gut bacteria changed, and that is linked to bone loss.') },
  { id: 'OSD-340', texto: T('Ratones expuestos a radiación como la del espacio profundo (simulada en laboratorio) tuvieron más riesgo de cáncer de la sangre: por eso se limita la dosis.', 'Mice exposed to deep-space-like radiation (simulated in a lab) had a higher risk of blood cancer: that is why the dose is limited.') },
  { id: 'OSD-174', texto: T('Pelos de astronautas en la Estación mostraron que vivir meses en un lugar cerrado cambia cómo trabajan algunos genes.', 'Hair from astronauts on the Station showed that living for months in an enclosed place changes how some genes work.') },
];
export const osdUrl = (id) => `https://osdr.nasa.gov/bio/repo/data/studies/${id}`;

/** Qué es escala de juego (para no presentarlo como real). */
export const escala = () => [
  T('El "límite de la misión" del juego es 8 mSv para 10 días: una escala chica para que se note. El límite real es 600 mSv para toda la carrera.', 'The game\'s "mission limit" is 8 mSv for 10 days: a small scale so you can notice it. The real limit is 600 mSv for a whole career.'),
  T('La dosis de cada tormenta del juego crece con la clase real de la llamarada (C, M, X), pero el número exacto es de juego.', 'The dose of each storm in the game grows with the real flare class (C, M, X), but the exact number is a game number.'),
  T('Las IA (CUSTODIA, SELENE, ARES), los drones y el plan de escape son ficción.', 'The AIs (CUSTODIA, SELENE, ARES), the drones and the escape plan are fiction.'),
];

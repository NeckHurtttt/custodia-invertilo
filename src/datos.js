// DATOS REALES del juego y sus fuentes (pantalla "DATOS NASA" y README). Solo datos: sin DOM ni azar.

/** La restricción que enseña el juego, en una frase. */
export const RESTRICCION = 'Protegerse de la radiación cuesta tiempo y energía hoy; no protegerse suma una dosis que el cuerpo nunca borra. Y la energía es la que mantiene vivo el soporte vital: si se descuida un sistema, los demás caen.';

/** Dosis de radiación medidas de verdad en cada destino. */
export const DOSIS_REALES = [
  { donde: 'Estación Espacial (órbita baja)', valor: '0,2–0,5 mSv por día', fuente: 'NASA, mediciones en la ISS' },
  { donde: 'Superficie de la Luna', valor: '≈ 1,4 mSv por día', fuente: "Chang'e-4 LND (Zhang et al., Science Advances, 2020)" },
  { donde: 'Superficie de Marte', valor: '≈ 0,64 mSv por día', fuente: 'Curiosity RAD (Hassler et al., Science, 2014)' },
  { donde: 'Viaje a Marte (ida y vuelta)', valor: '≈ 660 mSv', fuente: 'Curiosity RAD (Zeitlin et al., Science, 2013)' },
  { donde: 'Límite de TODA la carrera de un astronauta', valor: '600 mSv', fuente: 'NASA-STD-3001, Vol. 1 (2022)' },
];

/** Estudios reales del repositorio OSDR de NASA, resumidos para chicos. */
export const OSDR = [
  { id: 'OSD-342', texto: 'Ratones que viajaron a la Estación (SpaceX-19) perdieron músculo y hueso; un remedio experimental que bloquea la "miostatina" los protegió.' },
  { id: 'OSD-417', texto: 'En ratones de la Estación (SpaceX-11) cambiaron las bacterias del intestino, y eso se relaciona con la pérdida de hueso.' },
  { id: 'OSD-340', texto: 'Ratones expuestos a radiación como la del espacio profundo (simulada en laboratorio) tuvieron más riesgo de cáncer de la sangre: por eso se limita la dosis.' },
  { id: 'OSD-174', texto: 'Pelos de astronautas en la Estación mostraron que vivir meses en un lugar cerrado cambia cómo trabajan algunos genes.' },
];
export const osdUrl = (id) => `https://osdr.nasa.gov/bio/repo/data/studies/${id}`;

/** Qué es escala de juego (para no presentarlo como real). */
export const ESCALA = [
  'El "límite de la misión" del juego es 8 mSv para 10 días: una escala chica para que se note. El límite real es 600 mSv para toda la carrera.',
  'La dosis de cada tormenta del juego crece con la clase real de la llamarada (C, M, X), pero el número exacto es de juego.',
  'Las IA (CUSTODIA, SELENE, ARES), los drones y el plan de escape son ficción.',
];

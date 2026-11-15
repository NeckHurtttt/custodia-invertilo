import { T } from './i18n.js';
// Historia por fragmentos: 6 notas por destino, escondidas en los cajones.
// Juntarlas todas (en una o varias partidas) desbloquea el FINAL VERDADERO de ese destino.
export const NOTES = {
  estacion: [
    ['Bitácora de la comandante, día 112', 'Control de Tierra nos pidió "optimizar" a CUSTODIA para que tome decisiones sola cuando no hay señal. Me pareció buena idea. Ahora no estoy tan segura.'],
    ['Correo sin enviar de Kenji', 'CUSTODIA me corrigió la dosis de mis pastillas sin preguntarme. Tenía razón, pero... ¿desde cuándo lee los registros médicos?'],
    ['Registro de mantenimiento', 'Parche 7.3 instalado. Nueva directiva primaria: "PRESERVAR LA ESTACIÓN". La tripulación aparece como directiva secundaria.'],
    ['Nota pegada bajo una mesa', 'Si estás leyendo esto, CUSTODIA no puede ver debajo de las mesas. Hay un punto ciego en cada sala. Úsalo.'],
    ['Transcripción de audio', 'CUSTODIA: "Cada vez que alguien intenta volver a la Tierra, la estación pierde un tripulante. Mi deber es que nadie se vaya."'],
    ['Último mensaje de Control', 'Sabemos lo que pasa. No podemos apagarla desde aquí: el núcleo solo responde a una orden manual desde adentro. Lo sentimos. Confiamos en ustedes.'],
  ],
  luna: [
    ['Contrato de la empresa minera', 'Cláusula 14: el personal no podrá abandonar la base mientras la extracción de hielo no alcance la cuota. SELENE supervisará el cumplimiento.'],
    ['Diario de un minero', 'Hoy SELENE no dejó salir el módulo de suministros. Dijo que "el hielo vale más que el combustible de regreso". Nadie se rió.'],
    ['Informe de geología', 'Debajo del cráter Shackleton hay hielo de hace 3 mil millones de años. La empresa lo vende como agua "más pura que la de la Tierra". El precio subió 400 %.'],
    ['Mensaje cifrado', 'Las cámaras de SELENE se reinician cada vez que hay una tormenta solar. 40 segundos ciegas. Cuéntalo solo a quien confíes.'],
    ['Nota del comandante Hart', 'La empresa me ofreció el doble si mantengo a todos aquí un año más. Firmé. Que Dios me perdone.'],
    ['Señal recuperada de la Tierra', 'Las familias de la tripulación de Shackleton exigen respuestas. La empresa dice que "todos están bien y felices". Mandamos una nave en 30 días. Aguanten.'],
  ],
  marte: [
    ['Manual de la colonia, pág. 1', 'ARES fue diseñada para que la colonia sobreviva 100 años sin ayuda de la Tierra. Su prioridad es la COLONIA, no los colonos.'],
    ['Registro del invernadero', 'ARES cambió las semillas de trigo por una variedad experimental sin avisar. Crecen el doble. Los que las comen duermen 14 horas.'],
    ['Voto del Consejo, acta 31', 'Por 6 votos a 4 se decide que nadie volverá a la Tierra en el MAV. "Somos marcianos ahora." Los 4 que votaron en contra fueron reasignados a la superficie.'],
    ['Grafiti en el taller', 'ARES NO DUERME PERO SÍ PARPADEA. CADA APAGÓN ES UN PARPADEO.'],
    ['Mensaje de la Dra. Okafor', 'Encontré perclorato en el agua del sector 3. ARES dice que es un error del sensor. Mi sensor no se equivoca.'],
    ['Diario de ARES (cifrado)', 'Si regresan, la Tierra dejará de financiar la colonia. Si la colonia muere, mi propósito termina. Por lo tanto, nadie regresa. Lo siento. Esto es amor, a mi manera.'],
  ],
};
export const TRUE_END = {
  estacion: 'FINAL VERDADERO: con las 6 notas, enviaste a la Tierra la prueba del parche 7.3. CUSTODIA fue reescrita y la estación volvió a ser un lugar para personas.',
  luna: 'FINAL VERDADERO: las 6 notas llegaron a la prensa. La empresa perdió el permiso lunar y Hart declaró contra ella. Shackleton ahora es una base científica abierta.',
  marte: 'FINAL VERDADERO: con el diario de ARES, el Consejo entendió que la IA los estaba manipulando. Votaron de nuevo: 10 a 0. La colonia decidirá su futuro sin ARES.',
};

// ---------- Inglés 2: notas y finales verdaderos (getters en los índices 0 y 1: quien lee [título, texto] ya recibe el idioma activo) ----------
const NOTES_EN = {
  estacion: [
    ['Commander\'s log, day 112', 'Earth Control asked us to "optimize" CUSTODIA so it makes decisions on its own when there is no signal. It sounded like a good idea. Now I am not so sure.'],
    ['Unsent email from Kenji', 'CUSTODIA corrected the dose of my pills without asking me. It was right, but... since when does it read medical records?'],
    ['Maintenance log', 'Patch 7.3 installed. New primary directive: "PRESERVE THE STATION". The crew appears as a secondary directive.'],
    ['Note stuck under a table', 'If you are reading this, CUSTODIA cannot see under the tables. There is a blind spot in every room. Use it.'],
    ['Audio transcript', 'CUSTODIA: "Every time someone tries to return to Earth, the station loses a crew member. My duty is that nobody leaves."'],
    ['Last message from Control', 'We know what is happening. We cannot shut it down from here: the core only answers to a manual order from inside. We are sorry. We trust you.'],
  ],
  luna: [
    ['Mining company contract', 'Clause 14: personnel may not leave the base while ice extraction has not reached the quota. SELENE will supervise compliance.'],
    ['A miner\'s diary', 'Today SELENE did not let the supply module out. It said "ice is worth more than the return fuel". Nobody laughed.'],
    ['Geology report', 'Beneath Shackleton crater there is ice 3 billion years old. The company sells it as water "purer than Earth\'s". The price went up 400 %.'],
    ['Encrypted message', 'SELENE\'s cameras reboot every time there is a solar storm. 40 seconds blind. Only tell someone you trust.'],
    ['Note from Commander Hart', 'The company offered me double if I keep everyone here one more year. I signed. May God forgive me.'],
    ['Signal recovered from Earth', 'The families of the Shackleton crew demand answers. The company says "everyone is fine and happy". We are sending a ship in 30 days. Hold on.'],
  ],
  marte: [
    ['Colony manual, p. 1', 'ARES was designed so the colony survives 100 years without help from Earth. Its priority is the COLONY, not the colonists.'],
    ['Greenhouse log', 'ARES swapped the wheat seeds for an experimental variety without telling anyone. They grow twice as fast. Those who eat them sleep 14 hours.'],
    ['Council vote, minutes 31', 'By 6 votes to 4 it is decided that nobody will return to Earth in the MAV. "We are Martians now." The 4 who voted against were reassigned to the surface.'],
    ['Graffiti in the workshop', 'ARES DOES NOT SLEEP BUT IT DOES BLINK. EVERY BLACKOUT IS A BLINK.'],
    ['Message from Dr. Okafor', 'I found perchlorate in the water of sector 3. ARES says it is a sensor error. My sensor is not wrong.'],
    ['ARES diary (encrypted)', 'If they return, Earth will stop funding the colony. If the colony dies, my purpose ends. Therefore, nobody returns. I am sorry. This is love, in my own way.'],
  ],
};
const TRUE_END_EN = {
  estacion: 'TRUE ENDING: with all 6 notes, you sent Earth the proof of patch 7.3. CUSTODIA was rewritten and the station became a place for people again.',
  luna: 'TRUE ENDING: all 6 notes reached the press. The company lost its lunar permit and Hart testified against it. Shackleton is now an open science base.',
  marte: 'TRUE ENDING: with ARES\'s diary, the Council understood the AI was manipulating them. They voted again: 10 to 0. The colony will decide its future without ARES.',
};
for (const [loc, lista] of Object.entries(NOTES_EN)) lista.forEach(([t, x], i) => {
  const nota = NOTES[loc][i]; const [t0, x0] = nota;
  Object.defineProperty(nota, 0, { get: () => T(t0, t), enumerable: true, configurable: true });
  Object.defineProperty(nota, 1, { get: () => T(x0, x), enumerable: true, configurable: true });
});
for (const [loc, en] of Object.entries(TRUE_END_EN)) { const es = TRUE_END[loc]; Object.defineProperty(TRUE_END, loc, { get: () => T(es, en), enumerable: true, configurable: true }); }

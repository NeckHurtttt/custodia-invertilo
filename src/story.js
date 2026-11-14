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

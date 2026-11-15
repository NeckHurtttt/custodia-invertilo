# Revisión técnica e IA progresiva

Revisión del código de `NeckHurtttt/proyecto-Hackaton-2.0`, base `1732dd0`. Alcance: lógica, pruebas y simulaciones; no prueba con niños ni validación visual en navegador.

## Lo que funciona bien

El objetivo de rescate conecta los sistemas de soporte vital, energía, comida y radiación con una misión concreta. Cadete tiene ayudas reales (herramientas y compañeros), no solo menos daño. La separación entre simulación, dibujo, datos y comunicaciones facilita las pruebas: las 145 pruebas originales pasan. La sospecha gradual, las señales antes de atacar y las opciones de movimiento reducido son buenas bases para el público de 7–12 años.

## Mejoras prioritarias

1. **Progresión de vigilancia (implementada aquí).** Antes cambiaba la cantidad de amenazas según el día, pero visión, velocidad y confirmación de sospecha dependían de constantes del nivel. Ahora los drones escalan progresivamente y recuerdan lugares observados. Cadete solo aprende recorridos cuando hay conducta sospechosa; la rutina normal no alimenta su memoria.
2. **Balance y métricas fiables.** `tools/sim.mjs` cuenta todo final sin la palabra «salud» como derrota, incluidos rescates ganados. También usa `Math.random()` para resolver respiración, por lo que no garantiza repetibilidad completa. Conviene separar victorias, derrotas y partidas sin terminar, y usar una semilla independiente para el bot. En Normal el bot de rutina pierde muy pronto: no sirve por sí solo para evaluar la dificultad final del día 10. Hace falta un bot que resuelva peligros y una prueba con jugadores.
3. **Información para Control de Misión.** `coop.snapshot()` incluye sistemas y emergencias de reflejos, pero no transmite `view.storm` ni la llamarada que la provoca. Control debería poder anticipar la tormenta y orientar al astronauta con el retraso del destino.
4. **Ajuste al público Cadete.** La tecla B sigue llamando a `betray()` sin condicionar el nivel. El propio plan del equipo pide ocultar esa acción para niños. El mantenimiento también puede enseñar más con decisiones de dos o tres pasos en lugar de depender solo de esperar junto a un panel.
5. **Mantenimiento del código y presentación.** `core.js` y `main.js` acumulan muchas responsabilidades; extraer módulos pequeños y puros facilita cambios de reglas. El texto de compartir el reto diario en `main.js` aún enlaza al repo Custodia y dice «escapé» incluso cuando se gana por rescate. Hay citas pendientes de verificación en la cola del proyecto: esta revisión no las da por verificadas.

## Reglas nuevas

La progresión de campaña usa `(día − 1) / 9`, limitada a 0–1. En UNA NOCHE usa segundos activos / 420. Cadete aplica un cuarto de la intensidad; Fácil, la mitad; Normal, toda; Terror, 1,35 veces. No cambia daño, dosis, mantenimiento ni número de peligros.

Al final de Normal los drones se mueven 27 % más rápido, ven 22 % más lejos y confirman sospechas en aproximadamente 65 % del tiempo inicial. Mantienen el rastro 7 segundos en lugar de 3. Las cámaras y guardias también confirman sospechas más rápido porque comparten `susTime()`; sus velocidades no cambian.

La IA recuerda hasta 128 lugares por partida, diferenciados por franjas de cuatro horas. Solo usa avistamientos de drones activos, respetando paredes, oscuridad, conos de visión, escondites y conductos. Permanecer quieto no cuenta como repetir una ruta. Tres o más visitas recientes permiten predecir un lugar; los recuerdos pierden 20 % de peso cada minuto activo. Solo memoriza escondites si vio la entrada.

Investiga patrones cada 45 segundos al principio y hasta cada 15 segundos al final de Normal. Como máximo dos drones hacen búsquedas predictivas simultáneas en Normal avanzado; en Cadete solo uno. La búsqueda predictiva expira tras 15 segundos. Emergencias, gracia de captura y huida final tienen prioridad sobre nuevas asignaciones. Las etapas se anuncian en el registro usando los avisos existentes.

La memoria es local, serializable y exclusiva de cada partida. No se entrena un modelo ni se consulta un servicio externo. Las partidas antiguas inicializan la memoria al continuar. Control de Misión no ejecuta esta lógica: la simulación sigue siendo responsabilidad del anfitrión.

## Verificación

- Base: 145 pruebas correctas. Tras el cambio: 151 pruebas correctas; incluye progresión en cuatro niveles, modo Noche, memoria, olvido, carga, IA apagada e integración en los tres destinos.
- Simulaciones Cadete: cuatro semillas por destino, hasta 11 días. Base: 12 rescates de 12. Versión final: 11 rescates y una partida sin final al agotar el límite del simulador; sin muertes. Muestra pequeña: no demuestra balance definitivo ni equivale a una prueba con niños.
- Normal: cuatro partidas por destino; las doce terminan por salud o integridad antes del día 10. El bot no resuelve todos los peligros. Evaluar el final de misión necesita escenarios específicos y juego humano.
- No se modificaron las referencias, datos NASA, interfaz ni protocolos. No se ejecutó E2E de navegador en esta revisión.

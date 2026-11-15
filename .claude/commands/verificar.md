---
description: Verificación completa de CUSTODIA antes de un commit: pruebas, simulador de equilibrio en Cadete, e2e en navegador y e2e cooperativo.
---

Corre, en este orden, y reporta cada resultado con números (no resumas "todo bien" sin mostrarlos):

1. `npm test` — deben pasar todas.
2. `node tools/sim.mjs estacion 4 cadete 11`, luego `luna` y `marte` — en Cadete deben terminar las 4 partidas con "Rescate: misión cumplida"; anota dosis final y capturas por partida.
3. `npm run e2e` — todos los pasos verdes (requiere Playwright: `npm i --no-save playwright` una vez). Mira al menos una captura de `e2e-out/` si se tocó la interfaz.
4. `npm run e2e:coop` — todos los pasos verdes.

Si algo falla, no lo ocultes: di cuál paso falló, el mensaje y qué archivo tocaste. Al final, lista lo que NO pudiste verificar (por ejemplo, el sonido, teléfono real o DONKI en vivo).

---
paths:
  - "src/**/*.js"
  - "tests/**/*.js"
---

# Reglas de CUSTODIA para el código del juego

- **Sin dependencias externas.** HTML + JavaScript puro. No agregar librerías sin acordarlo con el equipo.
- **`src/core.js` y los módulos de reglas son puros:** sin DOM, sin `localStorage`, sin `Math.random` (usar `rand(s)`), estado serializable. El dibujo, el audio y las pantallas viven en `main.js`, `arte.js`, `fx.js`, `music.js`.
- **Texto visible = `T(es, en)`** (`src/i18n.js`). El idioma nunca cambia reglas ni azar. Las frases de personajes usan `voz()` (hash, no gastan azar).
- **Rendimiento por cuadro** (`arte.js`, `fx.js`, bucle de `main.js`): sin asignar objetos ni arrays nuevos en los bucles calientes, sin gradientes nuevos por cuadro, tope de partículas.
- **Público de 7 a 12 años:** sin violencia gráfica, sin sustos fuertes, sin parpadeos de más de 3 por segundo; todo efecto respeta el modo suave (`FX.suave()`).
- **Datos "de la NASA":** fuente anotada junto al dato y verificada; lo inventado se marca como ficción.
- **Toda regla nueva lleva prueba** en `tests/`; después de cambiar: `npm test`; si toca equilibrio, `node tools/sim.mjs`; si toca interfaz o arranque, `npm run e2e`.

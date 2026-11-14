# Comparar nuestra versión con la del equipo

Este repositorio es **solo nuestro**: una copia de la rama `trabajo-claude` de Leo (la que NO se sube al repo del equipo), para poder comparar con calma con lo que está haciendo Sergio en `origin/main`. Nada de aquí toca el repositorio del equipo.

- **Base común:** los dos partimos del commit `f1fcd5e` («Modo Una noche, reto diario, puntos y desbloqueos…»).
- **Estado de esta copia:** 127 pruebas pasan (`npm test`); `npm run e2e` (18 pasos) y `npm run e2e:coop` (21 pasos) pasan con Playwright (`npm i --no-save playwright`).

## Qué tiene nuestra versión (Leo + Claude)
- **Los 4 sistemas del reto** (soporte vital, energía, radiación, comida) como rutina de mantenimiento, en Estación, Luna y Marte, con eventos de escasez propios (noche lunar, tormenta de polvo) y datos reales con fuente (`src/sistemas.js`, `src/locs.js`).
- **Protocolos con honestidad de fuente** (`PROTO_NIVEL` / `PROTO_FUENTE` en `src/common.js`): ISS real, riesgo real, o ficción.
- **Cooperativo por red** (Astronauta + Control de Misión, dos computadoras): `src/coop.js`, `src/link.js`, `src/coopui.js`, `tools/serve.mjs --lan`; retraso de señal por destino, reconexión automática, enlace `?sala=ABCD`, código manual WebRTC.
- **Pantalla limpia:** tope de 3 avisos, nombres de objetos/salas solo cuando hacen falta (tecla N) — `src/avisos.js`.
- **Pulido hecho con Claude Code:** efectos visuales con modo suave (`src/fx.js`), sonido sintetizado (`src/sonido.js`, `src/music.js`), HUD con íconos y versión de teléfono (`src/ui.js`), pantalla final «qué pasó / qué aprender», arte por sala (`src/arte.js`), 8 agentes en `.claude/agents/`.

## Qué tiene la versión de Sergio (según sus mensajes de commit en `origin/main`, 14 nov)
- Academia de cadetes: 12 misiones en 3 fases, lecciones, rangos, habilidades, medallas, evaluaciones antes/después, certificados, panel del profesor, modo instructor, accesibilidad y funcionamiento sin internet (`src/academia*.js`, `src/cadete-data.js`, `instructor.html`, `sw.js`, `docs/guia-docente.md`).
- Cooperativo **local**: 2 jugadores en el mismo teclado, cámara con zoom, levantar al compañero, plan compartido.
- HUD en horizontal (recursos arriba, mochila y plan debajo del mapa), captura animada, ritmo más rápido (reloj +37 %, jugador y drones más rápidos), más salas (ala este en la Estación, fila sur en Luna y Marte).

## Cómo comparar
```bash
git remote add equipo <URL-del-repo-del-equipo>     # solo para LEER; no se hace push
git fetch equipo
git diff --stat equipo/main                          # qué archivos difieren
git diff equipo/main -- src/locs.js                  # un archivo concreto
git log --oneline equipo/main                        # historia de Sergio
```
(El historial de este repo empieza en una sola «foto» de nuestro trabajo, así que usa `git diff` entre árboles, no `git merge`, para comparar.)

## Choques probables al juntar las dos versiones
- `src/main.js`, `src/core.js`, `src/locs.js`, `src/villains.js`, `index.html`, `style.css`: los dos los cambiamos.
- `tests/coop.test.js`: mismo nombre, contenido distinto (el de ellos prueba el cooperativo local; el nuestro, el de red).
- **Dos rediseños de HUD** distintos (el nuestro: `src/ui.js` + paneles flotantes; el suyo: recursos/mochila en horizontal). Hay que elegir uno.
- **Dos cooperativos** distintos y compatibles en idea (mismo teclado vs. dos computadoras), pero en el núcleo: el nuestro asume un solo `s.p`.
- **Equilibrio:** nuestro simulador (`npm run sim`) se calibró con el ritmo anterior; su «ritmo frenético» lo cambia.

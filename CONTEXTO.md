# CONTEXTO · Proyecto Hackaton 2.0 (para retomar en otra compu)

Último estado: **14/11/2026**, NASA Space Apps 2026 (Santa Cruz, Bolivia), equipo **#LosTiraVida**.
Desafío: **Build a Junior Astronaut Mission Trainer** (chicos de 7 a 12 años manejan una base en la Luna o Marte, equilibrando soporte vital, escudo contra la radiación, energía, comida y retraso de la comunicación, con datos reales de NASA).

## 0. Instrucciones para el Claude que retome

**Primero, ubícate (5 minutos):**
1. Lee este archivo entero, y después `CLAUDE.md` (reglas técnicas del juego).
2. Mira la **Bitácora** (sección 8) y el **Siguiente paso** (sección 5): ahí está exactamente dónde quedó el trabajo.
3. Corre `git log --oneline | head -15` y `git status`. Si hay cambios sin subir, pregunta antes de tocarlos.
4. Corre `npm test`. Todo debe pasar antes de empezar.

**Por cada cambio (regla del equipo, la pidió Sergio):**
1. Un cambio a la vez, chico y con propósito claro.
2. Si toca reglas: agrega o ajusta su prueba en `tests/` y corre `npm test`. Si toca el equilibrio: `node tools/sim.mjs <destino> 4 cadete 11` en los 3 destinos. Si toca la interfaz: abre el juego y míralo, y si se puede corre `npm run e2e`.
3. **Actualiza este archivo:** agrega una fila a la Bitácora (sección 8) y reescribe el Siguiente paso (sección 5) para que quien siga sepa qué hacer.
4. `git commit` con un mensaje claro (en español) y **`git push` inmediato**. No juntes varios cambios sin subir.
5. Recién después pasa al siguiente.

**No hagas:**
- Subir nada a otros repos (`NeckHurtttt/Custodia`, `NeckHurtttt/Lifeline`, el de Leo). Este repo es el único para este trabajo.
- Tocar `referencias/`: son copias para consultar.
- Presentar como "dato real de NASA" algo sin fuente verificada. Si es de juego, dilo.
- Romper la esencia del juego (IA misteriosa, drones, notas, finales). El objetivo es **mantener viva la base**; el escape es una ruta extra.
- Agregar dependencias: el juego es HTML + JS sin librerías.

**Cómo hablar con Sergio:** en español, corto y directo; él decide el rumbo. Pregúntale solo lo que de verdad es decisión suya.

## 1. Qué es este repositorio y por qué existe

- Es **Custodia** (antes "LIFELINE: Rutina"), adaptado al desafío. Se armó aparte para no mezclar con el repo del equipo ni con la copia de Leo, y para no perder la referencia.
- **Base:** la versión de Leo (repo `leoaguilerasc-design/Custodia-Leo`, carpeta `custodia-nuestro`, su rama `trabajo-claude`). Está intacta en la etiqueta git **`base-leo`** y copiada en `referencias/custodia-leo/`.
- **Decisión del equipo (opción B):** presentar Custodia en vez de LIFELINE porque es **más amigable y memorable**, corrigiéndolo para que cumpla el desafío **sin perder su esencia** (la IA misteriosa, los drones, la tensión, los finales).
- La otra opción, LIFELINE, está como referencia en `referencias/lifeline/`. Es más rigurosa pero menos divertida. La comparación completa está en `docs/analisis/comparativa-y-prueba.md`.

## 2. Qué se hizo (los 8 puntos obligatorios del plan, todos listos)

| # | Punto | Commit | Qué cambió |
| :--- | :--- | :--- | :--- |
| 1 | **Ganar cuidando la base** | `74019d1` | Al terminar el día 10 llega la **nave de rescate**: ganas si la tripulación vive y la base sigue en pie. Estrellas: llegar; sistemas cuidados (promedio ≥ 70 %); poca radiación (< 50 %) y base sana. La IA ahora **falla** (no es villana pura). El escape queda como **ruta extra** para volver antes. `rescue()` y `rescueStars()` en `src/core.js`. |
| 2 | **Modo Cadete (7-12)** | `c311d88` | Nivel nuevo y **por defecto** en `DIFS` (`src/common.js`). Si nadie resuelve un peligro en 45 s, un compañero lo controla contando su protocolo (`crewFix`). |
| 3+4 | **Clima espacial real y decisión de refugio** | `17456c2` | `src/clima.js`: llamaradas de **NASA DONKI** de los últimos 30 días (api.nasa.gov o el servidor CCMC sin llave); si falla, 3 llamaradas reales archivadas de 2024, y el juego lo dice. **3 tormentas por misión** (días 2, 5 y 8, a las 15:00). Aviso con cuenta atrás. **Refugio** = ~15 % de la dosis, pero se pierde lo que hacías y gasta ENERGÍA; **afuera** = la dosis completa. Tarjeta **"La restricción real"** con las dosis comparadas y el límite real de 600 mSv. Refugios: Estación = Dormitorios (blindaje como en la ISS), Luna = Refugio, Marte = Bodega (como el refugio de Orion). |
| 5 | **Armario de emergencia (Cadete)** | `d8143ac` | En Cadete, E junto a un peligro toma la herramienta y abre su **protocolo real** con fuente. En Normal hay que fabricarla, como antes. |
| 6 | **Pantalla simple (Cadete)** | `eab8460` | Se ocultan fuerza, saber e integridad; fuerza y saber vuelven si abres el PLAN. |
| 7 | **Datos NASA visibles + README** | `9f22a6d` | Botón **DATOS NASA** en el inicio; `src/datos.js`; README para el jurado (tabla de datos, cumplimiento del desafío, resumen en inglés, uso de IA). |
| 8 | **Enlaces para el jurado + revisión** | `f9422b0` | `?cadete` (fija Cadete) y `?jurado` (Estación en Cadete, día 2 a las 14:52, la tormenta real llega en segundos). `.nojekyll` para GitHub Pages. |

**Resultados medidos al cerrar:**
- `npm test`: **145/145** (las 127 de Leo + 18 nuevas).
- `tools/e2e.mjs`: **18/18**. `tools/e2e-coop.mjs`: **21/21**.
- Simulador en Cadete, jugador que cumple la rutina y se refugia: **15 de 15 rescates**. Dosis final: Estación ~35 %, Luna ~61 %, Marte ~53 %.
- Si ignora las tormentas (`STORMDEAF=1`): pierde estrellas, y en la Luna casi siempre supera el límite. Esa diferencia entre destinos es real.
- Fácil, Normal y Terror quedaron como estaban.

## 3. Cómo correrlo

```bash
python3 -m http.server 8000          # luego abrir http://127.0.0.1:8000/?cadete  (o ?jurado)
npm test                             # pruebas de la lógica (node --test tests/)
node tools/sim.mjs estacion 4 cadete 11            # simulador (destino, partidas, nivel, días)
STORMDEAF=1 node tools/sim.mjs luna 4 cadete 11    # el bot ignora las tormentas
DBG=1 node tools/sim.mjs marte 4 cadete 11         # desglose de qué daña
npm i --no-save playwright && npm run e2e          # pruebas en navegador (CHROME_PATH=... si no hay Chrome)
```

## 4. Archivos clave (lo nuevo)

- `src/clima.js`: DONKI, llamaradas archivadas, dosis de la tormenta, refugio por destino.
- `src/sistemas.js`: los 4 sistemas + tormentas (`updateStorm`, `startStorm`, `endStorm`, `shelterOf`, `inShelter`, `setFlares`).
- `src/core.js`: `rescue()`, `rescueStars()`, `crewFix` y `kit` en peligros, `emergency()` cuenta la tormenta.
- `src/datos.js`: datos reales y fuentes (restricción, dosis medidas, OSDR, escala de juego).
- `src/main.js`: cartel y flecha de la tormenta, tarjeta "La restricción real", pantalla DATOS NASA, `?cadete` y `?jurado`, pedido a DONKI al abrir (caché por día en `lfr.flares`; llave propia opcional en `lfr.nasaKey`).
- Pruebas nuevas: `tests/rescate.test.js`, `tests/clima.test.js`, `tests/tormenta.test.js`.
- Reglas del proyecto (de Leo, siguen vigentes): `CLAUDE.md`. Cero dependencias; cada regla con su prueba; azar con semilla `rand(s)`; todo dato de NASA con su fuente.

## 5. Siguiente paso y cola de trabajo

> **SIGUIENTE PASO:** Probar la IA progresiva con jugadores en días 1, 4, 7 y 10 (Normal/Terror), revisar el límite temporal del simulador en Cadete y después retomar C · ocultar "delatar a un compañero" en Cadete. Análisis y límites de validación: `docs/analisis/ia-progresiva.md`.

Cola en orden (marca `[x]` al terminar y sube):
- [x] A · Instrucciones para el Claude que retome + bitácora (este archivo).
- [x] B · **Campo para la llave de api.nasa.gov** en DATOS NASA: se guarda en `lfr.nasaKey`, borra la caché `lfr.flares` y vuelve a pedir DONKI (`pedirDonki()` en `src/main.js`). Si NASA no responde, lo dice y sigue con las archivadas.
- [ ] C · **Ocultar "delatar a un compañero" en Cadete** (público de 7-12). Tecla B en `src/main.js` y `betray()` en `src/core.js`; también el texto "[B] delatar".
- [ ] D · **Verificar 3 citas de Leo** y corregir o marcar como no verificadas: NTRS 20250003954 (despresurización, `PROTO_FUENTE.fuga`), "GeoHealth 2025, Wang et al." (`PROTO_FUENTE.perclorato`) y "250 mSv por evento" (`src/sistemas.js`, `EMERGS.llamarada.fatal`).
- [ ] E · **Adaptar la entrega de Space Apps a Custodia**: nuevo `docs/entrega-space-apps.md` en inglés (nombre, resumen, enlaces, datos NASA, uso de IA, guion de 30 s, 7 diapositivas) y la descripción del equipo. Faltan los nombres del equipo: pedírselos a Sergio.
- [ ] F · **El mantenimiento como mini-protocolo** de 2 o 3 pasos en orden (hoy es "E y esperar 3 s"). Sin romper el bot del simulador ni `npm run e2e`.
- [ ] G · **Control de Misión (cooperativo) ve la llamarada real** y puede avisar al astronauta (con el retraso del destino).
- [ ] H · **Inglés** en lo que ve el jurado: inicio, intro, tormenta, tarjeta de restricción, DATOS NASA y resumen final.
- [ ] I · **Reto diario con la llamarada del día.**
- [ ] J · (opcional) Traer la academia de la versión de Sergio (repo `NeckHurtttt/Custodia`) como tutorial.

Lo que hace Sergio (no Claude):
- Sacar la llave gratis en https://api.nasa.gov (con su correo) y pegarla en el inicio → DATOS NASA → "Llave de api.nasa.gov" → USAR LLAVE (en cada compu/navegador donde se juegue o presente).
- Probar con 1 o 2 niños (guía: `docs/analisis/2026-11-14-lifeline-prueba-con-ninos.md`; cambiar "refugio o ciencia" por "refugio o seguir").
- Pegar la descripción del equipo en la web de Space Apps y hacer la entrega.

### Publicar en GitHub (ya hecho; por si hay que repetirlo en otro lado)
```bash
gh repo create proyecto-Hackaton-2.0 --public --source . --remote origin --push
git push origin base-leo
gh api repos/NeckHurtttt/proyecto-Hackaton-2.0/pages -X POST -f "source[branch]=main" -f "source[path]=/"
```

## 6. Los proyectos de referencia

| Proyecto | Dónde | Qué aporta |
| :--- | :--- | :--- |
| **Custodia de Leo** (base) | `referencias/custodia-leo/` · etiqueta `base-leo` · repo `leoaguilerasc-design/Custodia-Leo` | Los 4 sistemas como rutina, protocolos con etiqueta de honestidad (`PROTO_NIVEL` y `PROTO_FUENTE`), cooperativo en red con retraso. Sus reglas originales: `referencias/custodia-leo/CLAUDE-de-leo.md`. |
| **LIFELINE completo** | `referencias/lifeline/` (código fuente; sin las versiones armadas) · repo `NeckHurtttt/Lifeline` (commit `c7aa7e3`) · https://neckhurtttt.github.io/Lifeline/ | De ahí vino la lógica de DONKI y los estudios OSDR. Tiene Academia (14 pruebas), Arcade, Centro de cadetes, modo niños de 3 recursos, inglés. Para armarlo: `node scripts/empaquetar.mjs` (usa esbuild por npx). |
| **Custodia del equipo** (versión de Sergio) | repo `NeckHurtttt/Custodia` (no copiado aquí) | Academia de cadetes (12 misiones), panel del profesor, cooperativo en el mismo teclado, más salas. Se separó de la de Leo en el commit `f1fcd5e`. |

## 7. Notas del análisis (resumen)

- **Prueba a fondo de la base de Leo (antes de cambiarla):**
  - Los 3 mapas se completan, sin errores.
  - Pero en Normal, quien solo cumple la rutina perdía entre los días 2 y 5, y en Fácil también.
  - Se ganaba escapando, no cuidando la base.
  - Los protocolos reales solo aparecían si habías fabricado la herramienta.
  - No había DONKI ni OSDR.
  - Esos 5 problemas son lo que corrigieron los puntos 1 a 7.
- **Lo que no hay que perder:** la esencia de Custodia (misterio de la IA, drones, notas ocultas, rutas, finales). El villano complica la misión, pero **la misión es mantener viva la base**.
- Detalle completo: `docs/analisis/comparativa-y-prueba.md`.

## 8. Bitácora (una fila por cambio subido)

| Fecha | Commit | Cambio | Siguiente |
| :--- | :--- | :--- | :--- |
| 14/11 | (este cambio) | IA progresiva: visión, velocidad, reacción y persistencia por avance y nivel; memoria local de recorridos observados y escondites; 151 pruebas correctas y simulaciones Cadete/Normal en tres destinos. Análisis: `docs/analisis/ia-progresiva.md`. | Validar balance con jugadores y métricas del simulador; retomar C |
| 14/11 | `630b97a` | Base: copia de la versión de Leo (etiqueta `base-leo`) | — |
| 14/11 | `74019d1`…`f9422b0` | Los 8 puntos (rescate, Cadete, tormentas DONKI, armario, pantalla simple, DATOS NASA, enlaces del jurado) | — |
| 14/11 | `b7c3663`, `3cd072f` | CONTEXTO, referencias, análisis; publicado en GitHub y Pages | — |
| 14/11 | (este commit) | A · Instrucciones para el Claude que retome y cola de trabajo | B |
| 14/11 | (este commit) | B · Campo para la llave de api.nasa.gov en DATOS NASA (probado con llave falsa: avisa y sigue con archivadas); e2e 18/18 | C |

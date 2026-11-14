# CONTEXTO · Proyecto Hackaton 2.0 (para retomar en otra compu)

Último estado: **14/11/2026**, NASA Space Apps 2026 (Santa Cruz, Bolivia), equipo **#LosTiraVida**.
Desafío: **Build a Junior Astronaut Mission Trainer** (chicos de 7 a 12 años manejan una base en la Luna o Marte, equilibrando soporte vital, escudo contra la radiación, energía, comida y retraso de la comunicación, con datos reales de NASA).

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

## 5. Lo que falta (en orden sugerido)

1. ~~Publicar~~ **Hecho (14/11):** repo https://github.com/NeckHurtttt/proyecto-Hackaton-2.0 · jugar https://neckhurtttt.github.io/proyecto-Hackaton-2.0/?cadete · jurado https://neckhurtttt.github.io/proyecto-Hackaton-2.0/?jurado (probado: entra en Cadete y llega la tormenta).
2. **Llave propia de api.nasa.gov** (gratis, con correo). La de prueba `DEMO_KEY` se agota y entonces salen las llamaradas archivadas. Hoy se guarda en `localStorage` `lfr.nasaKey`; no hay campo en pantalla todavía.
3. **Probar con 1 o 2 niños:** guía en `docs/analisis/2026-11-14-lifeline-prueba-con-ninos.md` (está hecha para LIFELINE; sirve cambiando "refugio o ciencia" por "refugio o seguir").
4. **Entrega en Space Apps:** el borrador de `docs/analisis/2026-11-14-lifeline-entrega-space-apps.md` es de LIFELINE. Hay que adaptarlo a Custodia (nombre, resumen, enlaces) y agregar los nombres del equipo. También hay que cambiar la descripción del equipo en la web de Space Apps (`docs/analisis/2026-11-14-lifeline-descripcion-equipo.md`).
5. **Opcionales** (si hay tiempo):
   - el mantenimiento como mini-protocolo de 2 o 3 pasos;
   - Control de Misión (cooperativo) que vea la llamarada real y avise con retraso;
   - traer la academia de la versión de Sergio (repo del equipo `NeckHurtttt/Custodia`) como tutorial;
   - inglés en lo que ve el jurado;
   - reto diario con la llamarada del día.
6. **Revisar 3 citas de Leo sin verificar:** NTRS 20250003954 (despresurización), "GeoHealth 2025, Wang et al." (perclorato) y "250 mSv por evento" (`src/sistemas.js`, emergencia `llamarada`). Lo que NASA tiene es un límite de 30 días para la médula ósea.
7. Pensar si **"delatar a un compañero"** debería ocultarse en Cadete (público de 7-12).

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

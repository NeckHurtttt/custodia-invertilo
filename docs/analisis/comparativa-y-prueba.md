# Análisis: LIFELINE vs. Custodia (versión de Leo) para el desafío

Hecho el 14/11/2026 antes de decidir. Las notas son juicio propio, sin pruebas con niños reales.

## Comparativa por aspectos (1 a 5)

| Aspecto | LIFELINE completo | Custodia (Leo) |
| :--- | :--- | :--- |
| Esencia / identidad | 3: buena idea ("Control de Misión con el Sol real") pero diluida en muchas funciones | **5**: "una IA tomó la base y tienes que volver" se entiende en una frase |
| Diversión momento a momento | 3: gestión por turnos; picos en emergencias y Arcade | **4**: controlas al astronauta, sigilo, fabricación, escape |
| Frustración | **4**: modo niños accesible | 2: cumplir la rutina no alcanzaba ni en Fácil |
| Diseño visual | 3,5: consola verde coherente, mucho texto | **4**: arte por sala, luces, muy pulido; interfaz densa |
| Cumple el objetivo del desafío | **5**: base, 5 recursos, decisiones con costo, 7-12 | 3: 4 sistemas como rutina, pero el objetivo era escapar; 10-14 años |
| Rigor de datos | **5**: DONKI, OSDR, 600 mSv, Curiosity RAD | 3,5: datos citados y fijos; etiquetas de honestidad de protocolos ejemplares |
| Rejugabilidad | 4 | **5**: rutas, finales, notas ocultas |
| Pitch | convence a un jurado técnico | engancha a cualquiera |

**Decisión del equipo:** opción B, presentar Custodia corregida para el desafío, porque es más amigable y memorable.

## Prueba a fondo de la versión de Leo (antes de los cambios)

1. **Simulador de Leo** (jugador que solo cumple la rutina): perdía entre el día 2 y el 5 en los 3 mapas, incluso en Fácil (base perdida o evacuación médica). Sin peligros aguantaba los 10 días y perdía igual ("la IA ganó"), porque se ganaba solo escapando.
2. **Bot que hace todas las acciones reales** (sin peligros ni vigilancia, teletransportándose): los 3 mapas se completan (Estación día 2, Luna día 5, Marte día 3), sin errores de código.
3. **Navegador:** el protocolo de incendio muestra "Basado en procedimientos reales de la ISS (muy simplificado)" y su fuente NTRS. El resumen final "qué pasó / qué aprender" es bueno. Las emergencias de reflejos venían apagadas por defecto.
4. **¿Entrenaba?** El mantenimiento de los 4 sistemas sí (pero era "apretar E y esperar"). Los protocolos reales solo aparecían con la herramienta ya fabricada. No había DONKI ni OSDR. La mayor parte del tiempo se iba en sigilo, fabricación y escape.

## Qué se corrigió (ver CONTEXTO.md)
Ganar con el rescate cuidando la base · modo Cadete · tormentas solares reales con decisión de refugio · armario de emergencia · pantalla simple · datos NASA visibles · enlaces para el jurado.

## Protocolos de LIFELINE corregidos con fuentes (para comparar)
- **Fuego:** alarma (la ventilación se apaga sola) → máscaras → cortar electricidad → extintor de CO₂ → medir el aire antes de quitarse las máscaras. Fuentes: ESA (simulacro de incendio), NASA NTRS 20030053429.
- **Amoníaco** (como la falsa alarma de 2015): alarma → máscaras → segmento ruso → cerrar la escotilla → volver con el aire limpio. Fuente: blog de NASA del 14/01/2015.
- **Fuga lenta** (como la de 2020 en Zvezda): juntarse → cerrar escotillas → ver qué módulo pierde presión → detector → parche. Fuente: blog de NASA de agosto de 2020.
- Marco general: NASA NTRS 20220019247 (3 emergencias graves: fuego, despresurización y aire tóxico).

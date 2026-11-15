# CUSTODIA · Mantén viva la base

> **NASA Space Apps 2026 · desafío _Build a Junior Astronaut Mission Trainer_** · equipo **#LosTiraVida** (Santa Cruz, Bolivia)

**Jugar (modo Cadete, 7-12 años):** https://neckhurtttt.github.io/proyecto-Hackaton-2.0/?cadete
**Play in English:** https://neckhurtttt.github.io/proyecto-Hackaton-2.0/?cadete&lang=en (also the ES/EN switch on the title screen; the choice is remembered)
· sin descarga ni cuenta, en el navegador de la compu, tablet o celular.

Eres un astronauta en una base de la **Estación Espacial, la Luna o Marte**. La IA que controla la base **está fallando** y la nave de rescate llega en **10 días**. Para volver a casa hay que **mantener viva la base**: hacer cada mañana el mantenimiento de **soporte vital, energía, radiación y comida**, resolver emergencias con **protocolos reales de la ISS** y decidir qué hacer cuando el **Sol real** lanza una llamarada.

## La restricción real que enseña

**Protegerse de la radiación cuesta tiempo y energía hoy; no protegerse suma una dosis que el cuerpo nunca borra.** Y la energía es la que mantiene vivo el soporte vital: si se descuida un sistema, los demás caen.

- **3 tormentas solares por misión** con las **llamaradas reales más fuertes del último mes (NASA DONKI)**. Llega el aviso con cuenta atrás: ¿corres al **refugio** (casi sin dosis, pero pierdes lo que estabas haciendo y el refugio gasta energía) o **sigues** (la dosis se suma y no se borra)?
- Al pasar la tormenta, la tarjeta **"La restricción real"** compara tu dosis con la del refugio y la de afuera, junto al **límite real de NASA (600 mSv en toda la carrera)**.
- **Mantenimiento diario** de 08:00 a 12:00: si te lo saltas, el sistema baja; con poca energía, todos los demás bajan 1,6 veces más rápido.
- **Ganas cuando llega el rescate** con la tripulación viva. Estrellas: sistemas cuidados (≥ 70 %) y poca radiación con la base sana.

## Cómo cumple el desafío

| El desafío pide | En el juego |
| :--- | :--- |
| Chicos de 7 a 12 años | **Modo Cadete** (por defecto): vigilancia lenta, poco daño, armario de emergencia con las herramientas, y si no resuelves un peligro un compañero lo controla contando su protocolo. Con un jugador que solo cumple la rutina, el simulador llega al rescate **12 de 12** veces. |
| Base en la Luna o Marte | Estación (ISS), Luna (Shackleton, polo sur) y Marte (Jezero) |
| Soporte vital, escudo, energía, comida | Los 4 sistemas son la rutina diaria; el blindaje sube o baja la dosis |
| Retraso de la comunicación | Cooperativo Astronauta + Control de Misión: en la Luna y Marte las órdenes llegan con retraso |
| Ninguna decisión gratis | Refugio vs. seguir; mantenimiento vs. avanzar el plan; cada recurso afecta a los otros |
| Datos reales de NASA | DONKI (en vivo o archivado, y lo dice), estudios de OSDR, dosis medidas por Curiosity RAD y Chang'e-4, límite NASA-STD-3001 |
| Fuentes dentro del juego | Botón **DATOS NASA** en el inicio; cada protocolo dice si es real, riesgo real o ficción |
| Rejugable | 3 destinos, llamaradas distintas, villanos al azar, rutas, notas y finales secretos, reto diario |

## Datos de NASA usados (y por qué)

| Dato | Dónde se usa | Por qué |
| :--- | :--- | :--- |
| **NASA DONKI** — llamaradas solares de los últimos 30 días (api.nasa.gov o el servidor CCMC) | Las 3 tormentas solares de cada misión | Que el riesgo de radiación venga del Sol real. Sin internet se usan 3 llamaradas reales archivadas (X8.7 del 14/05/2024, X9.0 del 03/10/2024 y X7.1 del 01/10/2024) y el juego avisa que no es en vivo. |
| **Límite de carrera NASA: 600 mSv** (NASA-STD-3001, Vol. 1) | Tarjeta de la tormenta y pantalla DATOS | Es la regla real con la que NASA decide cuánta radiación puede recibir un astronauta. |
| **Dosis medidas:** ISS 0,2–0,5 mSv/día; Luna ≈ 1,4 (Chang'e-4 LND); Marte ≈ 0,64 (Curiosity RAD); viaje a Marte ≈ 660 (RAD) | Ritmo de la radiación en cada destino | Diferencia real entre destinos: en la Luna no hay atmósfera ni campo magnético. |
| **NASA OSDR:** OSD-342, OSD-417, OSD-340, OSD-174 | Pantalla DATOS y tarjeta de la tormenta | Hallazgos reales de salud (hueso, músculo, radiación) que explican por qué se cuida la dosis. La API de OSDR no permite consultas desde otros sitios, así que van como datos citados, con enlace. |
| **Procedimientos de la ISS** (NASA NTRS 20120002562, 20030053429, 20220019247) | Protocolos de incendio, despresurización y amoníaco | Pasos muy simplificados de los procedimientos reales; el minijuego muestra la fuente. |

**Escala de juego (no es dato real):** el "límite de la misión" es 8 mSv para 10 días, para que se note; la dosis exacta de cada tormenta es de juego, aunque crece con la clase real de la llamarada; las IA, los drones y el plan de escape son ficción.

## English summary
**CUSTODIA** is a browser game for kids aged 7–12. You live on a Space Station, Moon or Mars base whose AI is malfunctioning; the rescue ship arrives in 10 days. You win by **keeping the base alive**: daily maintenance of life support, power, radiation shielding and food, ISS-based emergency protocols, and **real solar flares from NASA DONKI** that force a choice — run to the shelter (almost no dose, but lost time and power) or keep working (a dose that never goes away), compared with NASA's real 600 mSv career limit. Real data: NASA DONKI, NASA OSDR studies, Curiosity RAD and Chang'e-4 dose measurements, NASA-STD-3001. Kid mode (Cadet) is the default.

## Créditos y herramientas
- Juego original **LIFELINE: Rutina** de #LosTiraVida; esta versión parte de la rama de Leo (etiqueta `base-leo`).
- HTML + JavaScript sin dependencias; fuente VT323 (OFL). Pruebas con `node --test`; simulador de equilibrio en `tools/sim.mjs`.
- **Uso de IA:** Claude (Anthropic) ayudó a programar y redactar junto al equipo; el equipo decidió el diseño y probó el juego. Los datos vienen de las fuentes citadas, no de la IA.

## Técnica
`src/core.js` es la lógica (sin pantalla) y tiene pruebas: `npm test`. `src/sistemas.js`: los 4 sistemas y las tormentas. `src/clima.js`: DONKI y la dosis de las tormentas. `src/datos.js`: los datos reales y sus fuentes. Para jugar en local: `python3 -m http.server 8000` y abrir http://127.0.0.1:8000/?cadete

Controles: `WASD`/flechas · `E` usar/hablar · `C` fabricar · `Q` inhibidor · `P` pausa. En el teléfono aparecen botones.

## Cooperativo: Astronauta + Control de Misión (2 computadoras)

Uno juega en la base (**Astronauta**) y otro, en otra computadora, es **Control de Misión**: ve los sistemas, el mapa y las alarmas, y ayuda con 4 órdenes (reasignar recursos, abrir una escotilla, marcar un punto y mensajes prefabricados). En Luna y Marte las órdenes llegan con retraso, como en la realidad.

Dos formas de conectarse (en el título: **🤝 COOPERATIVO**):
- **Red local (misma WiFi):** el astronauta abre el juego con `npm run coop` (o `node tools/serve.mjs 8000 --lan`); la terminal lista las direcciones de red (marca la más probable y deja al final las de adaptadores virtuales como WSL o VirtualBox). El astronauta abre la sala y le pasa a Control el **enlace directo** que aparece en pantalla (`http://IP:8000/?sala=ABCD`): al abrirlo, Control entra solo, sin teclear nada.
- **Código manual (sin servidor):** funciona hasta en la versión de GitHub Pages. El astronauta genera una invitación, Control responde con otro código y se lo devuelve. Necesita que ambos navegadores puedan verse (misma red o internet abierto).

**Si la conexión falla**
1. Las dos computadoras deben estar en la misma WiFi (no una en WiFi y otra en datos o VPN).
2. Windows: la primera vez pregunta por el firewall; acepta “Redes privadas”. Si dijiste que no, abre PowerShell como administrador y ejecuta lo que imprime `npm run coop` (`netsh advfirewall firewall add rule …`).
3. Si la terminal muestra varias direcciones, prueba primero la marcada “la más probable”.
4. Redes de escuela o de hotel suelen aislar los equipos entre sí: usa el hotspot del celular o la opción **código manual**.
5. Si se corta un momento, no hace falta hacer nada: los dos lados **reconectan solos** (con el aviso “reconectando…”) y la partida del astronauta sigue.
6. Para jugar por internet sin tocar el router, un túnel como `cloudflared tunnel --url http://localhost:8000` da una dirección `https://…` que se usa igual (el juego cambia solo a `wss://`); no lo hemos probado en el evento.

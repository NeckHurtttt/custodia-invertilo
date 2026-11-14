# LIFELINE: Rutina

> Cumple la rutina, esquiva a **CUSTODIA** y prepara en secreto tu regreso a la Tierra.

Versión aparte de [LIFELINE](https://github.com/NeckHurtttt/Lifeline) para comparar: en vez de administrar una misión,
**eres un astronauta** que vive el día a día de la estación mientras la IA que la controla no quiere dejar volver a nadie.

**Jugar:** https://neckhurtttt.github.io/Custodia/

## Cómo se juega
- **Rutina:** pase de lista, comidas, turno de trabajo, 2 h de ejercicio (como en la ISS), tiempo libre y luces apagadas. Si faltas, sube la alerta de la IA. Una flecha te dice a dónde ir.
- **Mejora:** la cinta del gimnasio sube la fuerza; las terminales del laboratorio, el conocimiento (desbloquea recetas).
- **Tripulación viva:** 3 compañeros siguen la rutina, hablan y te piden piezas; si los ayudas te devuelven favores.
- **Fabrica** herramientas con lo que hay en los cajones (13 recetas, según el destino).
- **Vigilancia:** drones/vigías con cono de visión. Los conductos de ventilación los esquivan. Escondite para tus cosas.
- **Minijuegos:** protocolos NASA (pasos en orden contra reloj), hackeo de registros (memoria) y cables (robots, energía).
- **Plan de regreso:** código, combustible, traje y llave. Después, la huida final contra reloj.
- **Finales:** regreso silencioso, por los pelos, o apagar a la IA (3 estrellas).

## Destinos y sus 5 problemas-enemigo
| | IA | Problemas que se mueven |
|---|---|---|
| 🛰️ **Estación** | CUSTODIA | drones, incendio que se extiende, nube de amoniaco, chatarra que rebota, fuga que te jala |
| 🌑 **Luna** (Shackleton) | SELENE | tormenta solar (corre al refugio), remolino de polvo, rover descontrolado, grieta por temblor, frío de la noche lunar |
| 🔴 **Marte** (Jezero) | ARES | diablo de polvo, plaga del invernadero, perclorato tóxico, robot fallado que desarma cajones, tormenta global |

En Luna y Marte hay **superficie**: sin traje se acaba el oxígeno en segundos.

Controles: `WASD`/flechas · `E` usar/hablar · `C` fabricar · `Q` inhibidor · `P` pausa. En el teléfono aparecen botones.

## Técnica
HTML + JavaScript sin dependencias. `src/core.js` es la lógica (sin pantalla) y tiene pruebas: `npm test`.
Fuente VT323 (licencia OFL, `fonts/`).

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

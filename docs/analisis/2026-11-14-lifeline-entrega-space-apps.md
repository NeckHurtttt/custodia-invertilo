# LIFELINE · Entrega para NASA Space Apps 2026

Desafío: **Build a Junior Astronaut Mission Trainer**. Equipo: **#LosTiraVida** (Santa Cruz, Bolivia).
Integrantes: _(completar con los nombres)_.

Los campos están en inglés porque así los lee el jurado global. Revisar en el formulario de Space Apps qué campos pide este año, y si la demo va como video de 30 s o como 7 diapositivas.

---

## Project name
LIFELINE

## Demo / final project link
- Full version: https://neckhurtttt.github.io/Lifeline/
- Kids version (ages 7–12): https://neckhurtttt.github.io/Lifeline/ninos/
- Judge tour (3 min): https://neckhurtttt.github.io/Lifeline/?jurado
- Code: https://github.com/NeckHurtttt/Lifeline

## High-level summary (≤ 150 words)
LIFELINE is a browser game where kids aged 7–12 run a crew on the Space Station, the Moon or Mars for a simulated year. Its core lesson is one real constraint: **shielding from radiation costs science and power today, but not shielding adds a dose the body never erases** — and power is what keeps life support alive. Three times per mission, the strongest solar flares of the last 30 days from NASA DONKI become a decision: everyone to the shelter, half, or keep working. Then the game shows each astronaut's dose against NASA's real career limit (600 mSv), a real study from NASA OSDR, and how ISS and Orion crews actually do it. Kids see only three resources (life support, power, radiation). It also has a 14-test Astronaut Academy, an Arcade mode, teacher mode, and works offline with no account.

## Detailed description
**What it does.** Players design a spacecraft, launch with a real Go/No-Go countdown, and keep a crew alive for a year: assigning shifts, repairing modules, rationing, and handling emergencies. Every choice has a cost; there is no free option.

**The trade-off we teach.** Radiation shielding vs. science vs. power. The shelter protects (≈ 80% less dose) but nobody works and filters use power; staying out gives science but a permanent dose. A water-wall shield chosen at design time lowers the dose later, so design decisions matter.

**Real data, honestly labeled.**
- NASA DONKI: live flares (last 30 days) → in-game decisions and the mission's solar storm calendar. If offline, real archived flares (X8.7 on 2024-05-14, X9.0 on 2024-10-03, X7.1 on 2024-10-01) are used and the game says it isn't live.
- NASA career radiation limit (600 mSv) as the goal; background dose rates from Curiosity RAD, Chang'e-4 LND and ISS.
- NASA OSDR studies (OSD-342, OSD-417, OSD-340, OSD-174) and NASA Human Research Program findings, linked in the game.
- Site conditions from LRO, Perseverance MEDA, ISS; live ISS position and NASA APOD in the DATA tab.

**For kids and classrooms.** Kids mode with 3 resources and short texts, glossary, large text, color-blind palette, read-aloud, Spanish/English. Teacher mode collects student codes into a class table (no accounts, no servers). Daily challenge, ranks and an Arcade keep them coming back.

**Benefits.** Kids experience the decision logic of a mission, not just facts: they fail, see why, and try another strategy.

## Tools and technology
Plain JavaScript (ES modules), HTML/CSS, Canvas and Web Audio; esbuild to bundle; Node test runner (238 tests). PeerJS/MQTT for online co-op; qrcode-generator for the QR. Hosted on GitHub Pages; installable PWA that works offline.

## NASA data used
NASA DONKI (Space Weather Database), NASA OSDR (Open Science Data Repository), NASA Human Research Program, MSL Curiosity RAD, LRO, Mars 2020 Perseverance MEDA, ISS facts, NASA APOD, Artemis/Orion and CHAPEA public information.

## Space agency partner data
Chang'e-4 Lunar Lander Neutron and Dosimetry (LND) published dose rate (CNSA mission, published results); JAXA hair-follicle study via OSDR (OSD-174).

## Use of AI
Claude (Anthropic) helped write code and texts together with the team; the team made the design decisions and tested the game. OpenAI Codex helped edit the README. All data values come from cited NASA/partner sources, not from AI.

## References
- https://ccmc.gsfc.nasa.gov/tools/DONKI/
- https://osdr.nasa.gov/bio/repo/data/studies/OSD-342 (also OSD-417, OSD-340, OSD-174)
- https://www.nasa.gov/hrp/
- Zeitlin et al., 2013, Science: Measurements of energetic particle radiation in transit to Mars (Curiosity RAD)
- https://science.nasa.gov/mission/lro/ · https://science.nasa.gov/mission/mars-2020-perseverance/
- https://apod.nasa.gov/ · https://wheretheiss.at/

---

## Guion de video de 30 s (si piden video)
1. (0-5 s) Arranque "LIFELINE OS". Voz: "Un año en la Luna. ¿Cuidas a tu tripulación o haces ciencia?"
2. (5-15 s) Ventana CLIMA ESPACIAL REAL: llamarada de NASA DONKI; se elige "Todos al refugio".
3. (15-22 s) "La restricción real": barras de dosis frente a 600 mSv y el estudio OSD-340.
4. (22-27 s) Emergencia relámpago + Arcade.
5. (27-30 s) QR + "LIFELINE · #LosTiraVida · Junior Astronaut Mission Trainer".

## 7 diapositivas (si piden presentación)
1. LIFELINE: entrena como astronauta, decide como Control de Misión.
2. El problema: el contenido para chicos o es muy abstracto o muy técnico (lo dice el desafío).
3. La restricción real: radiación vs. ciencia vs. energía (captura de la ventana de clima).
4. Datos reales de NASA: DONKI, OSDR, límite de 600 mSv, RAD (tabla).
5. Para chicos y escuelas: 3 recursos, academia, modo maestro, sin cuenta.
6. Cómo se rejuega: 3 decisiones por misión, reto diario, Arcade, rangos.
7. Equipo y enlaces (QR).

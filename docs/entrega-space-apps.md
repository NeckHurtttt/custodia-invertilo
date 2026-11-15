# CUSTODIA · NASA Space Apps 2026 submission

Challenge: **Space Mission Design Game** · Team: **#EraConTuto** (Santa Cruz, Bolivia)
Team members: **[NAME 1], [NAME 2], [NAME 3], …** ← _TO COMPLETE: ask Sergio for the names and roles._

> Working notes (delete before submitting):
> - The fields below are in English because the global jury reads them in English. Check which fields the Space Apps form asks for this year, and whether the demo goes as a 30-second video or as 7 slides.
> - **Links:** the game is live at https://custodia-six-phi.vercel.app/ and the code is at https://github.com/invertilo/custodia.
> - **Not claimed on purpose:** we have **not** tested the game with children yet (see `docs/analisis/2026-11-14-lifeline-prueba-con-ninos.md`). Do not write "tested with kids" until it is true.

---

## Project name
CUSTODIA — Keep the base alive

## Demo / final project link
- Play (Cadet mode, ages 7–12): https://custodia-six-phi.vercel.app/?cadete&lang=en (in English; the ES/EN switch is on the title screen and `?cadete` alone starts in Spanish)
- Judge tour (a real solar storm arrives in seconds): https://custodia-six-phi.vercel.app/?jurado
- Code: https://github.com/invertilo/custodia
- No download and no account: it runs in the browser of a computer, tablet or phone.

## High-level summary (≤ 150 words)
CUSTODIA is a free browser game for kids aged 7–12. You are an astronaut on a Space Station, Moon or Mars base whose AI is malfunctioning, and a rescue ship arrives in 10 days. To win, keep the base alive: every morning do the maintenance of life support, power, radiation shielding and food; solve emergencies with simplified real ISS protocols; and decide what to do when a real solar flare from NASA DONKI hits. The core lesson is one real trade-off: going to the shelter costs time and power now, but staying outside adds a radiation dose the body never erases, and power is what keeps life support running. The game then compares your dose with NASA's real 600 mSv career limit. An optional two-computer co-op adds a Mission Control player, whose orders arrive with the real communication delay on the Moon and Mars.

## Detailed description
**What it does.** The player walks around a base, follows the daily routine, and keeps four systems alive: life support, power, radiation shielding and food. Skipping maintenance to do something else makes the base worse; low power makes every other system fail faster. A malfunctioning AI (CUSTODIA, SELENE or ARES), drones and hazards add tension, but the goal is to reach day 10 with the crew alive and the base standing. Escaping early is an optional extra route.

**The trade-off we teach.** Three times per mission, a solar storm built from the strongest flares of the last 30 days (NASA DONKI) warns the player with a countdown. Run to the shelter (about 15% of the dose, but you lose what you were doing and the shelter uses power), or keep going (the full dose, and it never goes away)? After each storm, a card called "The real constraint" compares the dose at the shelter and outside, next to NASA's real career limit. No option is free.

**Real data, honestly labeled.** Every protocol says whether it is based on a real ISS procedure (very simplified), a real hazard with game steps, or fiction. A DATA NASA screen in the title lists each source. Game-scale numbers (an 8 mSv "mission limit" for 10 days, the exact dose of each storm) are labeled as game scale, and the AIs, drones and escape plan are labeled as fiction.

**For kids.** Cadet mode is the default: slow, forgiving guards, little damage, an emergency cabinet with the right tool, a simplified screen (health, energy, alert and the four systems), and a crewmate who takes over a hazard if the player does not solve it in time. Texts are short and in Spanish; no graphic violence, no loud scares by default, and a "soft effects" switch removes camera shake and flashes.

**Mission Control co-op (optional).** One player is the astronaut and a second one, on another computer, is Mission Control: sees the systems, the map and the alarms, and can only send four orders (reassign resources, open an unlocked hatch, mark a point, send a prepared message). On the Moon and Mars the orders arrive with a delay. It works on the same Wi-Fi or by copying codes by hand.

**Measuring learning.** Every game ends with a closing question (with explanation and source) about what the game teaches; the first one is always the core idea that radiation received outside the shelter is never erased. Results are kept in the player's browser and can be copied, so teachers can see how many students get it right.

**Benefit.** Kids practice the decision logic of a mission, not only facts: they see why a system failed, what it cost, and try another strategy.

## Tools and technology
Plain JavaScript (ES modules), HTML/CSS, Canvas 2D and Web Audio (all sounds are synthesized, no audio files). Zero external dependencies. Game logic is deterministic and has no screen code, covered by 146 automated tests (Node test runner) plus 18 end-to-end browser steps (Playwright) and a balance simulator. Hosted on GitHub Pages.

## NASA data used
- **NASA DONKI** (CCMC Space Weather Database): solar flares of the last 30 days, via api.nasa.gov or the CCMC server. If it cannot be reached, three real archived flares are used (X8.7 on 2024-05-14, X9.0 on 2024-10-03, X7.1 on 2024-10-01) and the game says it is not live.
- **NASA-STD-3001** (Vol. 1): career limit of 600 mSv and the limit of 250 mSv per solar particle event (requirement V1 4031).
- **Measured dose rates:** ISS 0.2–0.5 mSv/day; Mars surface ≈ 0.64 mSv/day and Mars round trip ≈ 660 mSv (Curiosity RAD).
- **NASA OSDR** studies OSD-342, OSD-417, OSD-340 and OSD-174, as cited summaries with links.
- **NASA Technical Reports Server:** NTRS 20030053429 (ISS fire detection and suppression: PFE extinguisher and PBA breathing apparatus), 20120002562 (how ISS fire response is trained), 20220019247 (evolution of ISS emergency response actions) and 20250003954 (ISS ECLSS emergency operations) for the simplified ISS emergency protocols (fire, depressurization, toxic atmosphere). We read the full text of 20030053429 and 20120002562 for the fire steps; for the other two we checked the record title and abstract.

## Space agency partner data
Chang'e-4 Lunar Lander Neutrons and Dosimetry (LND) published Moon surface dose (≈ 1.4 mSv/day; CNSA mission, Zhang et al., Science Advances, 2020). JAXA hair-follicle study via OSDR (OSD-174).

## Use of AI
Claude (Anthropic) helped write code, tests and texts together with the team, and helped review the interface, sound and enemy behavior. The team decided the design, chose the challenge and tested the game. Every data value comes from the cited NASA and partner sources; claims that could not be verified are labeled as such in the game.

## References
- https://ccmc.gsfc.nasa.gov/tools/DONKI/ and https://api.nasa.gov
- NASA-STD-3001 Technical Brief OCHMO-TB-020 (radiation protection): https://www.nasa.gov/wp-content/uploads/2023/03/radiation-protection-technical-brief-ochmo.pdf
- https://osdr.nasa.gov/bio/repo/data/studies/OSD-342 (also OSD-417, OSD-340, OSD-174)
- NTRS 20250003954 (Chen, Walker, Williams, 2025): https://ntrs.nasa.gov/citations/20250003954
- Zeitlin et al., 2013, Science, and Hassler et al., 2014, Science (Curiosity RAD)
- Zhang et al., 2020, Science Advances (Chang'e-4 LND)
- Wang et al., 2025, GeoHealth, doi:10.1029/2024GH001213 (Martian dust hazards, including perchlorate)

---

## 30-second video script
1. **(0–5 s)** Title screen, three destination cards. Voice: "A base is failing. Rescue arrives in ten days. Can you keep it alive?"
2. **(5–12 s)** Morning maintenance: the four bars (life support, power, radiation, food) and the player fixing a panel.
3. **(12–21 s)** Real solar storm alert with countdown from NASA DONKI. The player chooses: shelter or keep working.
4. **(21–27 s)** Card "The real constraint": shelter dose vs. outside dose vs. NASA's 600 mSv limit.
5. **(27–30 s)** Rescue ship arrives, stars. Text: "CUSTODIA · #EraConTuto · Space Mission Design Game" + link/QR.

## 7 slides
1. **CUSTODIA:** keep the base alive until rescue (title, one screenshot).
2. **The problem:** space-radiation content for kids is either abstract or too technical; kids need to feel the trade-offs.
3. **The real constraint:** shelter vs. keep working (screenshot of the storm alert and the constraint card).
4. **Four systems = the daily routine:** life support, power, radiation, food; skipping maintenance makes the others fall.
5. **Real NASA data:** DONKI flares, 600 mSv and 250 mSv limits, measured doses, OSDR studies (table), and how we label what is real, simplified or fiction.
6. **Made for 7–12:** Cadet mode, simple screen, safe sound and effects, Mission Control co-op with communication delay.
7. **Team and links:** names, play link, code link, use of AI, QR.

---

## Descripción del equipo (para la página del equipo en Space Apps)
**ES:** Somos #EraConTuto, de Santa Cruz, Bolivia. Hacemos CUSTODIA, un entrenador de astronautas para chicos de 7 a 12 años: mantienes viva una base en la Estación, la Luna o Marte, y decides con datos reales de NASA (tormentas solares de DONKI, límites de radiación de NASA-STD-3001, estudios de OSDR) si te refugias o sigues trabajando. Ninguna opción es gratis.

**EN:** We are #EraConTuto from Santa Cruz, Bolivia. We make CUSTODIA, a junior astronaut mission trainer for kids aged 7–12: you keep a Space Station, Moon or Mars base alive and use real NASA data (DONKI solar storms, NASA-STD-3001 radiation limits, OSDR studies) to decide whether to shelter or keep working. No choice is free.

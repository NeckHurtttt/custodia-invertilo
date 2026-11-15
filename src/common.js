// Datos compartidos por todos los destinos: piezas, recetas, protocolos NASA y problemas-enemigo.

export const ITEMS = {
  cinta: { name: 'Cinta adhesiva', g: 'cinta' },
  tela: { name: 'Tela de Nomex', g: 'tela' },
  tornillos: { name: 'Tornillos', g: 'tornillos' },
  placa: { name: 'Placa de aluminio', g: 'placa' },
  cable: { name: 'Cable', g: 'cable' },
  tubo: { name: 'Tubo', g: 'tubo' },
  chip: { name: 'Chip', g: 'chip' },
  bateria: { name: 'Batería', g: 'bateria', info: 'Repone la energía de un módulo congelado.' },
  filtro: { name: 'Filtro de carbón', g: 'filtro' },
  sellador: { name: 'Sellador', g: 'sellador' },
  cartucho: { name: 'Cartucho de CO₂', g: 'cartucho' },
  destornillador: { name: 'Destornillador', g: 'destornillador', tool: true, info: 'Abre rejillas de conductos y desarma robots inhibidos.' },
  amarra: { name: 'Amarra', g: 'amarra', tool: true, info: 'Sujeta la chatarra suelta.' },
  parche: { name: 'Parche de fugas', g: 'parche', tool: true, info: 'Sella fugas y repara trajes.' },
  extintor: { name: 'Extintor (PFE)', g: 'extintor', tool: true, info: 'Apaga un incendio.' },
  mascara: { name: 'Máscara (PBA)', g: 'mascara', tool: true, info: 'Te protege del amoniaco y del humo.' },
  aspiradora: { name: 'Aspiradora HEPA', g: 'aspiradora', tool: true, info: 'Atrapa el polvo lunar.' },
  resina: { name: 'Resina de sellado', g: 'resina', tool: true, info: 'Cierra grietas del piso.' },
  fungicida: { name: 'Fungicida', g: 'fungicida', tool: true, info: 'Frena la plaga del invernadero.' },
  kit: { name: 'Kit de limpieza', g: 'kit', tool: true, info: 'Limpia el perclorato tóxico.' },
  inhibidor: { name: 'Inhibidor', g: 'inhibidor', tool: true, info: 'Apaga un dron o un robot 20 s (tecla Q cerca).' },
  tarjeta: { name: 'Tarjeta clonada', g: 'tarjeta', tool: true, info: 'Abre las escotillas con tarjeta (IA y esclusa).' },
  llave: { name: 'Llave de desacople', g: 'llave', tool: true, plan: true, info: 'Para la consola del regreso.' },
  traje_roto: { name: 'Traje roto', g: 'traje_roto', tool: true, info: 'Repáralo con un parche.' },
  traje: { name: 'Traje de presión', g: 'traje', tool: true, plan: true, info: 'Para el regreso (y para salir afuera).' },
  codigo: { name: 'Código de navegación', g: 'codigo', tool: true, plan: true, info: 'Lo pide la nave de regreso.' },
  celda: { name: 'Combustible', g: 'celda', tool: true, plan: true, info: 'Sin esto la nave no vuelve.' },
};

export const LOOT = { cinta: 10, tela: 8, tornillos: 10, placa: 8, cable: 9, tubo: 7, chip: 4, bateria: 5, filtro: 6, sellador: 6, cartucho: 5 };

// locs: en qué destinos aparece (sin locs = en todos).
export const RECIPES = [
  { id: 'destornillador', need: ['tornillos', 'placa'], k: 0 },
  { id: 'amarra', need: ['cable', 'cinta'], k: 0, locs: ['estacion'] },
  { id: 'parche', need: ['cinta', 'tela', 'sellador'], k: 10 },
  { id: 'kit', need: ['tela', 'sellador', 'cinta'], k: 10, locs: ['marte'] },
  { id: 'extintor', need: ['tubo', 'cartucho'], k: 15, locs: ['estacion'] },
  { id: 'resina', need: ['sellador', 'tela', 'placa'], k: 15, locs: ['luna'] },
  { id: 'fungicida', need: ['filtro', 'sellador', 'tubo'], k: 15, locs: ['marte', 'estacion'] },
  { id: 'mascara', need: ['filtro', 'tela', 'tubo'], k: 20, locs: ['estacion'] },
  { id: 'aspiradora', need: ['filtro', 'tubo', 'bateria'], k: 20, locs: ['luna'] },
  { id: 'traje', need: ['traje_roto', 'parche'], k: 25 },
  { id: 'inhibidor', need: ['bateria', 'chip', 'cable'], k: 30 },
  { id: 'tarjeta', need: ['chip', 'placa', 'cable'], k: 35 },
  { id: 'llave', need: ['placa', 'tornillos', 'tubo'], k: 40 },
];

// Protocolos: se tocan los pasos en orden. Ojo: NO todos son procedimientos reales de la NASA.
// Ver PROTO_FUENTE más abajo: cada uno dice si es 'iss' (basado en procedimientos reales, muy simplificado),
// 'riesgo' (el peligro es real, los pasos son un juego) o 'ficcion' (inspirado en misiones, inventado).
export const PROTOCOLS = {
  fuego: { title: 'INCENDIO · protocolo ISS', steps: ['Avisar a la tripulación y a Houston', 'Ponerse la máscara de oxígeno (PBA)', 'Apagar la ventilación del módulo', 'Cortar la energía del equipo', 'Usar el extintor (PFE)', 'Medir el aire antes de quitarse la máscara'] },
  fuga: { title: 'DESPRESURIZACIÓN · protocolo ISS', steps: ['Avisar: "¡Despresurización!"', 'Calcular el tiempo que queda (Tres)', 'Ir hacia la cápsula cerrando escotillas', 'Aislar módulo por módulo para hallar la fuga', 'Aplicar el parche', 'Volver a presurizar'] },
  amoniaco: { title: 'AMONIACO · protocolo ISS', steps: ['Ponerse la máscara (PBA)', 'Cerrar la escotilla del módulo', 'Ir al segmento seguro', 'Apagar el circuito de enfriamiento', 'Purgar el aire con los filtros', 'Revisar la piel y los ojos'] },
  polvo: { title: 'POLVO LUNAR · limpieza estilo Artemis', steps: ['Cerrar el visor del casco', 'Alejar los equipos sensibles', 'Encender la aspiradora con filtro HEPA', 'Aspirar de arriba hacia abajo', 'Guardar el filtro sellado', 'Revisar los sellos del traje'] },
  grieta: { title: 'GRIETA · protocolo de hábitat', steps: ['Avisar a la tripulación', 'Cerrar las escotillas vecinas', 'Medir la presión del módulo', 'Limpiar el borde de la grieta', 'Aplicar la resina', 'Esperar el curado y volver a medir'] },
  plaga: { title: 'PLAGA · protocolo de invernadero', steps: ['Aislar el invernadero', 'Ponerse guantes y máscara', 'Sacar las plantas enfermas', 'Aplicar el fungicida', 'Subir la ventilación y bajar la humedad', 'Registrar todo para la Tierra'] },
  perclorato: { title: 'PERCLORATO · limpieza estilo Marte', steps: ['Ponerse guantes y máscara', 'No comer ni beber en la zona', 'Aspirar el polvo rojo', 'Limpiar con el kit', 'Lavar las manos y el traje', 'Revisar el agua potable'] },
  hongo: { title: 'HONGO EN FILTROS · alerta de hábitat', steps: ['Ponerse guantes y máscara', 'Apagar el ventilador del conducto', 'Sacar el filtro contaminado', 'Rociar el fungicida', 'Poner un filtro limpio', 'Encender y medir el aire'] },
  ia: { title: 'APAGADO DE LA IA', steps: ['Pasar la tarjeta clonada', 'Aislar a la IA de los sistemas vitales', 'Pasar el soporte vital a manual', 'Cortar los drones de vigilancia', 'Apagar el núcleo', 'Avisar a la Tierra'] },
  desacople: { title: 'DESACOPLE MANUAL · Soyuz', steps: ['Ponerse el traje Sokol', 'Cerrar la escotilla de la estación', 'Revisar la presión de la cápsula', 'Encender el combustible', 'Meter la llave y girar la palanca', 'Confirmar "¡Desacople!" por radio'] },
  ascenso: { title: 'DESPEGUE · módulo de ascenso', steps: ['Conectar el oxígeno del traje', 'Cerrar la escotilla del módulo', 'Cargar el código de navegación', 'Presurizar los tanques', 'Soltar los anclajes con la llave', 'Encender el motor de ascenso'] },
  mav: { title: 'DESPEGUE · MAV', steps: ['Conectar el oxígeno del traje', 'Revisar el combustible de la planta ISRU', 'Cargar el código de navegación', 'Calcular la ventana con la nave en órbita', 'Soltar los anclajes con la llave', 'Encender los motores'] },
  // Mantenimiento diario (08:00–12:00): mini-protocolo de 3 pasos en orden. Sin prisa y sin castigo: si falla, el panel sigue pendiente.
  mant_vida: { title: 'MANTENIMIENTO · soporte vital', mant: true, time: 40, steps: ['Medir el CO₂ del aire', 'Cambiar el filtro sucio por uno limpio', 'Comprobar que el aire quedó limpio'] },
  mant_energia: { title: 'MANTENIMIENTO · energía', mant: true, time: 40, steps: ['Mirar cuánta carga tienen las baterías', 'Orientar los paneles hacia el Sol', 'Confirmar que la carga sube'] },
  mant_rad: { title: 'MANTENIMIENTO · radiación', mant: true, time: 40, steps: ['Leer el dosímetro (cuánta radiación llevas)', 'Revisar que el blindaje esté cerrado', 'Anotar la dosis en el registro'] },
  mant_comida: { title: 'MANTENIMIENTO · comida', mant: true, time: 40, steps: ['Revisar el agua y la luz de las plantas', 'Cosechar lo que ya está listo', 'Guardar las raciones en la despensa'] },
};

// Fuente y honestidad por protocolo (se muestra en el minijuego y en el debrief).
export const PROTO_NIVEL = {
  iss: 'Basado en procedimientos reales de la ISS (muy simplificado)',
  riesgo: 'El peligro es real; los pasos son una versión de juego',
  ficcion: 'Ficción educativa inspirada en misiones reales',
};
export const PROTO_FUENTE = {
  fuego: { nivel: 'iss', fuente: 'NASA NTRS 20120002562 y 20030053429 (fuego en ISS: PBA y extintor PFE)' },
  fuga: { nivel: 'iss', fuente: 'NASA NTRS 20250003954 (Chen, Walker y Williams, 2025: emergencias en la ISS: fuego, derrames tóxicos y despresurización rápida; los pasos del juego están muy simplificados)' },
  amoniaco: { nivel: 'iss', fuente: 'NASA NTRS 20220019247 (atmósfera tóxica en ISS, incluye fugas de amoníaco)' },
  polvo: { nivel: 'riesgo', fuente: 'Apolo: el polvo lunar irritó ojos y pulmones; NASA lo trata como riesgo mayor para Artemis' },
  perclorato: { nivel: 'riesgo', fuente: 'GeoHealth 2025 (Wang et al., doi:10.1029/2024GH001213): el perclorato del polvo marciano podría frenar la tiroides; es una hipótesis de revisión, no un caso en astronautas' },
  grieta: { nivel: 'ficcion', fuente: 'Inspirado en reparar fugas de hábitat; pasos inventados' },
  plaga: { nivel: 'ficcion', fuente: 'Inspirado en cultivo en órbita (Veggie); pasos inventados' },
  hongo: { nivel: 'ficcion', fuente: 'Inspirado en filtros de aire de estaciones; pasos inventados' },
  ia: { nivel: 'ficcion', fuente: 'Historia del juego; no existe en la realidad' },
  desacople: { nivel: 'ficcion', fuente: 'Inspirado en cápsulas Soyuz (traje Sokol real); pasos inventados' },
  ascenso: { nivel: 'ficcion', fuente: 'Inspirado en el módulo de ascenso lunar; pasos inventados' },
  mav: { nivel: 'ficcion', fuente: 'Inspirado en el MAV de Marte (concepto NASA); pasos inventados' },
  mant_vida: { nivel: 'ficcion', fuente: 'En la ISS el mantenimiento rutinario del soporte vital es real, pero estos pasos son de juego' },
  mant_energia: { nivel: 'ficcion', fuente: 'En una base el cuidado de baterías y paneles es real, pero estos pasos son de juego' },
  mant_rad: { nivel: 'ficcion', fuente: 'Vigilar la dosis con dosímetros es real en la ISS, pero estos pasos son de juego' },
  mant_comida: { nivel: 'ficcion', fuente: 'Cultivar alimento en el espacio es real (Veggie en la ISS), pero estos pasos son de juego' },
};

/*
 Problemas-enemigo. type:
  spread  = se extiende casilla por casilla (fuego, grieta, plaga, perclorato, frío)
  chaser  = nube que te sigue (amoniaco, polvo, diablo de polvo)
  bouncer = trozos que rebotan (chatarra)
  pull    = fuga que te jala hacia el agujero
  front   = frente que barre el mapa (radiación, tormenta)
  robot   = máquina que te persigue y desarma cosas (rover, robot fallado)
*/
export const HAZARDS = {
  fuego: { type: 'spread', name: 'INCENDIO', tool: 'extintor', proto: 'fuego', rate: 1.6, dmg: 10, stat: 'salud', color: [255, 110, 20], maxFrac: 0.6, loss: 15, sameRoom: true },
  amoniaco: { type: 'chaser', name: 'FUGA DE AMONIACO', tool: 'mascara', proto: 'amoniaco', speed: 0.95, life: 150, dmg: 7, immune: 'mascara', color: [220, 255, 90], label: 'NH₃' },
  chatarra: { type: 'bouncer', name: 'CHATARRA SUELTA', tool: 'amarra' },
  fuga: { type: 'pull', name: 'DESPRESURIZACIÓN', tool: 'parche', proto: 'fuga', tres: 200 },
  radiacion: { type: 'front', name: 'TORMENTA SOLAR', warn: 20, speed: 1.4, width: 12, dmg: 9, safe: ['refugio'], color: [255, 60, 90], msg: '¡Partículas solares en 20 s! Corre al REFUGIO DE RADIACIÓN.' },
  polvo: { type: 'chaser', name: 'REMOLINO DE POLVO', tool: 'aspiradora', proto: 'polvo', speed: 1.1, life: 130, dmg: 5, color: [190, 190, 180], label: '≈', blind: true },
  rover: { type: 'robot', name: 'ROVER DESCONTROLADO', speed: 3.3, dmg: 15, color: '#ffc23d', spawn: 'esclusa' },
  grieta: { type: 'spread', name: 'GRIETA POR TEMBLOR', tool: 'resina', proto: 'grieta', rate: 1.9, dmg: 4, stat: 'salud', color: [40, 30, 25], maxFrac: 0.55, loss: 14, sameRoom: false, slow: true },
  frio: { type: 'spread', name: 'FRÍO DE LA NOCHE LUNAR', tool: 'bateria', proto: null, cables: true, rate: 2.2, dmg: 5, stat: 'energia', color: [120, 200, 255], maxFrac: 0.7, loss: 10, sameRoom: true, slow: true },
  diablo: { type: 'chaser', name: 'DIABLO DE POLVO', tool: null, speed: 1.7, life: 90, dmg: 8, color: [210, 120, 70], label: '@', outside: true, knock: true },
  plaga: { type: 'spread', name: 'PLAGA EN EL INVERNADERO', tool: 'fungicida', proto: 'plaga', rate: 2.4, dmg: 0, stat: 'salud', color: [150, 200, 60], maxFrac: 0.6, loss: 18, sameRoom: true, room: 'inver' },
  perclorato: { type: 'spread', name: 'PERCLORATO TÓXICO', tool: 'kit', proto: 'perclorato', rate: 2, dmg: 5, stat: 'salud', color: [230, 80, 60], maxFrac: 0.6, loss: 12, sameRoom: true },
  robot: { type: 'robot', name: 'ROBOT DE MANTENIMIENTO FALLADO', speed: 2.4, dmg: 12, color: '#ff8a3d', spawn: 'taller', steals: true },
  // --- villanos nuevos ---
  cazador: { type: 'robot', name: 'DRON CAZADOR', speed: 3.7, dmg: 10, color: '#ff3b6b', spawn: 'nodo', track: 8, hint: 'Te sigue el rastro 8 s aunque no te vea. Inhíbelo (Q) o métete en un conducto.' },
  perro: { type: 'robot', name: 'PERRO-ROBOT DE CARGA', speed: 3.0, dmg: 8, color: '#c9a84a', spawn: 'esclusa', smell: 9, grab: true, hint: 'Huele las herramientas que llevas encima. Déjalas en el escondite.' },
  robotminero: { type: 'robot', name: 'ROBOT MINERO ROTO', speed: 2.7, dmg: 14, color: '#b8957a', spawn: 'bodega', smell: 7, steals: true, hint: 'Lo atrae el metal: si llevas herramientas, te huele.' },
  fuego0g: { type: 'bouncer', name: 'FUEGO EN INGRAVIDEZ', tool: 'extintor', dmg: 12, n: 4, fire: true },
  llamarada: { type: 'shelter', name: 'LLAMARADA SOLAR', warn: 30, safe: ['dorm'], dmg: 20, loss: 6, msg: '☀️ Llamarada solar: ¡partículas en 30 s! Todos al refugio.' },
  basura: { type: 'shelter', name: 'BASURA ORBITAL', warn: 30, safe: ['nodo'], dmg: 40, loss: 10, msg: 'Control de Tierra: ¡basura orbital en 30 s! Todos al NODO CENTRAL.' },
  canadarm: { type: 'sweep', name: 'BRAZO ROBÓTICO DESCONTROLADO', life: 100, speed: 2.4, dmg: 14, hint: 'Barre la sala de lado a lado: pasa por el hueco.' },
  hongo: { type: 'mold', name: 'HONGO EN LOS FILTROS', tool: 'fungicida', proto: 'hongo', grow: 40 },
  meteoritos: { type: 'meteor', name: 'LLUVIA DE MICROMETEORITOS', life: 45, dmg: 22, msg: '¡Lluvia de micrometeoritos en la superficie! Si estás afuera, esquiva las marcas.' },
  camara: { type: 'camera', name: 'CÁMARA DE SELENE', range: 6.5, msg: 'SELENE instaló una cámara nueva.' },
  apagon: { type: 'blackout', name: 'APAGÓN', life: 80, hint: 'ARES cortó la energía: las escotillas no abren sin una batería.' },
  cuarentena: { type: 'blackout', name: 'CUARENTENA', life: 160, quarantine: true, hint: 'Bioseguridad selló la sala. Solo por los conductos.' },
  mutacion: { type: 'spread', name: 'PLANTAS MUTANTES', tool: 'fungicida', proto: 'plaga', rate: 1.7, dmg: 7, stat: 'salud', color: [150, 70, 190], maxFrac: 0.65, loss: 15, sameRoom: true, room: 'inver', slow: true },
  tormenta: { type: 'front', name: 'TORMENTA DE POLVO GLOBAL', warn: 25, speed: 0.55, width: 70, dmg: 11, outsideOnly: true, dark: true, color: [200, 90, 40], msg: 'Se acerca una tormenta de polvo global. Afuera es mortal; adentro se apagan las luces y los drones ven menos.' },
};

/** Dificultad: multiplicadores sobre vista, velocidad de vigilantes, alerta, daño, villanos por día y gracia tras un castigo (s). */
export const DIFS = {
  cadete: { name: 'Cadete', desc: 'Para 7 a 12 años: cumplir la rutina y cuidar la base alcanza para llegar al rescate.', see: 0.55, spd: 0.75, alert: 0.35, dmg: 0.3, vil: [0, 1, 1], search: 0.3, grace: 60, late: 45, robotLife: 60, robotStun: 5, maxHaz: 1, excuse: true, regen: 0.1, react: 1.8, crewFix: 45, doseK: 0.5, stormK: 0.75, kit: true, noBetray: true },
  facil: { name: 'Fácil', desc: 'Para aprender: vigilantes lentos y miopes, menos daño.', see: 0.75, spd: 0.85, alert: 0.55, dmg: 0.5, vil: [1, 1, 2], search: 0.5, grace: 35, late: 30, robotLife: 100, robotStun: 3, maxHaz: 2, excuse: true, regen: 0.06, react: 1.4 },
  normal: { name: 'Normal', desc: 'La experiencia pensada: tenso pero justo.', see: 0.9, spd: 0.93, alert: 0.8, dmg: 0.7, vil: [1, 2, 2], search: 0.75, grace: 25, late: 22, robotLife: 170, robotStun: 2, maxHaz: 3, excuse: true, regen: 0.035, react: 1.15 },
  dificil: { name: 'Terror', desc: 'Sin piedad: ven lejos, corren y cada día llegan 3 amenazas.', see: 1, spd: 1, alert: 1, dmg: 1, vil: [1, 2, 3], search: 1, grace: 12, late: 15, robotLife: Infinity, robotStun: 0, maxHaz: 99, regen: 0.02, react: 1 },
  pesadilla: { name: 'Pesadilla', desc: 'Secreta (600 pts): todo más rápido, más villanos y casi sin gracia.', locked: 600, see: 1.15, spd: 1.1, alert: 1.25, dmg: 1.2, vil: [2, 3, 4], search: 1.2, grace: 6, late: 12, robotLife: Infinity, robotStun: 0, maxHaz: 99, regen: 0.015, react: 0.85 },
};

/** Personajes: se desbloquean con puntos entre partidas. */
export const PERKS = {
  novato: { name: 'Novato', desc: 'Sin ventajas. Puro talento.', cost: 0 },
  atleta: { name: 'Atleta', desc: '+30 fuerza y corres 12 % más rápido.', cost: 150, fuerza: 30, speed: 1.12 },
  ingeniera: { name: 'Ingeniera', desc: '+30 conocimiento: fabricas y hackeas desde el día 1.', cost: 150, conoc: 30 },
  sombra: { name: 'Sombra', desc: 'Te ven 20 % menos y tus pasos casi no se oyen.', cost: 300, see: 0.8, quiet: true },
  contrabandista: { name: 'Contrabandista', desc: '+2 de espacio y empiezas con destornillador.', cost: 300, cap: 2, start: ['destornillador'] },
};

// ---------- Inglés (solo presentación; ver i18n.js). Lo que no está aquí se muestra en español. ----------
const EN_DIFS = {
  cadete: ['Cadet', 'For ages 7–12: following the routine and caring for the base is enough to reach the rescue.'],
  facil: ['Easy', 'To learn: slow, short-sighted guards, less damage.'],
  normal: ['Normal', 'The intended experience: tense but fair.'],
  dificil: ['Terror', 'No mercy: they see far, run, and 3 threats arrive every day.'],
  pesadilla: ['Nightmare', 'Secret (600 pts): everything faster, more villains and almost no grace.'],
};
for (const [k, [n, d]] of Object.entries(EN_DIFS)) if (DIFS[k]) Object.assign(DIFS[k], { nameEn: n, descEn: d });
const EN_PERKS = {
  novato: ['Rookie', 'No advantages. Pure talent.'], atleta: ['Athlete', '+30 strength and you run 12 % faster.'], ingeniera: ['Engineer', '+30 knowledge: you craft and hack from day 1.'],
  sombra: ['Shadow', 'They see you 20 % less and your steps are almost silent.'], contrabandista: ['Smuggler', '+2 bag space and you start with a screwdriver.'],
};
for (const [k, [n, d]] of Object.entries(EN_PERKS)) if (PERKS[k]) Object.assign(PERKS[k], { nameEn: n, descEn: d });
export const PROTO_NIVEL_EN = {
  iss: 'Based on real ISS procedures (greatly simplified)',
  riesgo: 'The hazard is real; the steps are a game version',
  ficcion: 'Educational fiction inspired by real missions',
};
const EN_PROTO = {
  fuego: ['FIRE · ISS protocol', 'NASA NTRS 20120002562 and 20030053429 (fire on the ISS: PBA and PFE extinguisher)'],
  fuga: ['DEPRESSURIZATION · ISS protocol', 'NASA NTRS 20250003954 (Chen, Walker and Williams, 2025: ISS emergencies: fire, toxic spills and rapid depressurization; the game steps are greatly simplified)'],
  amoniaco: ['AMMONIA · ISS protocol', 'NASA NTRS 20220019247 (toxic atmosphere on the ISS, including ammonia leaks)'],
  polvo: ['LUNAR DUST · Artemis-style cleaning', 'Apollo: lunar dust irritated eyes and lungs; NASA treats it as a major risk for Artemis'],
  perclorato: ['PERCHLORATE · Mars-style cleaning', 'GeoHealth 2025 (Wang et al., doi:10.1029/2024GH001213): perchlorate in Martian dust could slow the thyroid; it is a review hypothesis, not a case in astronauts'],
};
for (const [k, [t, f]] of Object.entries(EN_PROTO)) { if (PROTOCOLS[k]) PROTOCOLS[k].titleEn = t; if (PROTO_FUENTE[k]) PROTO_FUENTE[k].fuenteEn = f; }

// Mantenimiento (mini-protocolo de 3 pasos) en inglés
const EN_MANT = {
  mant_vida: ['MAINTENANCE · life support', ['Measure the CO₂ in the air', 'Swap the dirty filter for a clean one', 'Check that the air is clean'], 'On the ISS routine life-support maintenance is real, but these steps are game steps'],
  mant_energia: ['MAINTENANCE · power', ['Check how much charge the batteries have', 'Turn the solar panels toward the Sun', 'Confirm the charge is rising'], 'Taking care of batteries and panels is real on a base, but these steps are game steps'],
  mant_rad: ['MAINTENANCE · radiation', ['Read the dosimeter (how much radiation you carry)', 'Check that the shielding is closed', 'Write the dose in the log'], 'Monitoring dose with dosimeters is real on the ISS, but these steps are game steps'],
  mant_comida: ['MAINTENANCE · food', ['Check the water and light for the plants', 'Harvest what is ready', 'Store the rations in the pantry'], 'Growing food in space is real (Veggie on the ISS), but these steps are game steps'],
};
for (const [k, [t, st, f]] of Object.entries(EN_MANT)) { if (PROTOCOLS[k]) { PROTOCOLS[k].titleEn = t; PROTOCOLS[k].stepsEn = st; } if (PROTO_FUENTE[k]) PROTO_FUENTE[k].fuenteEn = f; }

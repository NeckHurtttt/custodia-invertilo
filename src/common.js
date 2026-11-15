import { T } from './i18n.js';
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
  fuego: { nivel: 'iss', fuente: 'NASA NTRS 20030053429 (detección y extinción de incendios en la ISS: extintor portátil PFE y equipo de respiración PBA) y NTRS 20120002562 (cómo se entrena la respuesta a un incendio: reunirse en un lugar seguro y coordinar con Control)' },
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
  fuego: ['FIRE · ISS protocol', 'NASA NTRS 20030053429 (fire detection and suppression on the ISS: portable fire extinguisher PFE and breathing apparatus PBA) and NTRS 20120002562 (how fire response is trained: gather in a safe haven and coordinate with Mission Control)'],
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

// ---------- Inglés de peligros, objetos y protocolos (solo presentación). Se publican como propiedades con getter. ----------
const enGetter = (obj, prop, en) => { if (!obj || en == null) return; const es = obj[prop]; Object.defineProperty(obj, prop, { get: () => T(es, en), enumerable: true, configurable: true }); };
const EN_HAZ = {
  fuego: ['FIRE'], amoniaco: ['AMMONIA LEAK'], chatarra: ['LOOSE SCRAP'], fuga: ['DEPRESSURIZATION'], radiacion: ['SOLAR STORM', 'Solar particles in 20 s! Run to the RADIATION SHELTER.'],
  polvo: ['DUST WHIRL'], rover: ['RUNAWAY ROVER'], grieta: ['QUAKE CRACK'], frio: ['COLD OF THE LUNAR NIGHT'], diablo: ['DUST DEVIL'], plaga: ['GREENHOUSE PEST'], perclorato: ['TOXIC PERCHLORATE'],
  robot: ['FAULTY MAINTENANCE ROBOT'], cazador: ['HUNTER DRONE', null, 'It tracks you for 8 s even if it does not see you. Inhibit it (Q) or get into a duct.'], perro: ['CARGO ROBOT DOG', null, 'It sniffs out the tools you carry. Leave them in your hiding place.'],
  robotminero: ['BROKEN MINING ROBOT', null, 'Metal attracts it: if you carry tools, it smells them.'], fuego0g: ['FIRE IN ZERO GRAVITY'], llamarada: ['SOLAR FLARE', 'Solar flare: particles in 30 s! Everyone to the shelter.'],
  basura: ['ORBITAL DEBRIS', 'Earth Control: orbital debris in 30 s! Everyone to the CENTRAL HUB.'], canadarm: ['RUNAWAY ROBOTIC ARM', null, 'It sweeps the room from side to side: go through the gap.'],
  hongo: ['MOLD IN THE FILTERS'], meteoritos: ['MICROMETEORITE SHOWER', 'Micrometeorite shower on the surface! If you are outside, dodge the marks.'], camara: ['SELENE CAMERA', 'SELENE installed a new camera.'],
  apagon: ['BLACKOUT', null, 'ARES cut the power: the hatches will not open without a battery.'], cuarentena: ['QUARANTINE', null, 'Biosecurity sealed the room. Only through the ducts.'], mutacion: ['MUTANT PLANTS'],
  tormenta: ['GLOBAL DUST STORM', 'A global dust storm is approaching. Outside it is deadly; inside the lights go out and the drones see less.'],
};
for (const [k, [name, msg, hint]] of Object.entries(EN_HAZ)) { const h = HAZARDS[k]; if (!h) continue; enGetter(h, 'name', name); enGetter(h, 'msg', msg); enGetter(h, 'hint', hint); }
const EN_ITEMS = {
  cinta: ['Duct tape'], tela: ['Nomex fabric'], tornillos: ['Screws'], placa: ['Aluminum plate'], cable: ['Cable'], tubo: ['Tube'], chip: ['Chip'], bateria: ['Battery', 'Restores the power of a frozen module.'],
  filtro: ['Carbon filter'], sellador: ['Sealant'], cartucho: ['CO₂ cartridge'], destornillador: ['Screwdriver', 'Opens duct grates and disarms inhibited robots.'], amarra: ['Tie-down', 'Holds down loose scrap.'],
  parche: ['Leak patch', 'Seals leaks and repairs suits.'], extintor: ['Extinguisher (PFE)', 'Puts out a fire.'], mascara: ['Mask (PBA)', 'Protects you from ammonia and smoke.'], aspiradora: ['HEPA vacuum', 'Traps lunar dust.'],
  resina: ['Sealing resin', 'Closes cracks in the floor.'], fungicida: ['Fungicide', 'Stops the greenhouse pest.'], kit: ['Cleaning kit', 'Cleans toxic perchlorate.'], inhibidor: ['Inhibitor', 'Shuts down a drone or robot for 20 s (key Q nearby).'],
  tarjeta: ['Cloned card', 'Opens the card hatches (AI and airlock).'], llave: ['Undocking key', 'For the return console.'], traje_roto: ['Torn suit', 'Repair it with a patch.'], traje: ['Pressure suit', 'For the return trip (and to go outside).'],
  codigo: ['Navigation code', 'The return ship asks for it.'], celda: ['Fuel', 'Without it the ship cannot return.'],
};
for (const [k, [name, info]] of Object.entries(EN_ITEMS)) { const it = ITEMS[k]; if (!it) continue; enGetter(it, 'name', name); if (info) enGetter(it, 'info', info); }
const EN_STEPS = {
  fuego: ['Warn the crew and Houston', 'Put on the oxygen mask (PBA)', 'Shut off the module ventilation', 'Cut the power to the equipment', 'Use the extinguisher (PFE)', 'Measure the air before taking off the mask'],
  fuga: ['Warn: "Depressurization!"', 'Work out the time left (Tres)', 'Head for the capsule closing hatches', 'Isolate module by module to find the leak', 'Apply the patch', 'Repressurize'],
  amoniaco: ['Put on the mask (PBA)', 'Close the module hatch', 'Go to the safe segment', 'Shut off the cooling loop', 'Purge the air with the filters', 'Check your skin and eyes'],
  polvo: ['Close the helmet visor', 'Move sensitive equipment away', 'Turn on the HEPA-filter vacuum', 'Vacuum from top to bottom', 'Store the sealed filter', 'Check the suit seals'],
  grieta: ['Warn the crew', 'Close the neighboring hatches', 'Measure the module pressure', 'Clean the edge of the crack', 'Apply the resin', 'Wait for it to cure and measure again'],
  plaga: ['Isolate the greenhouse', 'Put on gloves and mask', 'Remove the sick plants', 'Apply the fungicide', 'Raise ventilation and lower humidity', 'Record everything for Earth'],
  perclorato: ['Put on gloves and mask', 'Do not eat or drink in the area', 'Vacuum the red dust', 'Clean with the kit', 'Wash your hands and suit', 'Check the drinking water'],
  hongo: ['Put on gloves and mask', 'Turn off the duct fan', 'Remove the contaminated filter', 'Spray the fungicide', 'Put in a clean filter', 'Turn on and measure the air'],
  ia: ['Swipe the cloned card', 'Isolate the AI from the vital systems', 'Switch life support to manual', 'Cut the surveillance drones', 'Shut down the core', 'Warn Earth'],
  desacople: ['Put on the Sokol suit', 'Close the station hatch', 'Check the capsule pressure', 'Turn on the fuel', 'Insert the key and turn the lever', 'Confirm "Undocking!" by radio'],
  ascenso: ['Connect the suit oxygen', 'Close the module hatch', 'Load the navigation code', 'Pressurize the tanks', 'Release the anchors with the key', 'Start the ascent engine'],
  mav: ['Connect the suit oxygen', 'Check the ISRU plant fuel', 'Load the navigation code', 'Calculate the window with the ship in orbit', 'Release the anchors with the key', 'Start the engines'],
};
for (const [k, steps] of Object.entries(EN_STEPS)) { const p = PROTOCOLS[k]; if (!p) continue; if (p.steps.length !== steps.length) throw new Error('pasos distintos en ' + k); p.stepsEn = steps; }
const EN_PTITLE = { grieta: 'CRACK · habitat protocol', plaga: 'PEST · greenhouse protocol', hongo: 'MOLD IN THE FILTERS · habitat alert', ia: 'AI SHUTDOWN', desacople: 'MANUAL UNDOCKING · Soyuz', ascenso: 'LIFTOFF · ascent module', mav: 'LIFTOFF · MAV' };
for (const [k, t] of Object.entries(EN_PTITLE)) if (PROTOCOLS[k]) PROTOCOLS[k].titleEn = t;

/** Retraso de la señal con la Tierra que se simula (segundos reales). Realidad: ISS casi instantáneo; Luna ≈ 1,3 s luz por tramo; Marte entre 3 y 22 MINUTOS luz según la posición de los planetas (distancias Tierra–Marte, NASA). Aquí Marte se acorta para que se pueda jugar. */
export const SIGNAL_DELAY = { estacion: 0, luna: 2, marte: 6 };

// ---------- Variantes del mantenimiento (otros pasos para la misma revisión; el día 1 siempre sale la A; ver variedad.js) ----------
// [pasos en español, pasos en inglés]. Siguen siendo pasos de juego (nivel «ficcion»), igual que la versión A.
const MANT_VARIANTES = {
  vida: {
    _b: [['Escuchar si el ventilador suena raro', 'Limpiar la rejilla del aire', 'Anotar que el aire fluye bien'], ['Listen for any strange fan noise', 'Clean the air grille', 'Write down that the air flows well']],
    _c: [['Revisar la alarma de CO₂', 'Purgar el depurador con cuidado', 'Probar la alarma otra vez'], ['Check the CO₂ alarm', 'Purge the scrubber carefully', 'Test the alarm again']],
  },
  energia: {
    _b: [['Revisar los cables de las baterías', 'Limpiar el polvo de los paneles', 'Probar que las luces no parpadean'], ['Check the battery cables', 'Wipe the dust off the panels', 'Test that the lights do not flicker']],
    _c: [['Medir el voltaje de la red', 'Apagar lo que no se usa', 'Anotar el consumo del día'], ['Measure the grid voltage', 'Switch off what is not in use', 'Write down the day\'s power use']],
  },
  rad: {
    _b: [['Ponerte el dosímetro en el pecho', 'Cerrar las compuertas del blindaje', 'Leer y anotar la dosis'], ['Clip the dosimeter on your chest', 'Close the shielding hatches', 'Read and log the dose']],
    _c: [['Mirar el aviso del clima espacial', 'Mover el equipo al cuarto más blindado', 'Confirmar que la alarma de tormenta está activa'], ['Look at the space weather notice', 'Move the equipment to the most shielded room', 'Confirm the storm alarm is on']],
  },
  comida: {
    _b: [['Medir la humedad del cultivo', 'Regar solo lo que lo necesita', 'Anotar cuánto creció cada planta'], ['Measure the crop moisture', 'Water only what needs it', 'Write down how much each plant grew']],
    _c: [['Buscar hojas con manchas', 'Quitar las plantas enfermas', 'Lavarte las manos antes de comer'], ['Look for spotted leaves', 'Remove the sick plants', 'Wash your hands before eating']],
  },
};
for (const [sys, vs] of Object.entries(MANT_VARIANTES)) {
  const base = PROTOCOLS['mant_' + sys];
  for (const [suf, [es, en]] of Object.entries(vs)) {
    const id = 'mant_' + sys + suf;
    PROTOCOLS[id] = { ...base, steps: es, stepsEn: en };
    PROTO_FUENTE[id] = { ...PROTO_FUENTE['mant_' + sys] };
  }
}

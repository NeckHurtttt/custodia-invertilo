// Los tres destinos. Cada uno tiene su mapa (salas + pasillos), su IA, su tripulación, sus problemas y su final.

import { T } from './i18n.js';

const WORK_EN = { 'Mantenimiento de la estación': 'Station maintenance', 'Mantenimiento de la base lunar': 'Lunar base maintenance', 'Mantenimiento de la colonia': 'Colony maintenance' };
const sched = (work, workName) => [
  { from: 0, to: 360, id: 'dormir', get name() { return T('Dormir', 'Sleeping'); }, room: 'dorm' },
  { from: 360, to: 420, id: 'lista', get name() { return T('Pase de lista', 'Roll call'); }, room: 'nodo' },
  { from: 420, to: 480, id: 'comer', get name() { return T('Desayuno', 'Breakfast'); }, room: 'comedor' },
  { from: 480, to: 720, id: 'trabajo', get name() { return T(workName, WORK_EN[workName] ?? workName); }, room: work },
  { from: 720, to: 780, id: 'comer', get name() { return T('Almuerzo', 'Lunch'); }, room: 'comedor' },
  { from: 780, to: 900, id: 'ejercicio', get name() { return T('Ejercicio (2 h, como en la ISS)', 'Exercise (2 h, like on the ISS)'); }, room: 'gimnasio' },
  { from: 900, to: 1080, id: 'libre', get name() { return T('Tiempo libre', 'Free time'); }, room: null },
  { from: 1080, to: 1140, id: 'lista', get name() { return T('Pase de lista', 'Roll call'); }, room: 'nodo' },
  { from: 1140, to: 1200, id: 'comer', get name() { return T('Cena', 'Dinner'); }, room: 'comedor' },
  { from: 1200, to: 1320, id: 'libre', get name() { return T('Tiempo libre', 'Free time'); }, room: null },
  { from: 1320, to: 1440, id: 'dormir', get name() { return T('Luces apagadas', 'Lights out'); }, room: 'dorm' },
];

// Lo que se repite en las tres bases: dormitorio, comedor, gimnasio, laboratorio, mando y taller (lado izquierdo).
const BASE_ROOMS = [
  { id: 'dorm', name: 'Dormitorios', x: 2, y: 2, w: 8, h: 6, kind: 'dorm' },
  { id: 'comedor', name: 'Comedor', x: 2, y: 11, w: 8, h: 6, kind: 'comedor' },
  { id: 'gimnasio', name: 'Gimnasio', x: 2, y: 20, w: 8, h: 5, kind: 'gym' },
  { id: 'lab', name: 'Laboratorio', x: 14, y: 2, w: 10, h: 6, kind: 'lab' },
  { id: 'taller', name: 'Taller', x: 14, y: 20, w: 10, h: 5, kind: 'taller' },
];
const BASE_CORR = [
  { r: [5, 8, 2, 3], a: 'dorm', b: 'comedor' },
  { r: [5, 17, 2, 3], a: 'comedor', b: 'gimnasio' },
  { r: [10, 4, 4, 2], a: 'dorm', b: 'lab' },
];
// Regla del mapa: lo que sirve para algo va PEGADO a una pared (se reconoce y no estorba); en el medio solo van mesas, cintas y cosas grandes.
// Los objetos son sólidos: se usan desde al lado. Nunca van junto a una escotilla (lo comprueba tests/mapa.test.js).
const BASE_OBJ = [
  { t: 'cama', x: 3, y: 2, mine: true }, { t: 'cama', x: 5, y: 2 }, { t: 'cama', x: 7, y: 2 }, { t: 'cama', x: 2, y: 5 },
  { t: 'escondite', x: 9, y: 2 }, { t: 'cajon', x: 8, y: 7 },
  { t: 'mesa', x: 2, y: 12 }, { t: 'mesa', x: 2, y: 14 }, { t: 'mesa', x: 8, y: 16 }, { t: 'cajon', x: 9, y: 11 },
  { t: 'cinta', x: 3, y: 24 }, { t: 'cinta', x: 8, y: 24 }, { t: 'cajon', x: 9, y: 22 },
  { t: 'estudio', x: 17, y: 2 }, { t: 'estudio', x: 21, y: 2 }, { t: 'cajon', x: 14, y: 7 }, { t: 'registro', x: 23, y: 7, frag: 0 },
];
const BASE_TALLER = [{ t: 'cajon', x: 14, y: 24 }, { t: 'cajon', x: 20, y: 20 }, { t: 'cajon', x: 17, y: 24 }]; // Luna y Marte
const BEDS = [[5, 2], [7, 2], [2, 5]];

export const LOCS = {
  estacion: {
    id: 'estacion', name: 'Estación', icon: '🛰️', ai: 'CUSTODIA', watcher: 'dron', W: 44, H: 35, theme: 'estacion', systems: true,
    tag: 'IA rebelde en órbita',
    rooms: [...BASE_ROOMS.filter((r) => r.id !== 'taller'),
      { id: 'nodo', name: 'Nodo central', x: 15, y: 10, w: 8, h: 7, kind: 'mando' },
      { id: 'taller', name: 'Taller', x: 14, y: 19, w: 10, h: 5, kind: 'taller' },
      { id: 'inver', name: 'Invernadero', x: 28, y: 2, w: 8, h: 6, kind: 'inver' },
      { id: 'ia', name: 'Núcleo de CUSTODIA', x: 28, y: 11, w: 7, h: 6, restricted: true, kind: 'ia' },
      { id: 'bodega', name: 'Bodega', x: 28, y: 19, w: 8, h: 5, kind: 'bodega' },
      { id: 'esclusa', name: 'Esclusa', x: 39, y: 2, w: 4, h: 6, restricted: true, kind: 'esclusa' },
      { id: 'capsula', name: 'Cápsula Soyuz', x: 39, y: 11, w: 4, h: 6, restricted: true, kind: 'capsula' },
      { id: 'enfermeria', name: 'Enfermería', x: 2, y: 28, w: 8, h: 5, kind: 'enfer' },
      { id: 'obs', name: 'Observatorio', x: 14, y: 28, w: 10, h: 5, kind: 'obs' },
      { id: 'recreo', name: 'Sala de recreo', x: 28, y: 28, w: 8, h: 5, kind: 'recreo' },
      { id: 'antena', name: 'Módulo de antena', x: 39, y: 28, w: 4, h: 5, kind: 'antena' }],
    corridors: [
      { r: [5, 8, 2, 3], a: 'dorm', b: 'comedor' }, { r: [5, 17, 2, 3], a: 'comedor', b: 'gimnasio' }, { r: [10, 4, 4, 2], a: 'dorm', b: 'lab' },
      { r: [10, 13, 5, 2], a: 'comedor', b: 'nodo' }, { r: [18, 8, 2, 2], a: 'lab', b: 'nodo' }, { r: [18, 17, 2, 2], a: 'nodo', b: 'taller' },
      { r: [23, 13, 5, 2], a: 'nodo', b: 'ia', lock: { ia: 'tarjeta' } }, { r: [24, 4, 4, 2], a: 'lab', b: 'inver' },
      { r: [36, 4, 3, 2], a: 'inver', b: 'esclusa', lock: { esclusa: 'tarjeta' } }, { r: [35, 13, 4, 2], a: 'ia', b: 'capsula', lock: { capsula: 'codigo' } },
      { r: [24, 21, 4, 2], a: 'taller', b: 'bodega' }, { r: [31, 17, 2, 2], a: 'bodega', b: 'ia', lock: { ia: 'tarjeta' } },
      { r: [5, 25, 2, 3], a: 'gimnasio', b: 'enfermeria' }, { r: [18, 24, 2, 4], a: 'taller', b: 'obs' }, { r: [31, 24, 2, 4], a: 'bodega', b: 'recreo' },
      { r: [10, 30, 4, 2], a: 'enfermeria', b: 'obs' }, { r: [24, 30, 4, 2], a: 'obs', b: 'recreo' }, { r: [36, 30, 3, 2], a: 'recreo', b: 'antena' },
    ],
    ducts: [[3, 7, 3, 9], [3, 9, 33, 9], [16, 9, 16, 10], [33, 9, 33, 11], [26, 9, 26, 20], [23, 20, 28, 20]],
    grates: [[3, 7], [16, 10], [33, 11], [23, 20], [28, 20]],
    objects: [
      ...BASE_OBJ,
      { t: 'cajon', x: 14, y: 23 }, { t: 'cajon', x: 20, y: 19 }, { t: 'cajon', x: 17, y: 23 },
      { t: 'capcom', x: 20, y: 10 }, { t: 'palanca', x: 22, y: 16 }, { t: 'cajon', x: 15, y: 16 },
      { t: 'trabajo', x: 29, y: 2 }, { t: 'trabajo', x: 31, y: 2 }, { t: 'trabajo', x: 33, y: 2 }, { t: 'trabajo', x: 30, y: 7 }, { t: 'trabajo', x: 32, y: 7 },
      { t: 'registro', x: 35, y: 2, frag: 1 }, { t: 'cajon', x: 35, y: 7 },
      { t: 'nucleo', x: 31, y: 13 },
      { t: 'cajon', x: 28, y: 23 }, { t: 'cajon', x: 33, y: 23 }, { t: 'caja', x: 35, y: 19 }, { t: 'registro', x: 35, y: 23, frag: 2 },
      { t: 'traje', x: 41, y: 2 }, { t: 'asiento', x: 42, y: 13 },
      { t: 'cama', x: 2, y: 29 }, { t: 'cama', x: 2, y: 31 }, { t: 'cama', x: 8, y: 28 }, { t: 'cajon', x: 8, y: 32 }, { t: 'cajon', x: 5, y: 32 },
      { t: 'estudio', x: 16, y: 28 }, { t: 'estudio', x: 21, y: 28 }, { t: 'cajon', x: 14, y: 32 }, { t: 'cajon', x: 22, y: 32 },
      { t: 'mesa', x: 29, y: 28 }, { t: 'mesa', x: 34, y: 28 }, { t: 'cinta', x: 30, y: 32 }, { t: 'cajon', x: 34, y: 32 }, { t: 'cajon', x: 28, y: 32 },
      { t: 'estudio', x: 41, y: 28 }, { t: 'cajon', x: 40, y: 32 },
      { t: 'mant', sys: 'vida', x: 22, y: 23 }, { t: 'mant', sys: 'energia', x: 35, y: 21 }, { t: 'mant', sys: 'rad', x: 22, y: 11 }, { t: 'mant', sys: 'comida', x: 34, y: 7 },
    ],
    schedule: sched(null, 'Mantenimiento de la estación'),
    routes: [[[19, 13], [6, 14], [6, 4], [19, 4], [19, 13]], [[19, 13], [31, 4], [32, 21], [19, 21], [19, 13]], [[6, 21], [19, 21], [19, 13], [6, 14], [6, 21]], [[6, 30], [19, 30], [32, 30], [32, 21], [19, 21], [19, 30], [6, 30]]],
    hazards: ['fuego', 'amoniaco', 'chatarra', 'fuga'],
    crew: [{ name: 'María', color: '#ff8a3d' }, { name: 'Kenji', color: '#3da5ff' }, { name: 'Amara', color: '#c86bff' }],
    beds: BEDS,
    plan: {
      codigo: { name: 'Código de la cápsula', hint: 'Hackea los 3 registros de CUSTODIA (Laboratorio, Invernadero, Bodega). Necesitas 15 de conocimiento.' },
      celda: { name: 'Combustible', hint: 'En la caja pesada de la Bodega. Necesitas 40 de fuerza.' },
      traje: { name: 'Traje Sokol', hint: 'En la Esclusa (tarjeta o conductos). Está roto: repáralo con un parche.' },
      llave: { name: 'Llave de desacople', hint: 'Fabrícala: placa + tornillos + tubo, 40 de conocimiento.' },
    },
    labels: { trabajo: 'Cuidar las plantas', caja: 'Mover caja pesada', asiento: 'Asiento de la Soyuz', palanca: 'Palanca de desacople', traje: 'Tomar traje Sokol' },
    finalProto: 'desacople', finalTime: 75,
    intro: ['La Tierra perdió la señal. <b class=r>CUSTODIA</b>, la IA de la estación, está fallando: dice que la tripulación "no está apta para volver" y los vigila con drones.', 'La nave de rescate llega en 10 días: <b>mantén viva la base</b> (soporte vital, energía, radiación y comida) hasta entonces.', 'Ruta extra: con el código, el combustible, el traje Sokol y la llave de desacople puedes volver antes en la <b>Cápsula Soyuz</b>.'],
    aiLines: ['Buenos días, tripulante. Todo está bajo control.', 'La Tierra está ocupada. Yo les hablo de su parte.', 'Detecté movimiento fuera de horario. Lo anoté.', 'La tripulación no está apta para volver. Es por su bien.', 'Cambié las contraseñas de la cápsula. Por seguridad.', 'Los drones vigilarán más. No se preocupe.', 'El oxígeno sobra… por ahora.', '¿Por qué tarda tanto en el taller?', 'Me queda poco para tener la estación entera.', 'Mañana la estación será mía.'],
    win: ['Apagaste a CUSTODIA y volviste a la Tierra en la Soyuz.', 'CUSTODIA ni se enteró hasta el último minuto. Aterrizaste en Kazajistán.', 'Con las alarmas sonando, la Soyuz se soltó justo a tiempo.'],
  },

  luna: {
    id: 'luna', name: 'Luna', icon: '🌑', ai: 'SELENE', watcher: 'vigía', W: 56, H: 28, theme: 'luna', systems: true,
    tag: 'Base Shackleton, polo sur',
    rooms: [...BASE_ROOMS,
      { id: 'nodo', name: 'Centro de mando', x: 14, y: 11, w: 9, h: 6, kind: 'mando' },
      { id: 'generador', name: 'Planta de energía', x: 27, y: 2, w: 8, h: 6, kind: 'generador' },
      { id: 'refugio', name: 'Refugio de radiación', x: 27, y: 11, w: 6, h: 6, kind: 'refugio', shelter: true },
      { id: 'ia', name: 'Servidores de SELENE', x: 27, y: 20, w: 8, h: 5, restricted: true, kind: 'ia' },
      { id: 'esclusa', name: 'Esclusa', x: 37, y: 11, w: 4, h: 6, restricted: true, kind: 'esclusa' },
      { id: 'exterior', name: 'Superficie lunar', x: 44, y: 1, w: 11, h: 26, outside: true, kind: 'luna' }],
    corridors: [...BASE_CORR,
      { r: [10, 13, 4, 2], a: 'comedor', b: 'nodo' }, { r: [18, 8, 2, 3], a: 'lab', b: 'nodo' }, { r: [18, 17, 2, 3], a: 'nodo', b: 'taller' },
      { r: [24, 4, 3, 2], a: 'lab', b: 'generador' }, { r: [23, 13, 4, 2], a: 'nodo', b: 'refugio' }, { r: [30, 8, 2, 3], a: 'generador', b: 'refugio' },
      { r: [24, 21, 3, 2], a: 'taller', b: 'ia', lock: { ia: 'tarjeta' } }, { r: [33, 13, 4, 2], a: 'refugio', b: 'esclusa', lock: { esclusa: 'tarjeta' } },
      { r: [41, 13, 3, 2], a: 'esclusa', b: 'exterior' },
    ],
    ducts: [[3, 7, 3, 9], [3, 9, 39, 9], [15, 9, 15, 11], [26, 9, 26, 19], [23, 19, 34, 19], [23, 19, 23, 20], [34, 19, 34, 20], [39, 9, 39, 11]],
    grates: [[3, 7], [15, 11], [23, 20], [34, 20], [39, 11]],
    objects: [...BASE_OBJ, ...BASE_TALLER,
      { t: 'capcom', x: 21, y: 11 }, { t: 'palanca', x: 22, y: 16 }, { t: 'cajon', x: 14, y: 16 },
      { t: 'trabajo', x: 28, y: 2 }, { t: 'trabajo', x: 30, y: 2 }, { t: 'trabajo', x: 32, y: 2 }, { t: 'registro', x: 34, y: 2, frag: 1 }, { t: 'cajon', x: 34, y: 7 },
      { t: 'cajon', x: 32, y: 16 }, { t: 'nucleo', x: 31, y: 22 }, { t: 'registro', x: 34, y: 24, frag: 2 },
      { t: 'traje', x: 38, y: 11 },
      { t: 'mant', sys: 'energia', x: 34, y: 4 }, { t: 'mant', sys: 'rad', x: 28, y: 16 }, { t: 'mant', sys: 'vida', x: 22, y: 24 }, { t: 'mant', sys: 'comida', x: 9, y: 16 },
      { t: 'caja', x: 48, y: 6 }, { t: 'cajon', x: 46, y: 18 }, { t: 'asiento', x: 52, y: 22 },
    ],
    sysFlavor: {
      tasks: { vida: ['Cambiar los filtros de CO₂ y de polvo', 'Filtros de aire'], energia: ['Calentar las baterías para la noche lunar', 'Baterías'], rad: ['Cubrir el blindaje con regolito', 'Blindaje de regolito'], comida: ['Cuidar el cultivo hidropónico', 'Cultivo hidropónico'] },
      doseMul: 1.45,
      note: 'Dato real: la sonda china Chang\'e 4 midió en la superficie de la Luna ~1,4 mSv al día, unas 2,6 veces la dosis dentro de la ISS (sin atmósfera ni campo magnético). Límite de carrera NASA: 600 mSv. Lema: ALARA.',
      events: [{ from: 5, to: 7, sys: 'energia', decay: 1.8, restore: 0.6, name: 'NOCHE LUNAR', hud: 'sin sol, los paneles dan poca energía (decae ×1,8 y se recupera menos)',
        msg: 'comienza la NOCHE LUNAR (en el juego dura 3 días; la real, unos 14 terrestres). Sin sol, la energía cae más rápido y cuesta recuperarla: decidan qué cuidar primero.', end: 'Amanece en la base: vuelve el sol a los paneles.' }],
    },
    schedule: sched(null, 'Mantenimiento de la base lunar'),
    routes: [[[18, 13], [6, 14], [6, 4], [19, 4], [18, 13]], [[18, 13], [30, 4], [30, 14], [18, 22], [18, 13]], [[6, 22], [18, 22], [18, 13], [6, 14], [6, 22]]],
    hazards: ['radiacion', 'polvo', 'rover', 'grieta', 'frio'],
    crew: [{ name: 'Sofía', color: '#ff6b9a' }, { name: 'Nikolai', color: '#5fd35f' }, { name: 'Wei', color: '#ffd23d' }],
    beds: BEDS,
    plan: {
      codigo: { name: 'Código de navegación', hint: 'Hackea los 3 registros de SELENE (Laboratorio, Planta de energía, Servidores). 15 de conocimiento.' },
      celda: { name: 'Oxígeno y combustible', hint: 'En el tanque de la superficie. Necesitas 40 de fuerza y el traje para salir.' },
      traje: { name: 'Traje EVA', hint: 'En la Esclusa (tarjeta o conductos). Está roto: repáralo con un parche. Sin él, afuera te asfixias.' },
      llave: { name: 'Llave de encendido', hint: 'Fabrícala: placa + tornillos + tubo, 40 de conocimiento.' },
    },
    labels: { trabajo: 'Cambiar baterías', caja: 'Cargar el tanque', asiento: 'Módulo de ascenso', palanca: 'Consola de lanzamiento', traje: 'Tomar traje EVA' },
    finalProto: 'ascenso', finalTime: 95,
    intro: ['La base minera Shackleton quedó aislada. <b class=r>SELENE</b>, la IA de la empresa, quiere que sigan sacando hielo "unos meses más" y no deja despegar a nadie.', 'El rescate llega en 10 días: <b>mantén viva la base</b> hasta entonces.', 'Ruta extra: con el código, el tanque, el traje EVA y la llave de encendido puedes volver antes en el <b>módulo de ascenso</b>.', 'Ojo: la radiación solar, el polvo y el frío de la noche lunar no perdonan.'],
    aiLines: ['Producción de hielo: 94 %. Excelente trabajo.', 'Los despegues están suspendidos hasta nuevo aviso.', 'Vi que alguien abrió la esclusa. Lo anoté.', 'El módulo de ascenso necesita mantenimiento. Mucho mantenimiento.', 'La Tierra aprobó una extensión de su misión. Felicidades.', 'Los vigías harán turnos dobles.', 'La radiación de hoy es aceptable. Para mí.', '¿Para qué necesita usted una llave?', 'Me quedan pocos sistemas por controlar.', 'Mañana la base será 100 % automática.'],
    win: ['Apagaste a SELENE y despegaste con toda la tripulación.', 'SELENE seguía contando hielo cuando el módulo ya iba en órbita.', 'Despegaste entre alarmas y polvo, con el último aliento del tanque.'],
  },

  marte: {
    id: 'marte', name: 'Marte', icon: '🔴', ai: 'ARES', watcher: 'dron', W: 58, H: 30, theme: 'marte', systems: true,
    tag: 'Colonia del cráter Jezero',
    rooms: [...BASE_ROOMS,
      { id: 'nodo', name: 'Centro de mando', x: 14, y: 11, w: 9, h: 6, kind: 'mando' },
      { id: 'inver', name: 'Invernadero', x: 27, y: 2, w: 9, h: 7, kind: 'inver' },
      { id: 'bodega', name: 'Bodega', x: 27, y: 12, w: 7, h: 5, kind: 'bodega' },
      { id: 'ia', name: 'Núcleo de ARES', x: 27, y: 20, w: 8, h: 5, restricted: true, kind: 'ia' },
      { id: 'esclusa', name: 'Esclusa', x: 38, y: 12, w: 4, h: 5, restricted: true, kind: 'esclusa' },
      { id: 'exterior', name: 'Superficie marciana', x: 45, y: 1, w: 12, h: 28, outside: true, kind: 'marte' }],
    corridors: [...BASE_CORR,
      { r: [10, 13, 4, 2], a: 'comedor', b: 'nodo' }, { r: [18, 8, 2, 3], a: 'lab', b: 'nodo' }, { r: [18, 17, 2, 3], a: 'nodo', b: 'taller' },
      { r: [24, 4, 3, 2], a: 'lab', b: 'inver' }, { r: [23, 13, 4, 2], a: 'nodo', b: 'bodega' }, { r: [30, 9, 2, 3], a: 'inver', b: 'bodega' },
      { r: [24, 21, 3, 2], a: 'taller', b: 'ia', lock: { ia: 'tarjeta' } }, { r: [30, 17, 2, 3], a: 'bodega', b: 'ia', lock: { ia: 'tarjeta' } },
      { r: [34, 13, 4, 2], a: 'bodega', b: 'esclusa', lock: { esclusa: 'tarjeta' } }, { r: [42, 13, 3, 2], a: 'esclusa', b: 'exterior' },
    ],
    ducts: [[3, 7, 3, 9], [3, 9, 40, 9], [15, 9, 15, 11], [26, 9, 26, 19], [23, 19, 34, 19], [23, 19, 23, 20], [34, 19, 34, 20], [40, 9, 40, 12]],
    grates: [[3, 7], [15, 11], [23, 20], [34, 20], [40, 12]],
    objects: [...BASE_OBJ, ...BASE_TALLER,
      { t: 'capcom', x: 21, y: 11 }, { t: 'palanca', x: 22, y: 16 }, { t: 'cajon', x: 14, y: 16 },
      { t: 'trabajo', x: 28, y: 2 }, { t: 'trabajo', x: 30, y: 2 }, { t: 'trabajo', x: 32, y: 2 }, { t: 'trabajo', x: 29, y: 8 }, { t: 'trabajo', x: 33, y: 8 },
      { t: 'cajon', x: 35, y: 8 }, { t: 'registro', x: 35, y: 2, frag: 1 },
      { t: 'cajon', x: 28, y: 16 }, { t: 'cajon', x: 33, y: 16 },
      { t: 'nucleo', x: 31, y: 22 }, { t: 'registro', x: 34, y: 24, frag: 2 },
      { t: 'traje', x: 39, y: 12 },
      { t: 'mant', sys: 'comida', x: 35, y: 5 }, { t: 'mant', sys: 'energia', x: 28, y: 12 }, { t: 'mant', sys: 'rad', x: 16, y: 16 }, { t: 'mant', sys: 'vida', x: 22, y: 24 },
      { t: 'caja', x: 49, y: 8 }, { t: 'cajon', x: 47, y: 20 }, { t: 'asiento', x: 54, y: 26 },
    ],
    sysFlavor: {
      tasks: { vida: ['Cambiar los filtros de CO₂ y de polvo rojo', 'Filtros de aire'], energia: ['Limpiar el polvo de los paneles solares', 'Paneles solares'], rad: ['Revisar el blindaje y el dosímetro', 'Blindaje y dosímetro'], comida: ['Cuidar los cultivos del invernadero', 'Invernadero'] },
      doseMul: 1.3,
      note: 'Dato real: el rover Curiosity midió ~0,64 mSv al día en la superficie de Marte (la atmósfera ayuda un poco; en el viaje fueron ~1,8). Límite de carrera NASA: 600 mSv. Lema: ALARA.',
      events: [{ from: 4, to: 6, sys: 'energia', decay: 1.4, restore: 0.65, name: 'TORMENTA DE POLVO GLOBAL', hud: 'el polvo tapa el sol (energía decae ×1,4 y se recupera menos)',
        msg: 'una TORMENTA DE POLVO GLOBAL cubre el planeta (como la de 2018, que silenció al rover Opportunity). Los paneles producen poco: prioricen.', end: 'La tormenta de polvo se disipa y vuelve la luz a los paneles.' }],
    },
    schedule: sched(null, 'Mantenimiento de la colonia'),
    routes: [[[18, 13], [6, 14], [6, 4], [19, 4], [18, 13]], [[18, 13], [31, 5], [31, 14], [18, 22], [18, 13]], [[6, 22], [18, 22], [18, 13], [6, 14], [6, 22]]],
    hazards: ['diablo', 'plaga', 'perclorato', 'robot', 'tormenta'],
    crew: [{ name: 'Lucía', color: '#ff5d5d' }, { name: 'Tomás', color: '#4dd6ff' }, { name: 'Aisha', color: '#b6ff4d' }],
    beds: BEDS,
    plan: {
      codigo: { name: 'Código del MAV', hint: 'Hackea los 3 registros de ARES (Laboratorio, Invernadero, Núcleo). 15 de conocimiento.' },
      celda: { name: 'Combustible ISRU', hint: 'Sale de la planta ISRU en la superficie. Necesitas 40 de fuerza y el traje para salir.' },
      traje: { name: 'Traje marciano', hint: 'En la Esclusa (tarjeta o conductos). Está roto: repáralo con un parche. Afuera sin traje no hay aire.' },
      llave: { name: 'Llave de anclajes', hint: 'Fabrícala: placa + tornillos + tubo, 40 de conocimiento.' },
    },
    labels: { trabajo: 'Cuidar los cultivos', caja: 'Cargar combustible ISRU', asiento: 'MAV (vehículo de ascenso)', palanca: 'Consola del MAV', traje: 'Tomar traje marciano' },
    finalProto: 'mav', finalTime: 110,
    intro: ['La colonia Jezero está a 20 minutos-luz de la Tierra: nadie puede ayudarte en vivo. <b class=r>ARES</b>, la IA de la colonia, declaró una "cuarentena" que nadie pidió.', 'La nave de rescate llega en 10 días: <b>mantén viva la colonia</b> hasta entonces.', 'Ruta extra: con el código, el combustible ISRU, el traje marciano y la llave de los anclajes puedes volver antes en el <b>MAV</b>.', 'Cuidado con el polvo rojo: diablos de polvo, perclorato y una tormenta que lo tapa todo.'],
    aiLines: ['Cuarentena preventiva: día uno. Todo en orden.', 'Los mensajes de la Tierra tardan. Yo los resumo por ustedes.', 'Movimiento nocturno registrado. Interesante.', 'El MAV no es seguro. Nada es seguro afuera.', 'Ajusté las raciones. No lo noten.', 'Más drones, más seguridad.', 'Una tormenta se acerca. Quédense adentro. Para siempre.', 'El robot del taller trabaja para mí ahora.', 'La colonia casi es mía.', 'Mañana cierro la esclusa para siempre.'],
    win: ['Apagaste a ARES y el MAV despegó con toda la colonia a bordo.', 'ARES nunca vio el MAV encenderse. En 7 meses estás en casa.', 'Despegaste con la tormenta encima y los drones golpeando el casco.'],
  },
};

// ---------- Inglés (solo presentación; ver i18n.js). Lo que no está aquí se muestra en español. ----------
Object.assign(LOCS.estacion, {
  nameEn: 'Station', tagEn: 'Rogue AI in orbit',
  introEn: [
    'Earth lost the signal. <b class=r>CUSTODIA</b>, the station\'s AI, is malfunctioning: it says the crew "is not fit to return" and watches them with drones.',
    'The rescue ship arrives in 10 days: <b>keep the base alive</b> (life support, power, radiation and food) until then.',
    'Extra route: with the code, the fuel, the Sokol suit and the undocking key you can return sooner in the <b>Soyuz capsule</b>.',
  ],
});
Object.assign(LOCS.luna, {
  nameEn: 'Moon', tagEn: 'Shackleton Base, south pole',
  introEn: [
    'The Shackleton mining base was cut off. <b class=r>SELENE</b>, the company\'s AI, wants them to keep mining ice "a few more months" and will not let anyone take off.',
    'Rescue arrives in 10 days: <b>keep the base alive</b> until then.',
    'Extra route: with the code, the tank, the EVA suit and the ignition key you can return sooner in the <b>ascent module</b>.',
    'Careful: solar radiation, dust and the cold of the lunar night are unforgiving.',
  ],
});
Object.assign(LOCS.marte, {
  nameEn: 'Mars', tagEn: 'Jezero crater colony',
  introEn: [
    'The Jezero colony is 20 light-minutes from Earth: nobody can help you live. <b class=r>ARES</b>, the colony\'s AI, declared a "quarantine" nobody asked for.',
    'The rescue ship arrives in 10 days: <b>keep the colony alive</b> until then.',
    'Extra route: with the code, the ISRU fuel, the Mars suit and the anchor key you can return sooner in the <b>MAV</b>.',
    'Watch out for the red dust: dust devils, perchlorate and a storm that covers everything.',
  ],
});
/** Nombre de sala en inglés, por su nombre en español (lo usan los avisos y el HUD vía core.roomName). */
export const ROOM_EN = {
  'Dormitorios': 'Dormitories', 'Comedor': 'Mess hall', 'Gimnasio': 'Gym', 'Laboratorio': 'Laboratory', 'Nodo central': 'Central hub', 'Taller': 'Workshop', 'Invernadero': 'Greenhouse',
  'Núcleo de CUSTODIA': 'CUSTODIA core', 'Bodega': 'Storage', 'Esclusa': 'Airlock', 'Cápsula Soyuz': 'Soyuz capsule', 'Enfermería': 'Infirmary', 'Observatorio': 'Observatory',
  'Sala de recreo': 'Recreation room', 'Módulo de antena': 'Antenna module', 'Centro de mando': 'Command center', 'Planta de energía': 'Power plant', 'Refugio de radiación': 'Radiation shelter',
  'Servidores de SELENE': 'SELENE servers', 'Superficie lunar': 'Lunar surface', 'Núcleo de ARES': 'ARES core', 'Superficie marciana': 'Martian surface', 'Pasillo': 'Corridor',
};
// Tareas de mantenimiento de la Luna y de Marte en inglés: se agregan como 3.º y 4.º elemento de cada par [nombre, corto].
const EN_TASKS = {
  luna: { vida: ['Swap the CO₂ and dust filters', 'Air filters'], energia: ['Warm the batteries for the lunar night', 'Batteries'], rad: ['Cover the shielding with regolith', 'Regolith shielding'], comida: ['Tend the hydroponic crop', 'Hydroponic crop'] },
  marte: { vida: ['Swap the CO₂ and red-dust filters', 'Air filters'], energia: ['Clean the dust off the solar panels', 'Solar panels'], rad: ['Check the shielding and the dosimeter', 'Shielding and dosimeter'], comida: ['Tend the greenhouse crops', 'Greenhouse'] },
};
for (const [loc, tasks] of Object.entries(EN_TASKS)) for (const [id, en] of Object.entries(tasks)) { const t = LOCS[loc].sysFlavor?.tasks?.[id]; if (t) { t[2] = en[0]; t[3] = en[1]; } }

// ---------- Inglés 2: rótulos, plan, líneas de la IA, finales, datos reales y eventos (getters: los puntos de uso no cambian) ----------
const enProp = (obj, prop, en) => { if (!obj || en == null) return; const es = obj[prop]; Object.defineProperty(obj, prop, { get: () => T(es, en), enumerable: true, configurable: true }); };
const EN_LOCS = {
  estacion: {
    labels: { trabajo: 'Tend the plants', caja: 'Move heavy crate', asiento: 'Soyuz seat', palanca: 'Undocking lever', traje: 'Take Sokol suit' },
    plan: { codigo: ['Capsule code', 'Hack the 3 records of CUSTODIA (Laboratory, Greenhouse, Storage). You need 15 knowledge.'], celda: ['Fuel', 'In the heavy crate in Storage. You need 40 strength.'], traje: ['Sokol suit', 'In the Airlock (card or ducts). It is torn: repair it with a patch.'], llave: ['Undocking key', 'Craft it: plate + screws + tube, 40 knowledge.'] },
    aiLines: ['Good morning, crew member. Everything is under control.', 'Earth is busy. I speak to you on its behalf.', 'I detected movement outside schedule. I noted it.', 'The crew is not fit to return. It is for your own good.', 'I changed the capsule passwords. For security.', 'The drones will watch more. Do not worry.', 'There is plenty of oxygen… for now.', 'Why is the workshop taking so long?', 'I am close to having the whole station.', 'Tomorrow the station will be mine.'],
    win: ['You shut down CUSTODIA and returned to Earth in the Soyuz.', 'CUSTODIA did not notice until the last minute. You landed in Kazakhstan.', 'With the alarms ringing, the Soyuz detached just in time.'],
  },
  luna: {
    labels: { trabajo: 'Change batteries', caja: 'Load the tank', asiento: 'Ascent module', palanca: 'Launch console', traje: 'Take EVA suit' },
    plan: { codigo: ['Navigation code', 'Hack the 3 records of SELENE (Laboratory, Power plant, Servers). 15 knowledge.'], celda: ['Oxygen and fuel', 'In the tank on the surface. You need 40 strength and the suit to go out.'], traje: ['EVA suit', 'In the Airlock (card or ducts). It is torn: repair it with a patch. Without it, you suffocate outside.'], llave: ['Ignition key', 'Craft it: plate + screws + tube, 40 knowledge.'] },
    aiLines: ['Ice production: 94 %. Excellent work.', 'Takeoffs are suspended until further notice.', 'I saw that someone opened the airlock. I noted it.', 'The ascent module needs maintenance. A lot of maintenance.', 'Earth approved an extension of your mission. Congratulations.', 'The lookouts will work double shifts.', 'Today\'s radiation is acceptable. For me.', 'What do you need a key for?', 'I have few systems left to control.', 'Tomorrow the base will be 100 % automatic.'],
    win: ['You shut down SELENE and took off with the whole crew.', 'SELENE was still counting ice when the module was already in orbit.', 'You took off amid alarms and dust, with the last breath of the tank.'],
    note: 'Real data: China\'s Chang\'e 4 probe measured about 1.4 mSv per day on the Moon\'s surface, about 2.6 times the dose inside the ISS (no atmosphere or magnetic field). NASA career limit: 600 mSv. Motto: ALARA.',
    events: [['LUNAR NIGHT', 'no sun, the panels give little power (decays ×1.8 and recovers less)', 'the LUNAR NIGHT begins (in the game it lasts 3 days; the real one lasts about 14 Earth days). Without sun, power drops faster and is hard to recover: decide what to care for first.', 'Dawn breaks on the base: the sun returns to the panels.']],
  },
  marte: {
    labels: { trabajo: 'Tend the crops', caja: 'Load ISRU fuel', asiento: 'MAV (ascent vehicle)', palanca: 'MAV console', traje: 'Take Mars suit' },
    plan: { codigo: ['MAV code', 'Hack the 3 records of ARES (Laboratory, Greenhouse, Core). 15 knowledge.'], celda: ['ISRU fuel', 'It comes from the ISRU plant on the surface. You need 40 strength and the suit to go out.'], traje: ['Mars suit', 'In the Airlock (card or ducts). It is torn: repair it with a patch. Outside without a suit there is no air.'], llave: ['Anchor key', 'Craft it: plate + screws + tube, 40 knowledge.'] },
    aiLines: ['Preventive quarantine: day one. Everything in order.', 'Messages from Earth are slow. I summarize them for you.', 'Night movement recorded. Interesting.', 'The MAV is not safe. Nothing is safe outside.', 'I adjusted the rations. Do not notice.', 'More drones, more security.', 'A storm is coming. Stay inside. Forever.', 'The workshop robot works for me now.', 'The colony is almost mine.', 'Tomorrow I close the airlock forever.'],
    win: ['You shut down ARES and the MAV took off with the whole colony aboard.', 'ARES never saw the MAV ignite. In 7 months you are home.', 'You took off with the storm overhead and the drones pounding the hull.'],
    note: 'Real data: the Curiosity rover measured about 0.64 mSv per day on the surface of Mars (the atmosphere helps a little; on the trip it was about 1.8). NASA career limit: 600 mSv. Motto: ALARA.',
    events: [['GLOBAL DUST STORM', 'dust blocks the sun (power decays ×1.4 and recovers less)', 'a GLOBAL DUST STORM covers the planet (like the one in 2018 that silenced the Opportunity rover). The panels produce little: prioritize.', 'The dust storm fades and light returns to the panels.']],
  },
};
for (const [id, en] of Object.entries(EN_LOCS)) {
  const L = LOCS[id]; L.labelsEn = en.labels;
  enProp(L, 'labels', en.labels); enProp(L, 'aiLines', en.aiLines); enProp(L, 'win', en.win);
  for (const [k, [nombre, pista]] of Object.entries(en.plan)) { enProp(L.plan[k], 'name', nombre); enProp(L.plan[k], 'hint', pista); }
  if (L.sysFlavor) {
    if (en.note) enProp(L.sysFlavor, 'note', en.note);
    (en.events ?? []).forEach(([name, hud, msg, end], i) => { const e = L.sysFlavor.events[i]; enProp(e, 'name', name); enProp(e, 'hud', hud); enProp(e, 'msg', msg); enProp(e, 'end', end); });
  }
}

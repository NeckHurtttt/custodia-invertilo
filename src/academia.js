// Academia de Cadetes: el tutorial de 5 salas que se juega la PRIMERA vez, antes de llegar al menú (lógica pura, sin pantalla).
//  1 · LLEGADA      aparición y contexto del juego (ventana de historia al empezar) → caminar a la sala siguiente
//  2 · DEPÓSITO     recolectar: revisar cajones con E (chip y placa)
//  3 · VIGILANCIA   detección: cruzar la zona vigilada sin que el dron te atrape (agacharse, esconderse en casilleros)
//  4 · ENTRENAMIENTO entrenar (fuerza → abrir la caja pesada con el cable) y estudiar (conocimiento → fabricar la tarjeta)
//  5 · EGRESO       usar la tarjeta en la escotilla y sentarse en el asiento de salida: "pasarse el juego"
// core.js usa ACADEMIA como un destino más (s.mode === 'academia': sin reloj, horario, peligros ni sistemas; si el dron te atrapa
// vuelves a la entrada de la zona vigilada sin perder nada). main.js dibuja la tarjeta de cada sala y la flecha. Pruebas: tests/academia.test.js.
import { T } from './i18n.js';
import { LOCS } from './locs.js';

const room = (id, es, en, x, w, kind, extra = {}) => ({ id, get name() { return T(es, en); }, x, y: 2, w, h: 6, kind, ...extra });

/** El mapa: 5 salas en fila, unidas por pasillos cortos. Hereda de la Estación los textos, el aspecto y el resto de los datos. */
export const ACADEMIA = Object.create(LOCS.estacion, Object.getOwnPropertyDescriptors({ // descriptores: así los getters de idioma siguen vivos
  id: 'academia', get name() { return T('Academia de Cadetes', 'Cadet Academy'); }, nameEn: 'Cadet Academy', icon: '🎓', ai: 'INSTRUCTORA', watcher: 'dron',
  W: 51, H: 11, theme: 'estacion', systems: false,
  rooms: [
    room('llegada', 'Llegada', 'Arrival', 2, 8, 'mando'),
    room('deposito', 'Depósito', 'Storeroom', 12, 8, 'bodega'),
    room('vigilancia', 'Zona vigilada', 'Watched zone', 22, 10, 'lab', { restricted: true }),
    room('entreno', 'Gimnasio y biblioteca', 'Gym and library', 34, 8, 'gym'),
    room('egreso', 'Egreso', 'Graduation', 44, 5, 'capsula'),
  ],
  corridors: [
    { r: [10, 4, 2, 2], a: 'llegada', b: 'deposito' },
    { r: [20, 4, 2, 2], a: 'deposito', b: 'vigilancia' },
    { r: [32, 4, 2, 2], a: 'vigilancia', b: 'entreno' },
    { r: [42, 4, 2, 2], a: 'entreno', b: 'egreso', lock: { egreso: 'tarjeta' } },
  ],
  objects: [
    { t: 'capcom', x: 5, y: 2 }, { t: 'escondite', x: 2, y: 2 },
    { t: 'cajon', x: 14, y: 2, loot: ['chip'] }, { t: 'cajon', x: 17, y: 7, loot: ['placa'] }, { t: 'cajon', x: 19, y: 2, loot: [] },
    { t: 'casillero', x: 25, y: 2 }, { t: 'casillero', x: 29, y: 7 }, { t: 'casillero', x: 30, y: 2 },
    { t: 'cinta', x: 37, y: 5 }, { t: 'estudio', x: 40, y: 2 }, { t: 'estudio', x: 35, y: 2 }, { t: 'caja', x: 39, y: 7, prize: 'cable' },
    { t: 'asiento', x: 47, y: 4, meta: true },
  ],
  routes: [[[23, 3], [31, 3], [31, 7], [23, 7], [23, 3]]],
  ducts: [], grates: [], beds: [], crew: [],
  inicio: [4.5, 5.5],
  /** Si el dron te atrapa, vuelves aquí (en el Depósito, junto a la entrada de la zona vigilada), sin perder nada. */
  reinicio: [18.5, 5.5],
  schedule: [{ from: 0, to: 1440, id: 'academia', get name() { return T('Academia de Cadetes', 'Cadet Academy'); }, room: null }],
}));

/** Requisitos de la sala 4 (con +10 por entrenamiento o estudio, son 2 de cada uno). */
export const FUERZA = 40, SABER = 35;
export const PASOS = ['llegada', 'recoger', 'vigilancia', 'entrenar', 'salida'];
export const nuevo = () => ({ i: 0, cambio: true });
export const actual = (tu) => PASOS[tu.i] ?? null;

/** Contexto general (ventana de la sala 1). */
export const contexto = () => ({
  titulo: T('ACADEMIA DE CADETES', 'CADET ACADEMY'),
  parrafos: [
    T('Bienvenido, cadete. Pronto vivirás en una base en el espacio: la Estación, la Luna o Marte.', 'Welcome, cadet. Soon you will live on a base in space: the Station, the Moon or Mars.'),
    T('Allí, la Tierra perdió la señal y la IA que controla la base está fallando: vigila a la tripulación con drones. Tu misión será mantener viva la base hasta que llegue el rescate… o encontrar tu propia salida.', 'There, Earth lost the signal and the AI that runs the base is malfunctioning: it watches the crew with drones. Your mission will be to keep the base alive until the rescue arrives… or find your own way out.'),
    T('Antes, practica aquí lo básico en 5 salas: recolectar, esconderte, entrenar, estudiar, fabricar y usar lo que fabricas. Al terminar, la base es tuya.', 'First, practise the basics here in 5 rooms: collecting, hiding, training, studying, crafting and using what you craft. When you finish, the base is yours.'),
  ],
});

/** Texto de la tarjeta de la sala actual. tactil / tel = qué controles nombrar. */
export function texto(tu, s, tactil = false, tel = false) {
  const id = actual(tu); const n = `${tu.i + 1}/${PASOS.length}`; const p = s.p; const tiene = (it) => p.inv.includes(it);
  const usar = tel ? T('toca USAR', 'tap USE') : tactil ? T('toca USAR', 'tap USE') : T('pulsa E', 'press E');
  const ok = (b) => (b ? '✔' : '◻');
  switch (id) {
    case 'llegada': return { n, titulo: T('SALA 1 · LLEGADA', 'ROOM 1 · ARRIVAL'), texto: (tactil ? T('Muévete con el joystick', 'Move with the joystick') : T('Muévete con WASD o las flechas', 'Move with WASD or the arrows')) + T(' y sigue la flecha dorada hasta el Depósito.', ' and follow the golden arrow to the Storeroom.') };
    case 'recoger': return { n, titulo: T('SALA 2 · RECOLECTA', 'ROOM 2 · COLLECT'), texto: T(`Revisa los cajones (${usar} al lado). Necesitas: ${ok(tiene('chip'))} chip · ${ok(tiene('placa'))} placa. Lo que juntas va a tu mochila.`, `Search the drawers (${usar} next to them). You need: ${ok(tiene('chip'))} chip · ${ok(tiene('placa'))} plate. What you collect goes into your backpack.`) };
    case 'vigilancia': return { n, titulo: T('SALA 3 · ZONA VIGILADA', 'ROOM 3 · WATCHED ZONE'), texto: T('El dron ve dentro de su cono amarillo. Cruza sin que te atrape: ', 'The drone sees inside its yellow cone. Cross without getting caught: ') + (tel ? T('agáchate o escóndete en un casillero (mantén USAR 2 s y elige).', 'crouch or hide in a locker (hold USE 2 s and pick).') : tactil ? T('agáchate (AGACHAR) o escóndete en un casillero (ESCONDER).', 'crouch (CROUCH) or hide in a locker (HIDE).') : T('agáchate (Shift) o escóndete en un casillero (F).', 'crouch (Shift) or hide in a locker (F).')) + T(' Si te atrapa, vuelves a empezar la sala.', ' If it catches you, you restart the room.') };
    case 'entrenar': return { n, titulo: T('SALA 4 · ENTRENA Y ESTUDIA', 'ROOM 4 · TRAIN AND STUDY'), texto: T(`${ok(p.fuerza >= FUERZA)} Entrena en la cinta (fuerza ${Math.floor(p.fuerza)}/${FUERZA}) y abre la caja pesada · ${ok(p.conoc >= SABER)} Estudia (conocimiento ${Math.floor(p.conoc)}/${SABER}) · ${ok(tiene('tarjeta'))} Fabrica la TARJETA (${tel ? 'en la rueda: FABRICAR' : tactil ? 'botón C Fabricar' : 'tecla C'}).`, `${ok(p.fuerza >= FUERZA)} Train on the treadmill (strength ${Math.floor(p.fuerza)}/${FUERZA}) and open the heavy crate · ${ok(p.conoc >= SABER)} Study (knowledge ${Math.floor(p.conoc)}/${SABER}) · ${ok(tiene('tarjeta'))} Craft the CARD (${tel ? 'on the wheel: CRAFT' : tactil ? 'button C Craft' : 'key C'}).`) };
    case 'salida': return { n, titulo: T('SALA 5 · EGRESO', 'ROOM 5 · GRADUATION'), texto: T(`Usa lo que fabricaste: la escotilla se abre con la TARJETA (${usar} junto a ella). Después siéntate en el asiento de salida.`, `Use what you crafted: the hatch opens with the CARD (${usar} next to it). Then sit in the exit seat.`) };
    default: return null;
  }
}

/** Avanza de sala cuando se cumple su objetivo. Devuelve true si cambió de paso. */
export function tick(tu, s) {
  const id = actual(tu); if (!id) return false; const enSala = (r) => roomAt(s) === r; const tiene = (it) => s.p.inv.includes(it);
  const listo = id === 'llegada' ? enSala('deposito') : id === 'recoger' ? tiene('chip') && tiene('placa') : id === 'vigilancia' ? enSala('entreno') : id === 'entrenar' ? tiene('tarjeta') : false;
  if (listo) { tu.i++; return true; }
  return false;
}
function roomAt(s) { const { x, y } = s.p; return s.L.rooms.find((r) => x >= r.x && y >= r.y && x < r.x + r.w && y < r.y + r.h)?.id ?? null; }

/** A dónde apunta la flecha dorada en cada sala. */
export function objetivo(tu, s) {
  const id = actual(tu); const sala = (rid) => { const r = s.L.rooms.find((x) => x.id === rid); return { x: r.x + r.w / 2, y: r.y + r.h / 2 }; };
  const obj = (f) => { const o = s.objects.find(f); return o ? { x: o.x + 0.5, y: o.y + 0.5 } : null; };
  if (id === 'llegada') return sala('deposito');
  if (id === 'recoger') return obj((o) => o.t === 'cajon' && o.loot.length && !s.p.inv.includes(o.loot[0]));
  if (id === 'vigilancia') return sala('entreno');
  if (id === 'entrenar') { const p = s.p; if (p.fuerza < FUERZA) return obj((o) => o.t === 'cinta'); if (!p.inv.includes('cable')) return obj((o) => o.t === 'caja'); if (p.conoc < SABER) return obj((o) => o.t === 'estudio'); return null; }
  if (id === 'salida') return roomAt(s) === 'egreso' ? obj((o) => o.meta) : { x: 42.5, y: 5 };
  return null;
}

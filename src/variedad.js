// Variedad para rejugar: cada partida y cada día cambian el mantenimiento que toca y lo que pasa en la base (como en Among Us, pero con lo nuestro).
// Lógica pura y determinista: todo sale de un hash de la semilla de la partida, el día y el sistema (NO gasta el azar de la partida: el resto del simulador sigue igual).
// Pruebas: tests/variedad.test.js.
import { T } from './i18n.js';

/** Número estable de 32 bits a partir de varios números (misma entrada → mismo resultado, en cualquier máquina). */
export const hash = (...n) => {
  let h = 2166136261;
  for (const x of n) { h ^= ((x | 0) + 0x9e3779b9) | 0; h = Math.imul(h, 16777619); h ^= h >>> 13; }
  h = Math.imul(h ^ (h >>> 15), 2246822519); h ^= h >>> 13; return h >>> 0;
};

/** Variantes de cada revisión de mantenimiento: la A es la de siempre (y la del día 1, que es la que se enseña); B y C son otros pasos. */
export const VARIANTES = ['', '_b', '_c'];
export function idMant(sem, day, sys) {
  if (day <= 1) return `mant_${sys}`;
  return `mant_${sys}${VARIANTES[hash(sem, day, sys.length * 31 + sys.charCodeAt(0)) % VARIANTES.length]}`;
}

const cl = (v) => Math.max(0, Math.min(100, v));
const sube = (y, id, v) => { y.lvl[id] = cl(y.lvl[id] + v); };

/**
 * Eventos del día. `aplica(s, y, k, n)` cambia la base y devuelve los datos que necesita `texto(args, n)` (así el texto se puede escribir en cualquier idioma).
 * k = qué tan duro es el nivel (lo malo se suaviza en Cadete); n(id) = nombre del sistema en el idioma activo.
 * Lo bueno y lo malo están parejos: un día raro ayuda, otro estorba, otro pide prioridad. Nada mata por sí solo.
 */
export const EVENTOS = [
  { id: 'suministros', tipo: 'bueno', ic: 'comida', name: ['Cápsula de suministros', 'Supply capsule'],
    aplica: (s, y) => { sube(y, 'comida', 12); sube(y, 'energia', 8); return {}; },
    texto: () => T('Llegó una cápsula con comida fresca y baterías: COMIDA +12, ENERGÍA +8.', 'A capsule arrived with fresh food and batteries: FOOD +12, POWER +8.') },
  { id: 'sol', tipo: 'bueno', ic: 'energia', name: ['Día de mucho Sol', 'A very sunny day'],
    aplica: (s, y) => { sube(y, 'energia', 12); return {}; },
    texto: () => T('Los paneles cargan de más con tanto Sol: ENERGÍA +12.', 'The panels charge extra with so much Sun: POWER +12.') },
  { id: 'cumple', tipo: 'bueno', ic: 'tripulacion', name: ['Cumpleaños en la base', 'Birthday on the base'],
    aplica: (s) => { const v = s.crew.filter((c) => !c.betrayed); const c = v.length ? v[hash(s.day, v.length, 5) % v.length] : null; if (c) c.trust = Math.min(2, c.trust + 1); s.p.energia = Math.min(100, s.p.energia + 10); return { quien: c?.name ?? '' }; },
    texto: (a) => T(`Hoy es el cumpleaños de ${a.quien || 'un compañero'}: hubo pastel de raciones y buen ánimo. Tu ENERGÍA sube y ${a.quien || 'él'} confía más en ti.`, `Today is ${a.quien || 'a crewmate'}'s birthday: there was ration cake and good spirits. Your ENERGY goes up and ${a.quien ? `${a.quien} trusts` : 'they trust'} you more.`) },
  { id: 'micrometeoritos', tipo: 'malo', ic: 'rad', name: ['Lluvia de micrometeoritos', 'Micrometeorite shower'],
    aplica: (s, y, k) => { s.integ -= 4 * k; sube(y, 'rad', -8 * k); return {}; },
    texto: () => T('Una lluvia de micrometeoritos rayó el casco: el BLINDAJE baja un poco y la base sufre.', 'A micrometeorite shower scratched the hull: the SHIELDING drops a little and the base suffers.') },
  { id: 'filtro', tipo: 'malo', ic: 'vida', name: ['Filtro gastado', 'Worn-out filter'],
    aplica: (s, y, k) => { sube(y, 'vida', -12 * k); return {}; },
    texto: (a, n) => T(`El filtro de CO₂ se gastó más rápido de lo normal: ${n('vida')} baja. Hoy conviene revisarlo primero.`, `The CO₂ filter wore out faster than usual: ${n('vida')} drops. Check it first today.`) },
  { id: 'polvo', tipo: 'malo', ic: 'energia', name: ['Polvo en los paneles', 'Dust on the panels'],
    aplica: (s, y, k) => { sube(y, 'energia', -10 * k); return {}; },
    texto: () => T('El polvo tapó los paneles solares: producen menos energía hoy (ENERGÍA −10).', 'Dust covered the solar panels: they make less power today (POWER −10).') },
  { id: 'moho', tipo: 'malo', ic: 'comida', name: ['Moho en el invernadero', 'Mold in the greenhouse'],
    aplica: (s, y, k) => { sube(y, 'comida', -10 * k); return {}; },
    texto: () => T('Apareció moho en una bandeja del invernadero: se perdió parte de la cosecha (COMIDA −10).', 'Mold appeared on a greenhouse tray: part of the harvest was lost (FOOD −10).') },
  { id: 'dosimetro', tipo: 'malo', ic: 'rad', name: ['Dosímetro descalibrado', 'Dosimeter out of calibration'],
    aplica: (s, y, k) => { sube(y, 'rad', -8 * k); return {}; },
    texto: (a, n) => T(`El dosímetro se descalibró y no se nota cuánta radiación entra: ${n('rad')} baja. Revisa el blindaje.`, `The dosimeter went out of calibration and you cannot tell how much radiation gets in: ${n('rad')} drops. Check the shielding.`) },
  { id: 'prioridad', tipo: 'reto', ic: 'alerta', name: ['Prioridad de Control', 'Control priority'],
    aplica: (s, y) => { const ids = Object.keys(y.lvl); const id = ids[hash(s.day, ids.length, 9) % ids.length]; y.prio = id; return { id }; },
    texto: (a, n) => T(`Control de Misión pide PRIORIDAD hoy: ${n(a.id)}. Si lo revisas, sube +8 extra; si lo dejas, baja el doble.`, `Mission Control asks for a PRIORITY today: ${n(a.id)}. If you check it, it goes up +8 extra; if you skip it, it drops twice as much.`) },
];

/** Probabilidad de que un día (desde el 2) traiga un evento. */
export const PROB_EVENTO = 0.7;
/** Evento de ese día (o null). Mismo `sem` y `day` → el mismo evento, así la partida es repetible. */
export function eventoDelDia(sem, day) {
  if (day < 2) return null;
  const h = hash(sem, day, 7);
  if ((h % 1000) / 1000 >= PROB_EVENTO) return null;
  return EVENTOS[(h >>> 10) % EVENTOS.length];
}
export const eventoPorId = (id) => EVENTOS.find((e) => e.id === id) ?? null;

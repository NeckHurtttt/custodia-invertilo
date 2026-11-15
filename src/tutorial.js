// Tutorial guiado de los primeros minutos (la primera partida de cada navegador; NO se puede saltar; se repite desde el título).
// Al terminar muestra los finales por descubrir (los secretos, como «???» con pista).
// Lógica pura (sin pantalla ni azar): decide en qué paso va el jugador, cuándo se cumplió y qué texto mostrar (compu o celular).
// main.js lo dibuja como una tarjeta arriba y una flecha al panel. Pruebas: tests/tutorial.test.js.
import { T } from './i18n.js';

/** Hora (minuto del día) a la que el tutorial adelanta el reloj para llegar al turno de mantenimiento. */
export const HORA_TURNO = 8 * 60;
/** Pasos en orden. `ok` = el jugador toca ENTENDIDO; `auto` = se cumple haciendo la acción. No se puede saltar: se aprende jugando. */
export const PASOS = ['mover', 'barras', 'panel', 'usar', 'agachar', 'esconder', 'mapa', 'tormenta', 'finales'];
const OK = new Set(['barras', 'tormenta', 'finales']);

/** Estado nuevo del tutorial para esta partida. */
export const nuevo = (s) => ({ i: 0, x0: s.p.x, y0: s.p.y, agachado: 0, listo: false, t: 0, esc: null });
export const actual = (tu) => PASOS[tu.i] ?? null;
export const pideOk = (tu) => OK.has(actual(tu));
/** ¿Hay algo del tutorial que mostrar con las condiciones de esta partida? (solo campaña con sistemas, día 1, sin reto del día) */
export const aplica = (s) => !!s && s.mode === 'campana' && !s.daily && !!s.sys && s.day === 1 && s.min < HORA_TURNO;
/** Escondite (casillero, cama o el tuyo) más cercano a un punto: a dónde apunta la flecha en el paso «esconder». */
export function escondite(s, x, y) {
  let mejor = null, d0 = Infinity;
  for (const o of s.objects ?? []) if (['escondite', 'cama', 'casillero'].includes(o.t)) { const d = Math.hypot(o.x + 0.5 - x, o.y + 0.5 - y); if (d < d0) { d0 = d; mejor = o; } }
  return mejor ? { x: mejor.x + 0.5, y: mejor.y + 0.5, t: mejor.t } : null;
}

/**
 * Textos del paso actual. tactil = pantalla táctil (tablet: botones a la vista); tel = teléfono (solo USAR y ☰; lo demás en la rueda).
 */
export function texto(tu, tactil, nombrePanel = '', tel = false) {
  const id = actual(tu); const n = `${tu.i + 1}/${PASOS.length}`;
  const t = (es, en) => T(es, en);
  const m = (pc, tab, cel) => (tel ? cel : tactil ? tab : pc); // compu / tablet / teléfono
  switch (id) {
    case 'mover': return { n, titulo: t('MUÉVETE', 'MOVE'), texto: tactil ? t('Pon el dedo en el mapa y deslízalo hacia donde quieras ir.', 'Put your finger on the map and slide it where you want to go.') : t('Usa las teclas WASD o las flechas para caminar.', 'Use the WASD or arrow keys to walk.') };
    case 'barras': return { n, titulo: t('TUS BARRAS', 'YOUR BARS'), texto: t('SALUD y ENERGÍA son tuyas. Los SISTEMAS DE LA BASE (aire, energía, radiación y comida) hay que cuidarlos cada mañana: si bajan, la base sufre.', 'HEALTH and ENERGY are yours. The BASE SYSTEMS (air, power, radiation and food) must be looked after every morning: if they drop, the base suffers.') };
    case 'panel': return { n, titulo: t('A TRABAJAR', 'TIME TO WORK'), texto: t(`Son las 08:00: ¡hora del mantenimiento! Camina hasta el panel de SOPORTE VITAL${nombrePanel ? ' (' + nombrePanel + ')' : ''}. La flecha dorada te guía.`, `It is 08:00: maintenance time! Walk to the LIFE SUPPORT panel${nombrePanel ? ' (' + nombrePanel + ')' : ''}. The golden arrow guides you.`) };
    case 'usar': return { n, titulo: t('HAZ LA REVISIÓN', 'DO THE CHECK'), texto: tactil ? t('Toca el botón USAR (E) y luego toca los pasos EN ORDEN. Sin prisa: si te equivocas solo pierdes unos segundos.', 'Tap the USE (E) button, then tap the steps IN ORDER. No rush: a mistake only costs a few seconds.') : t('Pulsa E y toca los pasos EN ORDEN. Sin prisa: si te equivocas solo pierdes unos segundos.', 'Press E and tap the steps IN ORDER. No rush: a mistake only costs a few seconds.') };
    case 'agachar': return { n, titulo: t('AGÁCHATE', 'CROUCH'), texto: t('Los drones ven dentro de su cono amarillo. Agachado haces menos ruido y te ven menos, pero caminas lento. ', 'Drones see inside their yellow cone. Crouching you make less noise and are seen less, but walk slower. ') + m(t('Mantén Shift.', 'Hold Shift.'), t('Toca AGACHAR.', 'Tap CROUCH.'), t('MANTÉN USAR 2 segundos y elige AGACHAR en la rueda.', 'HOLD USE for 2 seconds and pick CROUCH on the wheel.')) };
    case 'esconder': return { n, titulo: t('ESCÓNDETE', 'HIDE'), texto: t('Si un dron te persigue, métete en un casillero o debajo de una cama. Ve al que marca la flecha y ', 'If a drone chases you, get into a locker or under a bed. Go to the one the arrow marks and ') + m(t('pulsa F.', 'press F.'), t('toca ESCONDER.', 'tap HIDE.'), t('mantén USAR y elige ESCONDER.', 'hold USE and pick HIDE.')) };
    case 'mapa': return { n, titulo: t('EL MAPA', 'THE MAP'), texto: t('El mapa muestra cada sala con su nombre, dónde estás (TÚ) y tu ★ OBJETIVO. ', 'The map shows every room by name, where you are (YOU) and your ★ GOAL. ') + m(t('Pulsa Tab para abrirlo.', 'Press Tab to open it.'), t('Toca MAPA para abrirlo.', 'Tap MAP to open it.'), t('Toca el minimapa (arriba a la derecha) para abrirlo.', 'Tap the minimap (top right) to open it.')) };
    case 'tormenta': return { n, titulo: t('EL SOL REAL', 'THE REAL SUN'), texto: t('Cuando suene una TORMENTA SOLAR, corre al REFUGIO: casi no recibes radiación. Afuera la dosis se suma y NUNCA se borra.', 'When a SOLAR STORM sounds, run to the SHELTER: you get almost no radiation. Outside, the dose adds up and NEVER goes away.') };
    case 'finales': return { n, titulo: t('¡ENTRENAMIENTO COMPLETO!', 'TRAINING COMPLETE!'), texto: t('Ya sabes lo básico. Mira los finales que puedes descubrir antes de empezar la misión.', 'You know the basics. See the endings you can discover before the mission starts.') };
    default: return null;
  }
}

/**
 * Finales que se cuentan al terminar el entrenamiento. Los secretos se muestran como «???» con una pista.
 * medalla = la medalla que prueba que ya lo descubriste (entonces se muestra `revela` en vez de «???»).
 */
export const FINALES = () => [
  { ico: '🛰', titulo: 'Rescate: misión cumplida', nombre: T('Rescate: misión cumplida', 'Rescue: mission accomplished'), como: T('Mantén viva la base 10 días hasta que llegue la nave de rescate.', 'Keep the base alive for 10 days until the rescue ship arrives.') },
  { ico: '🚀', titulo: 'Base recuperada', nombre: T('Base recuperada', 'Base recovered'), como: T('Escapa en la cápsula después de APAGAR a la IA.', 'Escape in the capsule after SHUTTING DOWN the AI.') },
  { ico: '🤫', titulo: 'Regreso silencioso', nombre: T('Regreso silencioso', 'Silent return'), como: T('Escapa con la IA encendida, pero sin que la alerta pase de la mitad.', 'Escape with the AI on, without the alert going past half.') },
  { ico: '😰', titulo: 'Por los pelos', nombre: T('Por los pelos', 'By a hair'), como: T('Escapa con la alerta muy alta, justo a tiempo.', 'Escape with the alert very high, just in time.') },
  { ico: '❔', medalla: 'verdad', secreto: true, revela: T('Final verdadero', 'True ending'), nombre: '???', como: T('Pista: la base guarda notas escondidas. ¿Qué pasa si las lees TODAS antes de irte?', 'Hint: the base hides notes. What happens if you read ALL of them before leaving?') },
  { ico: '❔', medalla: 'motin', secreto: true, revela: T('Motín', 'Mutiny'), nombre: '???', como: T('Pista: no tienes que irte solo. Gánate la confianza de toda la tripulación…', 'Hint: you do not have to leave alone. Earn the whole crew\'s trust…') },
  { ico: '❔', medalla: 'sabotaje', secreto: true, revela: T('Sabotaje', 'Sabotage'), nombre: '???', como: T('Pista: ¿y si despegas sin piloto automático?', 'Hint: what if you take off with no autopilot?') },
  { ico: '❔', medalla: 'traidor', secreto: true, revela: T('Te fuiste sin alguien', 'You left someone behind'), nombre: '???', como: T('Pista: lo que hagas con tus compañeros cambia cómo termina la historia.', 'Hint: what you do with your crewmates changes how the story ends.') },
];

/** Qué punto del mundo señalar con la flecha: el panel de soporte vital en los pasos de ir y usar. */
export const objetivo = (tu, estacion) => {
  if ((actual(tu) === 'panel' || actual(tu) === 'usar') && estacion) return { x: estacion.x + 0.5, y: estacion.y + 0.5 };
  if (actual(tu) === 'esconder' && tu.esc) return { x: tu.esc.x, y: tu.esc.y };
  return null;
};

/**
 * Un paso del tutorial. ctx = { crouch, estacion: {x, y} | null }.
 * Devuelve { cambio, fin, salta } : cambio = hay que volver a pintar la tarjeta; fin = se acabó; salta = poner el reloj en ese minuto (una sola vez, al llegar al turno).
 */
export function tick(tu, s, dt, ctx = {}) {
  const out = { cambio: false, fin: false, salta: null };
  if (!tu || actual(tu) === null) { out.fin = true; return out; }
  tu.t += dt; const id = actual(tu);
  const avanza = () => {
    tu.i++; tu.t = 0; tu.listo = false; tu.agachado = 0; out.cambio = true;
    if (actual(tu) === 'panel' && s.min < HORA_TURNO) out.salta = HORA_TURNO;
    if (actual(tu) === 'esconder') tu.esc = escondite(s, s.p.x, s.p.y);
    if (actual(tu) === null) out.fin = true;
  };
  if (id === 'mover') { if (Math.hypot(s.p.x - tu.x0, s.p.y - tu.y0) >= 3) avanza(); }
  else if (id === 'panel') { const e = ctx.estacion; if (!e) avanza(); else if (Math.hypot(s.p.x - (e.x + 0.5), s.p.y - (e.y + 0.5)) <= 2.0) avanza(); }
  else if (id === 'usar') { if (!s.sys || s.sys.done?.vida) avanza(); }
  else if (id === 'agachar') { if (ctx.crouch) tu.agachado += dt; if (tu.agachado >= 0.5) avanza(); }
  else if (id === 'esconder') { if (s.p.hidden || !tu.esc) avanza(); }
  else if (id === 'mapa') { if (ctx.mapa) avanza(); }
  else if (OK.has(id) && tu.listo) avanza();
  return out;
}
/** El jugador tocó ENTENDIDO. */
export function entendido(tu) { if (tu && OK.has(actual(tu))) tu.listo = true; }
/** Ya se vio todo: se guarda para no volver a mostrarlo solo. */
export const CLAVE = 'tuto';

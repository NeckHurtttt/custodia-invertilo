// Tutorial guiado de los primeros minutos (la primera partida de cada navegador; se puede saltar y repetir desde el título).
// Lógica pura (sin pantalla ni azar): decide en qué paso va el jugador, cuándo se cumplió y qué texto mostrar (compu o celular).
// main.js lo dibuja como una tarjeta arriba y una flecha al panel. Pruebas: tests/tutorial.test.js.
import { T } from './i18n.js';

/** Hora (minuto del día) a la que el tutorial adelanta el reloj para llegar al turno de mantenimiento. */
export const HORA_TURNO = 8 * 60;
/** Pasos en orden. `ok` = el jugador toca ENTENDIDO; `auto` = se cumple haciendo la acción. */
export const PASOS = ['mover', 'barras', 'panel', 'usar', 'agachar', 'tormenta', 'fin'];
const OK = new Set(['barras', 'tormenta', 'fin']);

/** Estado nuevo del tutorial para esta partida. */
export const nuevo = (s) => ({ i: 0, x0: s.p.x, y0: s.p.y, agachado: 0, listo: false, t: 0 });
export const actual = (tu) => PASOS[tu.i] ?? null;
export const pideOk = (tu) => OK.has(actual(tu));
/** ¿Hay algo del tutorial que mostrar con las condiciones de esta partida? (solo campaña con sistemas, día 1, sin reto del día) */
export const aplica = (s) => !!s && s.mode === 'campana' && !s.daily && !!s.sys && s.day === 1 && s.min < HORA_TURNO;

/** Textos del paso actual. tactil = en celular se dice «desliza el dedo» y «botón USAR». */
export function texto(tu, tactil, nombrePanel = '') {
  const id = actual(tu); const n = `${tu.i + 1}/${PASOS.length}`;
  const t = (es, en) => T(es, en);
  switch (id) {
    case 'mover': return { n, titulo: t('MUÉVETE', 'MOVE'), texto: tactil ? t('Pon el dedo en el mapa y deslízalo hacia donde quieras ir.', 'Put your finger on the map and slide it where you want to go.') : t('Usa las teclas WASD o las flechas para caminar.', 'Use the WASD or arrow keys to walk.') };
    case 'barras': return { n, titulo: t('TUS BARRAS', 'YOUR BARS'), texto: t('SALUD y ENERGÍA son tuyas. Los SISTEMAS DE LA BASE (aire, energía, radiación y comida) hay que cuidarlos cada mañana: si bajan, la base sufre.', 'HEALTH and ENERGY are yours. The BASE SYSTEMS (air, power, radiation and food) must be looked after every morning: if they drop, the base suffers.') };
    case 'panel': return { n, titulo: t('A TRABAJAR', 'TIME TO WORK'), texto: t(`Son las 08:00: ¡hora del mantenimiento! Camina hasta el panel de SOPORTE VITAL${nombrePanel ? ' (' + nombrePanel + ')' : ''}. La flecha dorada te guía.`, `It is 08:00: maintenance time! Walk to the LIFE SUPPORT panel${nombrePanel ? ' (' + nombrePanel + ')' : ''}. The golden arrow guides you.`) };
    case 'usar': return { n, titulo: t('HAZ LA REVISIÓN', 'DO THE CHECK'), texto: tactil ? t('Toca el botón USAR (E) y luego toca los pasos EN ORDEN. Sin prisa: si te equivocas solo pierdes unos segundos.', 'Tap the USE (E) button, then tap the steps IN ORDER. No rush: a mistake only costs a few seconds.') : t('Pulsa E y toca los pasos EN ORDEN. Sin prisa: si te equivocas solo pierdes unos segundos.', 'Press E and tap the steps IN ORDER. No rush: a mistake only costs a few seconds.') };
    case 'agachar': return { n, titulo: t('AGÁCHATE', 'CROUCH'), texto: tactil ? t('Los drones ven dentro de su cono amarillo. Si te agachas haces menos ruido y te ven menos, aunque caminas más lento. Toca AGACHAR.', 'Drones see inside their yellow cone. If you crouch you make less noise and are seen less, though you walk slower. Tap CROUCH.') : t('Los drones ven dentro de su cono amarillo. Si te agachas haces menos ruido y te ven menos, aunque caminas más lento. Mantén Shift.', 'Drones see inside their yellow cone. If you crouch you make less noise and are seen less, though you walk slower. Hold Shift.') };
    case 'tormenta': return { n, titulo: t('EL SOL REAL', 'THE REAL SUN'), texto: t('Cuando suene una TORMENTA SOLAR, corre al REFUGIO: casi no recibes radiación. Afuera la dosis se suma y NUNCA se borra.', 'When a SOLAR STORM sounds, run to the SHELTER: you get almost no radiation. Outside, the dose adds up and NEVER goes away.') };
    case 'fin': return { n, titulo: t('¡LISTO, CADETE!', 'READY, CADET!'), texto: t('Cuida la base 10 días hasta que llegue el rescate. Puedes repetir este entrenamiento desde el título (MÁS OPCIONES).', 'Look after the base for 10 days until the rescue arrives. You can repeat this training from the title screen (MORE OPTIONS).') };
    default: return null;
  }
}

/** Qué punto del mundo señalar con la flecha: el panel de soporte vital en los pasos de ir y usar. */
export const objetivo = (tu, estacion) => ((actual(tu) === 'panel' || actual(tu) === 'usar') && estacion ? { x: estacion.x + 0.5, y: estacion.y + 0.5 } : null);

/**
 * Un paso del tutorial. ctx = { crouch, estacion: {x, y} | null }.
 * Devuelve { cambio, fin, salta } : cambio = hay que volver a pintar la tarjeta; fin = se acabó; salta = poner el reloj en ese minuto (una sola vez, al llegar al turno).
 */
export function tick(tu, s, dt, ctx = {}) {
  const out = { cambio: false, fin: false, salta: null };
  if (!tu || actual(tu) === null) { out.fin = true; return out; }
  tu.t += dt; const id = actual(tu);
  const avanza = () => { tu.i++; tu.t = 0; tu.listo = false; tu.agachado = 0; out.cambio = true; if (actual(tu) === 'panel' && s.min < HORA_TURNO) out.salta = HORA_TURNO; if (actual(tu) === null) out.fin = true; };
  if (id === 'mover') { if (Math.hypot(s.p.x - tu.x0, s.p.y - tu.y0) >= 3) avanza(); }
  else if (id === 'panel') { const e = ctx.estacion; if (!e) avanza(); else if (Math.hypot(s.p.x - (e.x + 0.5), s.p.y - (e.y + 0.5)) <= 2.0) avanza(); }
  else if (id === 'usar') { if (!s.sys || s.sys.done?.vida) avanza(); }
  else if (id === 'agachar') { if (ctx.crouch) tu.agachado += dt; if (tu.agachado >= 0.5) avanza(); }
  else if (OK.has(id) && tu.listo) avanza();
  return out;
}
/** El jugador tocó ENTENDIDO. */
export function entendido(tu) { if (tu && OK.has(actual(tu))) tu.listo = true; }
/** Ya se vio todo: se guarda para no volver a mostrarlo solo. */
export const CLAVE = 'tuto';

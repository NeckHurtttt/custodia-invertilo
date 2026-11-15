// Decisiones puras de la interfaz de CUSTODIA (sin DOM, sin azar). Solo LEE el estado; las reglas siguen en core.js.
// Aquí viven: el estado de color de cada barra (bien / bajo / crítico), la marca de texto que acompaña al color,
// el seguimiento de «¿me bajó de golpe?» para el aviso de daño, el pulso lento de los carteles y el resumen causal del final.
// main.js solo pinta lo que estas funciones deciden. Pruebas: tests/ui.test.js.
import { rescueStars } from './core.js';

/** Nombres de los íconos vectoriales (<symbol id="i-NOMBRE"> en index.html). Una prueba comprueba que existan todos. */
export const ICONOS = ['salud', 'energia', 'comida', 'vida', 'rad', 'alerta', 'integ', 'reloj', 'dia', 'mochila', 'fuerza', 'saber',
  'musica', 'sfx', 'full', 'pausa', 'ok', 'warn', 'bad', 'info', 'tripulacion', 'nombres', 'suave', 'jugar', 'reintentar', 'menu',
  'ayuda', 'mant', 'medalla', 'archivo', 'estacion', 'luna', 'marte', 'estrella', 'fabricar'];
/** Ícono SVG en línea (usa el sprite de index.html; hereda el color del texto). */
export const ic = (nombre, clase = '') => `<svg class="ic ${clase}" aria-hidden="true" focusable="false"><use href="#i-${nombre}"/></svg>`;

// ---------- estado de las barras: color + marca de texto + palabra (nunca solo color) ----------
export const ESTADOS = ['ok', 'warn', 'bad'];
/** Marca corta que se pega al número: vacío = bien, «!» = bajo, «!!» = crítico. Así el estado se lee aunque no se distingan los colores. */
export const MARCA = { ok: '', warn: '!', bad: '!!' };
export const PALABRA = { ok: 'bien', warn: 'bajo', bad: 'crítico' };
export const PALABRA_ALTA = { ok: 'tranquilo', warn: 'subiendo', bad: 'peligro' };

/** Umbrales por barra. mejor:'alto' → cuanto más alto mejor (salud); mejor:'bajo' → cuanto más bajo mejor (alerta, radiación).
 *  malo/medio = los números donde pasa a «crítico» / «bajo». Con malo=null la barra es informativa (fuerza, saber) y siempre es «bien». */
export const UMBRALES = {
  salud: { mejor: 'alto', malo: 25, medio: 50 },
  energia: { mejor: 'alto', malo: 25, medio: 50 },
  o2: { mejor: 'alto', malo: 30, medio: 60 },
  fuerza: { malo: null }, saber: { malo: null },
  vida: { mejor: 'alto', malo: 30, medio: 50 }, // sistemas de la base (30 = el «low» de sistemas.js)
  energiaBase: { mejor: 'alto', malo: 30, medio: 50 },
  comida: { mejor: 'alto', malo: 30, medio: 50 },
  rad: { mejor: 'bajo', malo: 75, medio: 50 }, // % del límite de la misión
  alerta: { mejor: 'bajo', malo: 70, medio: 40 },
  integ: { mejor: 'alto', malo: 30, medio: 60 },
};
/** 'ok' | 'warn' | 'bad' para la barra `id` con valor `v` (0–100). */
export function nivel(id, v) {
  const u = UMBRALES[id]; if (!u || u.malo == null || !Number.isFinite(v)) return 'ok';
  if (u.mejor === 'bajo') return v >= u.malo ? 'bad' : v >= u.medio ? 'warn' : 'ok';
  return v < u.malo ? 'bad' : v < u.medio ? 'warn' : 'ok';
}
/** Frase para el atributo title / lectores de pantalla: «Salud 23: bajo». */
export function descripcion(nombre, v, estado, alta = false) { return `${nombre} ${Math.floor(v)}${estado === 'ok' ? '' : ': ' + (alta ? PALABRA_ALTA : PALABRA)[estado]}`; }

// ---------- aviso de daño en la barra ----------
export const DANIO = { umbral: 2, ventana: 1500, enfria: 900 }; // puntos, ms, ms (como mucho ~1 aviso por segundo: nunca >3 destellos/s)
/**
 * Seguimiento de una barra: decide si hubo una CAÍDA brusca (≥ umbral puntos dentro de `ventana` ms).
 * est = estado previo (null la primera vez); v = valor ya orientado (sube = bueno; para alerta/radiación pasa -valor); t = ms.
 * Devuelve { est, caida }: caida > 0 solo cuando hay que avisar (se respeta el enfriamiento entre avisos).
 * Un desgaste lento (energía que baja poco a poco) nunca avisa: la referencia se renueva al vencer la ventana.
 */
export function seguir(est, v, t, umbral = DANIO.umbral) {
  if (!est || !Number.isFinite(v)) return { est: { ref: v, t, flash: -1e9 }, caida: 0 };
  if (v >= est.ref || t - est.t > DANIO.ventana) return { est: { ref: v, t, flash: est.flash }, caida: 0 };
  const caida = est.ref - v;
  if (caida >= umbral && t - est.flash >= DANIO.enfria) return { est: { ref: v, t, flash: t }, caida };
  return { est, caida: 0 };
}
/** Texto del número que «baja» junto a la barra: «−7» (daño) o «+8» (sube algo malo, como la alerta). */
export const textoDanio = (caida, sube = false) => `${sube ? '+' : '−'}${Math.max(1, Math.round(caida))}`;

// ---------- pulso lento (reemplaza a los textos que alternaban de color 2-3 veces por segundo) ----------
/** 0…1 suave, con `hz` ciclos por segundo (por defecto 0,8 Hz: bien por debajo del límite de 3 destellos/s). */
export const pulso = (tMs, hz = 0.8) => 0.5 + 0.5 * Math.sin((tMs / 1000) * hz * 2 * Math.PI);
/** Alterna entre dos valores como mucho `hz` veces por segundo (para cosas diminutas del mapa). Nunca más de 1,5 Hz. */
export const alterna = (tMs, hz = 0.8) => Math.floor(tMs / (500 / Math.min(1.5, hz))) % 2 === 1;

// ---------- paneles y botones según el ancho de pantalla ----------
/** ¿Pantalla angosta (teléfono en vertical)? Cambia la forma del HUD y activa los controles táctiles. */
export const esAngosta = (ancho) => ancho <= 600;
/** Geometría del minimapa: en pantallas angostas es más chico para no tapar el HUD. */
export function geomMinimapa(ancho, zoom, W, H) {
  const k = esAngosta(ancho) ? 1 : zoom;
  return { k, w: W * k, h: H * k, oy: esAngosta(ancho) ? 52 : 46, borde: 10 };
}

import { T } from './i18n.js';

// ---------- resumen causal del final: qué pasó + qué aprender ----------
/** Título del final en inglés (la clave española sigue siendo la del juego). */
const TITULOS_EN = { 'Rescate: misión cumplida': 'Rescue: mission accomplished', 'Evacuación médica': 'Medical evacuation', 'Base perdida': 'Base lost', 'Sin aire respirable': 'No breathable air', 'Sin raciones': 'Out of rations', 'Dosis límite superada': 'Dose limit exceeded', 'Amaneció': 'Dawn came', 'Sin salida': 'No way out', 'Despresurización': 'Depressurization', 'Incendio eléctrico': 'Electrical fire', 'Intoxicación por CO₂': 'CO₂ poisoning', 'Dosis aguda de radiación': 'Acute radiation dose', 'Incendio a bordo': 'Fire on board', 'Final verdadero': 'True ending', 'Base recuperada': 'Base recovered', 'Regreso silencioso': 'Silent return', 'Por los pelos': 'By a hair' };
export const tituloFin = (t) => (String(t).endsWith(' ganó') ? T(t, `${String(t).slice(0, -5)} won`) : T(t, TITULOS_EN[t] ?? t));
const CONSEJOS_EN = {
  'Evacuación médica': 'Health recovers by itself while POWER is above 30, and eating in the mess hall gives +35 energy and +10 health. If the HEALTH bar drops below 50 %, stop taking risks and eat or rest.',
  'Base perdida': 'The base INTEGRITY drops when problems are left unsolved. Handle the ones with a countdown first and solve them with their protocol.',
  'Sin aire respirable': 'Do the LIFE SUPPORT check first every morning (08:00–12:00): it protects the air you breathe. On the real station it is also the first thing to check.',
  'Sin raciones': 'Check the greenhouse (FOOD) every morning. Growing food on board is part of the daily maintenance of a mission.',
  'Dosis límite superada': "Check the shielding and the dosimeter every day so the dose adds up slowly. NASA's rule is called ALARA: as little radiation as reasonably achievable.",
  'Amaneció': 'In ONE NIGHT you have to leave before 06:00. Move the plan forward without stopping and dodge the roll call.',
  'Sin salida': 'With the launch countdown running every second counts: prepare everything first and go straight to the exit.',
};
const REFLEJOS = ['Despresurización', 'Incendio eléctrico', 'Intoxicación por CO₂', 'Dosis aguda de radiación', 'Incendio a bordo'];
const CONSEJOS = {
  'Evacuación médica': 'La salud se recupera sola mientras la ENERGÍA esté sobre 30, y comer en el comedor da +35 de energía y +10 de salud. Si la barra de SALUD baja del 50 %, deja de arriesgarte y come o descansa.',
  'Base perdida': 'La INTEGRIDAD de la base baja cuando los problemas se quedan sin resolver. Atiende primero los que tienen cuenta atrás y resuélvelos con su protocolo.',
  'Sin aire respirable': 'Haz primero la revisión de SOPORTE VITAL cada mañana (08:00–12:00): es la que protege el aire que respiras. En la estación real también es lo primero que se revisa.',
  'Sin raciones': 'Revisa el invernadero (COMIDA) cada mañana. Producir alimento a bordo es parte del mantenimiento diario de una misión.',
  'Dosis límite superada': 'Revisa el blindaje y el dosímetro cada día para que la dosis sume poco. La regla de la NASA se llama ALARA: tan poca radiación como sea razonable.',
  'Amaneció': 'En UNA NOCHE hay que irse antes de las 06:00. Avanza el plan sin parar y esquiva al pase de lista.',
  'Sin salida': 'Con la cuenta atrás del despegue en marcha cada segundo cuenta: prepara todo antes y ve directo a la salida.',
};
/**
 * Resume una partida terminada: { ganaste, titulo, texto, aprende, estrellas, datos, pistas }.
 *  - texto = lo que pasó (el motivo exacto que escribió el juego), aprende = una sola idea útil para la próxima vez.
 *  - estrellas = los 3 criterios (solo si ganaste) para que se entienda cómo conseguir más.
 *  - datos = números de la partida con ícono; pistas = hasta 3 consejos según lo que hiciste.
 */
export function resumenFin(s) {
  const o = s.over ?? { won: false, title: '', text: '', stars: 0 }; const st = s.stats ?? {}; const y = s.sys?.st;
  const ganaste = !!o.won; const ia = s.L?.ai ?? 'la IA';
  let aprende = T(CONSEJOS[o.title] ?? '', CONSEJOS_EN[o.title] ?? CONSEJOS[o.title] ?? '');
  if (!aprende && REFLEJOS.includes(o.title)) aprende = T('Con REFLEJOS activado, cuando suena la emergencia hay que correr al punto rojo y pulsar E antes de que acabe la cuenta. Si prefieres más calma, apaga REFLEJOS en el menú.', 'With REFLEXES on, when the emergency sounds you must run to the red dot and press E before the countdown ends. If you prefer it calmer, turn REFLEXES off in the menu.');
  if (!aprende && String(o.title).endsWith(' ganó')) aprende = T('Los días pasan rápido: avanza un poco el PLAN DE REGRESO [2] cada día sin dejar de cumplir la rutina, y apaga o engaña a la IA cuando puedas.', 'Days pass quickly: move the RETURN PLAN [2] forward a little each day without skipping the routine, and shut down or trick the AI when you can.');
  if (!aprende) aprende = ganaste ? T('Probaste una ruta de escape. ¿Y si pruebas otra (plan, sabotaje o motín) o escapas sin que te atrapen?', 'You tried one escape route. What if you try another (plan, sabotage or mutiny) or escape without being caught?') : T('Cada intento enseña algo: mira el cartel de AHORA para saber dónde ir y vigila las barras con «!».', 'Every attempt teaches something: check the NOW sign to know where to go and watch the bars marked with «!».');
  const rescate = ganaste && o.route === 'rescate';
  const rs = rescate ? rescueStars(s) : null;
  if (rescate) aprende = T('Ganaste como en una misión real: mantener el soporte vital, la energía, la comida y protegerse de la radiación todos los días es lo que trae a la tripulación de vuelta.', 'You won like on a real mission: keeping life support, power and food going and protecting yourself from radiation every day is what brings the crew back.');
  const estrellas = rescate ? [
    { ok: true, txt: T('La tripulación llegó viva al rescate', 'The crew reached the rescue alive') },
    { ok: rs.cuidada, txt: T('Sistemas cuidados (promedio de 70 % o más)', 'Systems cared for (average of 70 % or more)') },
    { ok: rs.segura, txt: T('Poca radiación (menos de 50 % del límite) y base sana', 'Low radiation (under 50 % of the limit) and a healthy base') },
  ] : ganaste ? [
    { ok: true, txt: T('Escapaste de la base', 'You escaped the base') },
    { ok: !s.iaOn, txt: T(`Apagaste a ${ia}`, `You shut down ${ia}`) },
    { ok: (s.alert ?? 100) < 50 && (s.integ ?? 0) >= 50, txt: T('Alerta menor a 50 e integridad de 50 o más', 'Alert under 50 and integrity of 50 or more') },
  ] : [];
  const datos = [
    { ic: 'alerta', txt: T(`Te atraparon ${st.caught ?? 0} ${st.caught === 1 ? 'vez' : 'veces'}`, `You were caught ${st.caught ?? 0} ${st.caught === 1 ? 'time' : 'times'}`) },
    { ic: 'ok', txt: T(`${st.solved ?? 0} ${st.solved === 1 ? 'problema resuelto' : 'problemas resueltos'}`, `${st.solved ?? 0} ${st.solved === 1 ? 'problem solved' : 'problems solved'}`) },
    { ic: 'integ', txt: T(`Integridad final ${Math.max(0, Math.round(s.integ ?? 0))} %`, `Final integrity ${Math.max(0, Math.round(s.integ ?? 0))} %`) },
  ];
  if (y) datos.unshift({ ic: 'mant', txt: T(`${y.done ?? 0} ${y.done === 1 ? 'revisión hecha' : 'revisiones hechas'} · ${y.skipped ?? 0} ${y.skipped === 1 ? 'omitida' : 'omitidas'}`, `${y.done ?? 0} ${y.done === 1 ? 'check done' : 'checks done'} · ${y.skipped ?? 0} skipped`) });
  if (s.dFlare?.result) datos.push({ ic: 'rad', txt: s.dFlare.result === 'refugio' ? T(`Llamarada ${s.dFlare.flare.cls}: te refugiaste`, `Flare ${s.dFlare.flare.cls}: you sheltered`) : T(`Llamarada ${s.dFlare.flare.cls}: te alcanzó afuera`, `Flare ${s.dFlare.flare.cls}: it reached you outside`) });
  const pistas = [];
  if (y && y.skipped > 0) pistas.push(T(`Omitiste ${y.skipped} ${y.skipped === 1 ? 'revisión' : 'revisiones'} de mantenimiento: cada una cuesta nivel, integridad y alerta.`, `You skipped ${y.skipped} maintenance ${y.skipped === 1 ? 'check' : 'checks'}: each one costs level, integrity and alert.`));
  if ((st.caught ?? 0) >= 3) pistas.push(T('Te atraparon varias veces: agáchate (Shift) para ser silencioso y evita el cono amarillo de los drones.', 'You were caught several times: crouch (Shift) to be quiet and avoid the yellow cone of the drones.'));
  if (!ganaste && (s.alert ?? 0) >= 70) pistas.push(T('Tu alerta llegó muy alta: cumplir el horario y no hacer cosas raras a la vista la mantiene baja.', 'Your alert got very high: following the schedule and not doing strange things in plain sight keeps it low.'));
  if (ganaste && !estrellas[2].ok) pistas.push(T('Para la 3.ª estrella termina con la alerta baja y la base en buen estado.', 'For the 3rd star, finish with low alert and the base in good shape.'));
  return { ganaste, titulo: tituloFin(o.title), texto: o.text, aprende, estrellas, datos, pistas: pistas.slice(0, 3) };
}

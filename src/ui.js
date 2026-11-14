// Decisiones puras de la interfaz de LIFELINE: Rutina (sin DOM, sin azar). Solo LEE el estado; las reglas siguen en core.js.
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

// ---------- resumen causal del final: qué pasó + qué aprender ----------
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
  let aprende = CONSEJOS[o.title] ?? '';
  if (!aprende && REFLEJOS.includes(o.title)) aprende = 'Con REFLEJOS activado, cuando suena la emergencia hay que correr al punto rojo y pulsar E antes de que acabe la cuenta. Si prefieres más calma, apaga REFLEJOS en el menú.';
  if (!aprende && String(o.title).endsWith(' ganó')) aprende = 'Los días pasan rápido: avanza un poco el PLAN DE REGRESO [2] cada día sin dejar de cumplir la rutina, y apaga o engaña a la IA cuando puedas.';
  if (!aprende) aprende = ganaste ? 'Probaste una ruta de escape. ¿Y si pruebas otra (plan, sabotaje o motín) o escapas sin que te atrapen?' : 'Cada intento enseña algo: mira el cartel de AHORA para saber dónde ir y vigila las barras con «!».';
  const rescate = ganaste && o.route === 'rescate';
  const rs = rescate ? rescueStars(s) : null;
  if (rescate) aprende = 'Ganaste como en una misión real: mantener el soporte vital, la energía, la comida y protegerse de la radiación todos los días es lo que trae a la tripulación de vuelta.';
  const estrellas = rescate ? [
    { ok: true, txt: 'La tripulación llegó viva al rescate' },
    { ok: rs.cuidada, txt: 'Sistemas cuidados (promedio de 70 % o más)' },
    { ok: rs.segura, txt: 'Poca radiación (menos de 50 % del límite) y base sana' },
  ] : ganaste ? [
    { ok: true, txt: 'Escapaste de la base' },
    { ok: !s.iaOn, txt: `Apagaste a ${ia}` },
    { ok: (s.alert ?? 100) < 50 && (s.integ ?? 0) >= 50, txt: 'Alerta menor a 50 e integridad de 50 o más' },
  ] : [];
  const datos = [
    { ic: 'alerta', txt: `Te atraparon ${st.caught ?? 0} ${st.caught === 1 ? 'vez' : 'veces'}` },
    { ic: 'ok', txt: `${st.solved ?? 0} ${st.solved === 1 ? 'problema resuelto' : 'problemas resueltos'}` },
    { ic: 'integ', txt: `Integridad final ${Math.max(0, Math.round(s.integ ?? 0))} %` },
  ];
  if (y) datos.unshift({ ic: 'mant', txt: `${y.done ?? 0} ${y.done === 1 ? 'revisión hecha' : 'revisiones hechas'} · ${y.skipped ?? 0} ${y.skipped === 1 ? 'omitida' : 'omitidas'}` });
  const pistas = [];
  if (y && y.skipped > 0) pistas.push(`Omitiste ${y.skipped} ${y.skipped === 1 ? 'revisión' : 'revisiones'} de mantenimiento: cada una cuesta nivel, integridad y alerta.`);
  if ((st.caught ?? 0) >= 3) pistas.push('Te atraparon varias veces: agáchate (Shift) para ser silencioso y evita el cono amarillo de los drones.');
  if (!ganaste && (s.alert ?? 0) >= 70) pistas.push('Tu alerta llegó muy alta: cumplir el horario y no hacer cosas raras a la vista la mantiene baja.');
  if (ganaste && !estrellas[2].ok) pistas.push('Para la 3.ª estrella termina con la alerta baja y la base en buen estado.');
  return { ganaste, titulo: o.title, texto: o.text, aprende, estrellas, datos, pistas: pistas.slice(0, 3) };
}

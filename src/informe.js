// Bitácora de la misión: el informe causal del final («qué pasó cada día y por qué»).
// Lógica pura (sin pantalla): lee lo que anotó sistemas.js (historial) y arma renglones y causas. Pruebas: tests/informe.test.js.
import { T } from './i18n.js';
import { SYS, SYS_IDS, DOSE_LIMIT, WORK, historial } from './sistemas.js';

/** Verde / ámbar / rojo de un nivel 0–100 (igual que las barras del HUD: el número siempre va escrito, nunca solo el color). */
export const estadoNivel = (v) => (v < 30 ? 'bad' : v < 60 ? 'warn' : 'ok');
const lista = (ids) => { const n = ids.map((id) => SYS[id].name); return n.length > 1 ? `${n.slice(0, -1).join(', ')} ${T('y', 'and')} ${n[n.length - 1]}` : n[0]; };
const horas = (min) => Math.max(1, Math.round(min / 60));
const PESO = { afuera: 4, energia: 3, omitido: 2, refugio: 1, perfecto: 1 };
export const MAX_CAUSAS = 4;

/**
 * Informe de una partida con sistemas (o null si el modo no los tiene):
 *  - dias: un renglón por día { day, lvl: {vida, energia, rad, comida}, dosePct, hechas (0–4), storm: null | 'refugio' | 'afuera', curso? }.
 *  - causas: hasta 4 frases «Día N: hiciste X → pasó Y», lo más grave primero al elegir y en orden de día al mostrar.
 *  - perfectos: días con las 4 revisiones hechas.
 */
export function informe(s) {
  if (!s.sys) return null;
  const h = historial(s);
  const dias = h.map((d) => ({ day: d.day, lvl: d.lvl, dosePct: Math.round((d.dose / DOSE_LIMIT) * 100), hechas: SYS_IDS.length - d.skip.length, storm: d.storm ? (d.storm.ref ? 'refugio' : 'afuera') : null }));
  // el día en curso: cuentan las revisiones ya hechas; si el turno aún no terminó, se marca «en curso» (no se juzga todavía)
  const hoy = dias[dias.length - 1]; hoy.hechas = SYS_IDS.filter((id) => s.sys.done[id]).length; hoy.curso = s.day === hoy.day && s.min < WORK.to && hoy.hechas < SYS_IDS.length;
  const todas = [];
  for (const d of h) {
    const st = d.storm;
    if (st && !st.ref) todas.push({ day: d.day, tipo: 'afuera', ic: 'rad', txt: T(`Día ${d.day}: te quedaste afuera en la tormenta solar ${st.cls} → +${st.got} mSv que no se borran (en el refugio habrían sido ${st.could}).`, `Day ${d.day}: you stayed outside during the ${st.cls} solar storm → +${st.got} mSv that never go away (in the shelter it would have been ${st.could}).`) });
    if (st && st.ref) todas.push({ day: d.day, tipo: 'refugio', ic: 'ok', txt: T(`Día ${d.day}: fuiste al refugio en la tormenta solar ${st.cls} → solo ${st.got} mSv en vez de ${st.worst}. Costó tiempo y energía.`, `Day ${d.day}: you went to the shelter during the ${st.cls} solar storm → only ${st.got} mSv instead of ${st.worst}. It cost time and power.`) });
    if (d.low >= 60) todas.push({ day: d.day, tipo: 'energia', ic: 'energia', txt: T(`Día ${d.day}: la ENERGÍA estuvo bajo 35 % unas ${horas(d.low)} h → soporte vital, blindaje y comida bajaron 1,6 veces más rápido.`, `Day ${d.day}: POWER stayed below 35 % for about ${horas(d.low)} h → life support, shielding and food dropped 1.6 times faster.`) });
    if (d.skip.length) todas.push({ day: d.day, tipo: 'omitido', ic: 'alerta', txt: T(`Día ${d.day}: quedó sin revisar ${lista(d.skip)} → ${d.skip.length > 1 ? 'bajaron' : 'bajó'} y la IA subió la alerta.`, `Day ${d.day}: ${lista(d.skip)} ${d.skip.length > 1 ? 'were' : 'was'} left unchecked → ${d.skip.length > 1 ? 'they' : 'it'} dropped and the AI raised the alert.`) });
  }
  const perfectos = h.filter((d) => !d.skip.length).length;
  if (perfectos === h.length && h.length > 1) todas.push({ day: h.length, tipo: 'perfecto', ic: 'estrella', txt: T(`Hiciste las 4 revisiones los ${h.length} días: por eso los sistemas siguen arriba.`, `You did all 4 checks on all ${h.length} days: that is why the systems are still up.`) });
  const causas = todas.map((c, i) => ({ ...c, i })).sort((a, b) => PESO[b.tipo] - PESO[a.tipo] || a.i - b.i).slice(0, MAX_CAUSAS).sort((a, b) => a.i - b.i).map(({ i, ...c }) => c);
  return { dias, causas, perfectos };
}

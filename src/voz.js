// LEER EN VOZ ALTA: usa la síntesis de voz que ya trae el navegador (Web Speech API): sin librerías, sin enviar nada a ningún servidor nuestro.
// Ayuda a quien lee poco (niños de 7 años) y a quien prefiere escuchar. Las partes puras (limpiar el texto, partirlo, elegir la voz) se prueban en Node;
// hablar() solo funciona en el navegador y se apaga solo si no hay síntesis. Español e inglés según el idioma del juego (ver i18n.js).
import { getLang, conVozIdioma } from './i18n.js';

/** Idioma de la voz según el idioma del juego. */
export const idiomaVoz = (l = getLang()) => (l === 'en' ? 'en-US' : 'es-ES');

/** Texto limpio para que suene bien: sin etiquetas, sin emojis ni símbolos de pantalla, y con las unidades dichas con palabras. */
export function limpiaTexto(html, lang = getLang()) {
  const en = lang === 'en';
  return String(html ?? '')
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\bmSv\b/g, en ? 'millisieverts' : 'milisieverts')
    .replace(/CO₂/g, en ? 'C O 2' : 'C O 2').replace(/O₂/g, en ? 'O 2' : 'O 2')
    .replace(/\s*→\s*/g, en ? ' to ' : ' a ')
    .replace(/(\d)\s*%/g, en ? '$1 percent' : '$1 por ciento')
    .replace(/[\u{1F000}-\u{1FAFF}\u{2190}-\u{21FF}\u{2300}-\u{23FF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}★☆✔✘●█■♥♡▶⚠]/gu, ' ')
    .replace(/[·•|]/g, ',').replace(/\.{3,}/g, '…')
    .replace(/\s+/g, ' ').replace(/\s+([,.;:!?])/g, '$1').trim();
}

/** Parte un texto largo en trozos de frases de hasta `max` caracteres (Chrome corta las voces que duran mucho: así no se pierde nada). */
export function partir(texto, max = 180) {
  const frases = String(texto ?? '').match(/[^.!?…;:]+[.!?…;:]*\s*/g) ?? []; const trozos = []; let acum = '';
  for (const f of frases) {
    if (f.length > max) { // frase muy larga: se parte por comas o por espacios
      if (acum.trim()) { trozos.push(acum.trim()); acum = ''; }
      let resto = f; while (resto.length > max) { let i = resto.lastIndexOf(',', max); if (i < 20) i = resto.lastIndexOf(' ', max); if (i < 1) i = max; trozos.push(resto.slice(0, i + 1).trim()); resto = resto.slice(i + 1); }
      acum = resto; continue;
    }
    if ((acum + f).length > max) { if (acum.trim()) trozos.push(acum.trim()); acum = f; } else acum += f;
  }
  if (acum.trim()) trozos.push(acum.trim());
  return trozos.filter(Boolean);
}

/** La mejor voz disponible para el idioma: primero exacta (es-ES, en-US), luego del mismo idioma; sin conexión, solo voces locales. */
export function elegirVoz(voces = [], lang = getLang(), sinRed = false) {
  const meta = idiomaVoz(lang).toLowerCase(); const base = meta.slice(0, 2);
  const util = (voces ?? []).filter((v) => v && String(v.lang ?? '').toLowerCase().startsWith(base) && (!sinRed || v.localService));
  const punt = (v) => (String(v.lang).toLowerCase() === meta ? 4 : String(v.lang).toLowerCase().replace('_', '-').startsWith(meta.slice(0, 2) + '-') ? 2 : 0) + (v.localService ? 1 : 0);
  return util.sort((a, b) => punt(b) - punt(a))[0] ?? null;
}

// ---------- hablar (solo navegador) ----------
let cola = []; let hablando = false; let escucha = null; let actual = null;
const sint = () => (typeof globalThis !== 'undefined' && globalThis.speechSynthesis && typeof globalThis.SpeechSynthesisUtterance === 'function' ? globalThis.speechSynthesis : null);
export const disponible = () => !!sint() && conVozIdioma(); // en hebreo el juego va solo con texto, sin voces
export const estaHablando = () => hablando;
/** Avisa cuando empieza o termina de hablar (para marcar el botón). */
export const alCambiar = (fn) => { escucha = fn; };
const avisa = () => { try { escucha?.(hablando); } catch { /* nada */ } };

function sigue() {
  const s = sint(); if (!s) { hablando = false; avisa(); return; }
  const t = cola.shift(); if (t == null) { hablando = false; actual = null; avisa(); return; }
  const u = new globalThis.SpeechSynthesisUtterance(t); u.lang = idiomaVoz(); u.rate = 0.95; u.pitch = 1.05; u.volume = 1;
  try { const v = elegirVoz(s.getVoices?.() ?? [], getLang(), typeof navigator !== 'undefined' && navigator.onLine === false); if (v) u.voice = v; } catch { /* voz por defecto */ }
  u.onend = () => { if (actual === u) sigue(); }; u.onerror = () => { if (actual === u) sigue(); };
  const empieza = !hablando; actual = u; hablando = true; if (empieza) avisa(); try { s.speak(u); } catch { hablando = false; actual = null; avisa(); }
}
/**
 * Lee un texto en voz alta. prio: 'alta' (alertas) interrumpe lo que se esté leyendo; 'normal' lo reemplaza; 'baja' no interrumpe nada.
 * Devuelve false si no hay síntesis de voz o no había nada que leer.
 */
export function hablar(texto, { prio = 'normal', html = false } = {}) {
  const s = sint(); if (!s) return false;
  const limpio = html ? limpiaTexto(texto) : limpiaTexto(String(texto ?? '')); if (!limpio) return false;
  if (hablando && prio === 'baja') return false;
  parar(false); cola = partir(limpio); sigue(); return true;
}
export function parar(avisar = true) {
  const s = sint(); const activo = hablando || cola.length > 0 || actual !== null; cola = []; actual = null;
  if (activo) { try { s?.cancel?.(); } catch { /* nada */ } } // solo si había algo: close() y open() lo llaman a menudo y cancelar no es gratis
  if (hablando) { hablando = false; if (avisar) avisa(); }
}

// IDIOMA de lo que ve el jurado: español (por defecto) o inglés. Módulo puro: sin pantalla ni almacenamiento.
// main.js lee `?lang=en` / `?en` y `lfr.lang` con `pickLang` y llama a `setLang`; el resto del juego solo usa `T(es, en)`.
// Es solo presentación: el idioma nunca cambia reglas ni azar. Lo que no tiene traducción se queda en español.
import { HE } from './he.js';
let lang = 'es';
/** Idiomas del juego. Español e inglés completos (con voces); hebreo: solo texto, sin voces (lo que falte traducir sale en inglés). */
export const IDIOMAS = ['es', 'en', 'he'];
/** ¿Este idioma tiene voz (clips de la IA y «leer en voz alta»)? */
export const conVozIdioma = (l = lang) => l !== 'he';

export const getLang = () => lang;
export const isEn = () => lang === 'en';
export function setLang(l) { lang = l === 'en' || l === 'he' ? l : 'es'; return lang; }

/** El texto en el idioma activo. Si no hay versión en inglés, se muestra la española. */
export const T = (es, en, he) => (lang === 'es' ? es : lang === 'he' ? (he ?? HE[es] ?? en ?? es) : (en ?? es));

/** Qué idioma usar: primero la dirección (`?lang=en` o `?en`), luego lo guardado, si no español. */
export function pickLang(search = '', stored = null) {
  const q = new URLSearchParams(String(search || ''));
  const v = (q.get('lang') ?? (q.has('en') ? 'en' : q.has('es') ? 'es' : q.has('he') ? 'he' : null) ?? stored ?? 'es').toLowerCase();
  return v.startsWith('en') ? 'en' : v.startsWith('he') || v === 'iw' ? 'he' : 'es';
}

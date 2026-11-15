// IDIOMA de lo que ve el jurado: español (por defecto) o inglés. Módulo puro: sin pantalla ni almacenamiento.
// main.js lee `?lang=en` / `?en` y `lfr.lang` con `pickLang` y llama a `setLang`; el resto del juego solo usa `T(es, en)`.
// Es solo presentación: el idioma nunca cambia reglas ni azar. Lo que no tiene traducción se queda en español.
let lang = 'es';

export const getLang = () => lang;
export const isEn = () => lang === 'en';
export function setLang(l) { lang = l === 'en' ? 'en' : 'es'; return lang; }

/** El texto en el idioma activo. Si no hay versión en inglés, se muestra la española. */
export const T = (es, en) => (lang === 'en' && en != null ? en : es);

/** Qué idioma usar: primero la dirección (`?lang=en` o `?en`), luego lo guardado, si no español. */
export function pickLang(search = '', stored = null) {
  const q = new URLSearchParams(String(search || ''));
  const v = (q.get('lang') ?? (q.has('en') ? 'en' : q.has('es') ? 'es' : null) ?? stored ?? 'es').toLowerCase();
  return v.startsWith('en') ? 'en' : 'es';
}

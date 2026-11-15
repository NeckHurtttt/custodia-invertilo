// Certificado de Cadete Astronauta: una imagen para guardar, compartir o imprimir al ganar una partida.
// Solo dibujo (sin DOM ni azar): recibe un contexto de canvas y los datos; main.js lo muestra, lo descarga o lo comparte. Pruebas: tests/certificado.test.js.
import { T } from './i18n.js';

export const ANCHO = 1200, ALTO = 850;
const AMBAR = '#ffc23d', CIAN = '#5ff6ff', TEXTO = '#e8eef8', TENUE = '#9aa8c4';

/** Nombre listo para imprimir: sin espacios de más ni caracteres raros, máximo 24 letras. */
export function limpiaNombre(n) {
  return String(n ?? '').replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 24);
}
/** Nombre de archivo para descargar. */
export function nombreArchivo(d) {
  const base = (limpiaNombre(d.nombre) || 'cadete').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'cadete';
  return `certificado-custodia-${base}.png`;
}
/** Frase de lo que logró (sin repetir el resumen del final). */
export const logro = (d) => T(
  `por mantener viva la base ${d.destino} durante ${d.dias} días, hasta que llegó el rescate`,
  `for keeping the ${d.destino} base alive for ${d.dias} days, until the rescue arrived`);

/**
 * Dibuja el certificado. d = { nombre, destino, estrellas (0–3), dias, sistemas (0–100), dosis (0–100 % del límite del juego), fecha, nivel }.
 * El contexto solo necesita fillRect, fillText, strokeRect, measureText y las propiedades de estilo.
 */
export function dibujaCertificado(ctx, d) {
  const W = ANCHO, H = ALTO; const centro = (txt, y, px, color, fuente = 'VT323, monospace') => { ctx.font = `${px}px ${fuente}`; ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.fillText(txt, W / 2, y); };
  // fondo: azul de noche con estrellitas (siempre las mismas para el mismo nombre)
  ctx.fillStyle = '#0a1121'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#0f1a33'; ctx.fillRect(0, H * 0.55, W, H * 0.45);
  let h = 7; for (const ch of limpiaNombre(d.nombre) + d.destino) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  for (let i = 0; i < 90; i++) { h = (Math.imul(h, 1664525) + 1013904223) >>> 0; const x = h % W; h = (Math.imul(h, 1664525) + 1013904223) >>> 0; const y = h % H; ctx.fillStyle = i % 9 === 0 ? 'rgba(255,255,255,.8)' : 'rgba(180,200,255,.35)'; ctx.fillRect(x, y, i % 9 === 0 ? 4 : 2, i % 9 === 0 ? 4 : 2); }
  // marco doble
  ctx.strokeStyle = AMBAR; ctx.lineWidth = 6; ctx.strokeRect(28, 28, W - 56, H - 56); ctx.strokeStyle = 'rgba(95,246,255,.5)'; ctx.lineWidth = 2; ctx.strokeRect(44, 44, W - 88, H - 88);
  // insignia de la misión (dibujo propio: planeta, órbita y estrella)
  const cx = W / 2, cy = 150; ctx.fillStyle = '#16295c'; ctx.fillRect(cx - 40, cy - 40, 80, 80); ctx.fillStyle = '#3d7bff'; ctx.fillRect(cx - 32, cy - 32, 64, 64); ctx.fillStyle = '#0a1121'; ctx.fillRect(cx - 24, cy - 24, 48, 48);
  ctx.fillStyle = '#5fb6ff'; ctx.fillRect(cx - 14, cy - 8, 28, 24); ctx.fillStyle = '#2a8a5a'; ctx.fillRect(cx - 12, cy - 2, 12, 8); ctx.fillStyle = AMBAR; ctx.fillRect(cx + 14, cy - 22, 8, 8); ctx.fillRect(cx + 10, cy - 18, 16, 0);
  // textos
  centro(T('ENTRENAMIENTO DE CADETES ASTRONAUTA', 'ASTRONAUT CADET TRAINING'), 245, 34, CIAN);
  centro(T('CERTIFICADO DE CADETE', 'CADET CERTIFICATE'), 325, 84, AMBAR);
  centro(T('Se otorga a', 'Awarded to'), 400, 36, TENUE);
  const nombre = limpiaNombre(d.nombre) || T('Cadete astronauta', 'Astronaut cadet'); centro(nombre, 485, nombre.length > 16 ? 86 : 108, TEXTO);
  ctx.fillStyle = AMBAR; ctx.fillRect(W / 2 - 330, 505, 660, 3);
  centro(logro(d), 565, 36, TEXTO);
  // estrellas
  const e = Math.max(0, Math.min(3, d.estrellas | 0)); centro('★'.repeat(e) + '☆'.repeat(3 - e), 650, 78, AMBAR, 'sans-serif');
  // datos de la misión
  centro(`${T('Sistemas cuidados', 'Systems cared for')}: ${Math.round(d.sistemas)} %  ·  ${T('Radiación', 'Radiation')}: ${Math.round(d.dosis)} % ${T('del límite', 'of the limit')}  ·  ${T('Nivel', 'Level')}: ${d.nivel}`, 710, 30, TENUE);
  centro(T('La radiación se suma y nunca se borra: cuidarla es parte de volver a casa.', 'Radiation adds up and never goes away: looking after it is part of getting home.'), 750, 28, '#7f8fb0');
  centro(`CUSTODIA · NASA Space Apps 2026 · #EraConTuto · ${d.fecha}`, 805, 26, '#7f8fb0');
  ctx.textAlign = 'left';
}

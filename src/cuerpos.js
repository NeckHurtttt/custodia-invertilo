// Cómo se dibujan los astronautas (jugador, tripulación y personajes que caminan). SOLO dibujo: no toca reglas, estado ni azar.
// Cada compañero tiene su oficio a la vista (insignia, accesorio, peinado, ojos y boca que cambian con su ánimo) y el jugador es el cadete azul con su estrella.
// La animación es mínima (respirar, parpadear, mover los brazos al caminar): con efectos suaves se queda quieto. Pruebas: tests/cuerpos.test.js.
const O = '#0b0d14';
const SKINS = ['#f1c9a0', '#d9a273', '#a86d45', '#7a4b2e', '#ffdcc0'];
const HAIRS = ['#2a1a10', '#5a3418', '#c98a3a', '#1a1a22', '#8a2a1a', '#e8d27a'];
const PELOS = ['corto', 'rizado', 'largo', 'moño', 'trenza'];
const PANTS = ['#2d3a5a', '#3a3a44', '#4a3628', '#25304a'];

/** Oficio y aspecto de cada personaje con nombre propio (los nombres son las claves de personajes.js). */
export const PERFIL = {
  'María': { rol: 'comandante', skin: SKINS[1], hair: HAIRS[0], pelo: 'moño' },
  'Kenji': { rol: 'ingeniero', skin: SKINS[0], hair: HAIRS[3], pelo: 'corto' },
  'Amara': { rol: 'doctora', skin: SKINS[3], hair: HAIRS[3], pelo: 'rizado' },
  'Sofía': { rol: 'geologa', skin: SKINS[4], hair: HAIRS[4], pelo: 'largo' },
  'Nikolai': { rol: 'minero', skin: SKINS[0], hair: HAIRS[1], pelo: 'corto' },
  'Wei': { rol: 'comunicaciones', skin: '#e8c08a', hair: HAIRS[3], pelo: 'corto' },
  'Lucía': { rol: 'botanica', skin: SKINS[2], hair: HAIRS[0], pelo: 'trenza' },
  'Tomás': { rol: 'piloto', skin: SKINS[1], hair: HAIRS[2], pelo: 'corto' },
  'Aisha': { rol: 'energia', skin: SKINS[3], hair: HAIRS[0], pelo: 'rizado' },
  'Comandante': { rol: 'cadete', skin: SKINS[1], hair: HAIRS[0], pelo: 'corto' }, // el jugador
};
export const ROLES = ['comandante', 'ingeniero', 'doctora', 'geologa', 'minero', 'comunicaciones', 'botanica', 'piloto', 'energia', 'cadete', 'generico'];

const hash = (key) => { let h = 0; for (const ch of String(key)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; };
const cache = new Map();
/** Aspecto de un personaje: el de su perfil o, para cualquier otro nombre (villanos, dobles), uno estable sacado del nombre. */
export function perfil(key) {
  let p = cache.get(key); if (p) return p;
  const h = hash(key); const base = PERFIL[key];
  p = { rol: 'generico', skin: SKINS[h % SKINS.length], hair: HAIRS[(h >> 3) % HAIRS.length], pelo: PELOS[(h >> 5) % PELOS.length], ...base, pants: PANTS[(h >> 6) % PANTS.length], seed: (h % 628) / 100 };
  cache.set(key, p); return p;
}

/** Reloj de dibujo en milisegundos (lo pone main.js en cada cuadro; sirve para respirar y parpadear). */
export const reloj = { t: 0 };

/**
 * Dibuja un astronauta. o = { x, y (píxeles del mundo, ya redondeados), f: 'd'|'u'|'l'|'r', step (-1…1), key, shirt, moving, emo: 'normal'|'habla'|'feliz'|'miedo'|'enojo', anim, alpha }.
 * Cabe en la caja x−7…x+7, y−15…y+8 (lo comprueba la prueba).
 */
export function dibujaCuerpo(ctx, o) {
  const { x, y, f, step = 0, shirt, moving = false, emo = 'normal', anim = true, alpha = 1 } = o;
  const p = perfil(o.key ?? 'yo'); const t = reloj.t;
  const R = (c, dx, dy, w, h) => { ctx.fillStyle = c; ctx.fillRect(x + dx, y + dy, w, h); };
  const s = f === 'r' ? 1 : -1; const lado = f === 'l' || f === 'r';
  const S = (c, dx, dy, w, h) => R(c, s > 0 ? dx : -dx - w, dy, w, h); // dibujo de perfil: dx mide hacia donde mira
  const respira = !moving && anim ? (Math.sin(t / 420 + p.seed) > 0.55 ? 1 : 0) : 0; // baja 1 px un instante, ≈0,4 veces por segundo
  const parpadea = anim && ((t + p.seed * 337) % 3600) < 140;
  const h = respira; const rol = p.rol;
  const sombra = 'rgba(0,0,0,.3)', luz = 'rgba(255,255,255,.22)', oscuro = 'rgba(0,0,0,.22)';
  ctx.globalAlpha = alpha;
  // sombra redonda en el suelo
  R(sombra, -4, 5, 8, 2); R(sombra, -3, 4, 6, 1); R(sombra, -3, 7, 6, 1);
  if (o.ring) { ctx.strokeStyle = 'rgba(95,246,255,.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(x, y + 5.5, 7, 2.6, 0, 0, 7); ctx.stroke(); } // el jugador se distingue del resto
  // contorno
  R(O, -5, -13 + h, 10, 9); R(O, -6, -5 + h, 12, 9 - h); R(O, -4, 2, 8, 6);
  // gorro/casco/rizos agrandan la silueta
  if (p.pelo === 'rizado' || rol === 'minero' || rol === 'cadete') R(O, -6, -14 + h, 12, 4);
  if (p.pelo === 'moño' && f !== 'l' && f !== 'r') R(O, -2, -15 + h, 5, 3);
  // piernas y botas
  const a = Math.max(0, step), b = Math.max(0, -step);
  R(p.pants, -3, 2 + a, 3, 3); R(p.pants, 0, 2 + b, 3, 3);
  R('#1a1a1f', -3, 5 + a, 3, 1); R('#1a1a1f', 0, 5 + b, 3, 1); R('#586078', -3, 5 + a, 1, 1); R('#586078', 0, 5 + b, 1, 1);
  // cuerpo: mono del color del personaje con sombra a un lado, cuello blanco, cinturón e insignia
  R(shirt, -4, -4 + h, 8, 7 - h); R(luz, -4, -4 + h, 8, 1); R(oscuro, 3, -3 + h, 1, 6 - h); R('#dfe6ee', -2, -4 + h, 4, 1);
  const cinto = rol === 'ingeniero' ? '#e8832a' : rol === 'energia' ? '#ffd23d' : '#222a38';
  R(cinto, -4, 1, 8, 1);
  if (rol === 'ingeniero') { R('#a85a1a', -4, 1, 2, 2); R('#c9ccd6', 2, 2, 1, 2); } // bolsillo y llave
  if (!lado) {
    // brazos con puño blanco y mano
    R(shirt, -5, -3 + h + step, 1, 4); R(shirt, 4, -3 + h - step, 1, 4); R('#dfe6ee', -5, 0 + h + step, 1, 1); R('#dfe6ee', 4, 0 + h - step, 1, 1); R(p.skin, -5, 1 + h + step, 1, 1); R(p.skin, 4, 1 + h - step, 1, 1);
  } else {
    S(shirt, -1, -3 + h + step, 2, 4); S('#dfe6ee', -1, 0 + h + step, 2, 1); S(p.skin, -1, 1 + h + step, 2, 1);
  }
  // insignia del oficio en el pecho (de frente) o en la espalda (mochila, de espaldas)
  if (f === 'd') insignia(R, rol);
  if (f === 'u') { R('#3a4252', -3, -3 + h, 6, 4); R('#586078', -3, -3 + h, 6, 1); if (rol === 'geologa') R('#c9ccd6', 2, -2 + h, 1, 3); } // mochila de vida
  // cabeza
  const cy = -12 + h;
  R(p.skin, -4, cy, 8, 8); R('rgba(0,0,0,.12)', -4, cy + 7, 8, 1);
  pelo(R, S, p, f, cy, rol);
  if (f === 'd') cara(R, p, cy, emo, parpadea, rol);
  else if (lado) { // perfil: un ojo, una ceja y la boca al frente
    const ojo = parpadea ? p.skin : '#fff';
    S('#ffffff', 1, cy + 4, 2, 2); S(parpadea ? p.skin : O, 2, cy + 4, 1, 2); S(p.hair, 1, cy + 3, 2, 1);
    S(emo === 'habla' ? '#7a2a2a' : '#c0524a', 3, cy + 6, 1, emo === 'habla' ? 2 : 1); if (ojo === '#fff') S('#e88a8a', 0, cy + 6, 1, 1);
  }
  accesorio(R, S, p, f, cy, rol, h);
  ctx.globalAlpha = 1;
}

function insignia(R, rol) {
  switch (rol) {
    case 'comandante': R('#ffd23d', -4, -4, 2, 1); R('#ffd23d', 2, -4, 2, 1); R('#ffd23d', 1, -2, 2, 2); break; // galones y estrella
    case 'doctora': R('#fff', 1, -3, 3, 3); R('#e0453a', 2, -3, 1, 3); R('#e0453a', 1, -2, 3, 1); break; // cruz roja
    case 'geologa': R('#b58cff', 1, -3, 2, 2); R('#e5d4ff', 1, -3, 1, 1); break; // gema
    case 'minero': R('#ffc23d', 1, -3, 3, 1); R('#ffc23d', 1, -1, 3, 1); break; // franjas reflectantes
    case 'comunicaciones': R('#5fd3ff', 1, -3, 1, 3); R('#5fd3ff', 3, -3, 1, 3); R('#5fd3ff', 2, -2, 1, 1); break; // señal
    case 'botanica': R('#4fd06a', 1, -3, 3, 2); R('#a8f0b4', 1, -3, 1, 1); break; // hoja
    case 'piloto': R('#e8eef5', 1, -3, 3, 1); R('#ff6b4a', 1, -2, 3, 1); break; // alas
    case 'energia': R('#ffd23d', 2, -3, 1, 2); R('#ffd23d', 1, -1, 2, 1); R('#ffd23d', 3, -3, 1, 1); break; // rayo
    case 'cadete': R('#ffd23d', 1, -3, 3, 3); R('#fff1a8', 2, -3, 1, 1); R('#1a2a4a', 2, -2, 1, 1); break; // estrella del cadete
    default: R('#9aa8c4', 1, -3, 2, 2);
  }
}

function pelo(R, S, p, f, cy, rol) {
  if (rol === 'minero') { // casco amarillo con lámpara
    R('#ffc23d', -5, cy - 1, 10, 4); R('#fff1a8', -4, cy - 1, 3, 1); R('#c98a1a', -5, cy + 2, 10, 1);
    if (f === 'd') R('#fffbd0', -1, cy, 2, 2); if (f === 'r') R('#fffbd0', 3, cy, 2, 2); if (f === 'l') R('#fffbd0', -5, cy, 2, 2);
    return;
  }
  if (rol === 'cadete') { // gorra azul con visera
    R('#2a4aa0', -5, cy - 1, 10, 4); R('#5f86e0', -4, cy - 1, 4, 1); if (f === 'd') R('#16295c', -5, cy + 3, 10, 1); if (f === 'r') R('#16295c', 4, cy + 3, 3, 1); if (f === 'l') R('#16295c', -7, cy + 3, 3, 1);
    if (f === 'u') R(p.hair, -4, cy + 3, 8, 3);
    return;
  }
  R(p.hair, -4, cy, 8, 3); R('rgba(255,255,255,.2)', -3, cy, 3, 1);
  if (f === 'u') R(p.hair, -4, cy, 8, 7);
  if (f === 'l') R(p.hair, 1, cy, 3, 6);
  if (f === 'r') R(p.hair, -4, cy, 3, 6);
  switch (p.pelo) {
    case 'rizado': R(p.hair, -5, cy - 1, 10, 3); R(p.hair, -5, cy + 2, 1, 3); R(p.hair, 4, cy + 2, 1, 3); R('rgba(255,255,255,.18)', -3, cy - 1, 2, 1); break;
    case 'largo': if (f !== 'u') { R(p.hair, -4, cy + 2, 1, 5); R(p.hair, 3, cy + 2, 1, 5); } else R(p.hair, -4, cy + 7, 8, 2); break;
    case 'moño': if (f === 'l' || f === 'r') S(p.hair, -3, cy - 2, 3, 3); else R(p.hair, -1, cy - 2, 3, 2); break;
    case 'trenza': if (f === 'u') { R(p.hair, -1, cy + 7, 2, 4); R('#e8832a', -1, cy + 10, 2, 1); } else if (f === 'l' || f === 'r') { S(p.hair, -4, cy + 3, 2, 6); } else { R(p.hair, 3, cy + 5, 1, 4); } break;
    default: break;
  }
}

function cara(R, p, cy, emo, parpadea, rol) {
  const piel = p.skin;
  if (rol === 'piloto') { // gafas de aviador
    R(O, -3, cy + 4, 3, 2); R(O, 1, cy + 4, 3, 2); R('#3a4a6a', -3, cy + 4, 3, 1); R('#3a4a6a', 1, cy + 4, 3, 1); R('#9fd4ff', -3, cy + 4, 1, 1); R('#9fd4ff', 1, cy + 4, 1, 1); R(O, 0, cy + 4, 1, 1);
  } else if (parpadea) { R(O, -3, cy + 5, 2, 1); R(O, 1, cy + 5, 2, 1); }
  else { R('#ffffff', -3, cy + 4, 2, 2); R('#ffffff', 1, cy + 4, 2, 2); R(O, emo === 'miedo' ? -2 : -2, cy + 4, 1, 2); R(O, 1, cy + 4, 1, 2); }
  // cejas: se levantan con miedo, bajan con enojo
  const cj = emo === 'miedo' ? cy + 2 : cy + 3;
  if (rol !== 'piloto') { R(p.hair, -3, cj, 2, 1); R(p.hair, 1, cj, 2, 1); if (emo === 'enojo') { R(p.hair, -3, cj + 1, 1, 1); R(p.hair, 2, cj + 1, 1, 1); } }
  // mejillas y boca
  R('#e88a8a', -3, cy + 6, 1, 1); R('#e88a8a', 2, cy + 6, 1, 1);
  switch (emo) {
    case 'habla': R('#7a2a2a', -1, cy + 6, 2, 2); break;
    case 'feliz': R('#7a2a2a', -1, cy + 6, 2, 1); R('#7a2a2a', -2, cy + 5, 1, 1); R('#7a2a2a', 1, cy + 5, 1, 1); break;
    case 'miedo': R('#7a2a2a', 0, cy + 6, 1, 2); R(O, -2, cy + 4, 1, 1); break;
    case 'enojo': R('#7a2a2a', -1, cy + 7, 2, 1); break;
    default: R('#9a4a42', -1, cy + 6, 2, 1);
  }
  void piel;
}

function accesorio(R, S, p, f, cy, rol, h) {
  if (rol === 'ingeniero') { // gafas de trabajo sobre la frente
    if (f === 'd') { R('#7fd0ff', -3, cy + 2, 2, 1); R('#7fd0ff', 1, cy + 2, 2, 1); R('#586078', -1, cy + 2, 2, 1); } else if (f !== 'u') S('#7fd0ff', 1, cy + 2, 2, 1);
  }
  if (rol === 'comunicaciones') { // audífonos con micrófono
    R('#586078', -5, cy + 2, 1, 4); R('#586078', 4, cy + 2, 1, 4); R('#2a303c', -5, cy + 3, 1, 2); R('#2a303c', 4, cy + 3, 1, 2); R('#586078', -4, cy - 1, 8, 1);
    if (f === 'd') { R('#586078', 3, cy + 5, 1, 2); R('#e8832a', 3, cy + 7, 2, 1); }
  }
  if (rol === 'botanica' && f !== 'u') R('#4fd06a', f === 'l' ? -3 : 2, cy, 2, 1); // pasador en forma de hoja
  if (rol === 'doctora' && f === 'd') R('#c9ccd6', -2, -3 + h, 1, 3); // estetoscopio
  if (rol === 'energia') R('#ffd23d', -4, cy + 1, 8, 1); // cinta amarilla en la frente
  if (rol === 'geologa' && f === 'd') R('#8a6a3a', 3, 1, 2, 2); // martillo en el cinturón
}

/** Marcador sobre la cabeza de un compañero: un triángulo de su color que sube y baja despacio, para encontrarlo en el mapa. */
export function marca(ctx, x, y, color, anim = true) {
  const dy = anim ? Math.round(Math.sin(reloj.t / 320)) : 0;
  ctx.fillStyle = O; ctx.fillRect(x - 3, y - 20 + dy, 6, 2); ctx.fillRect(x - 2, y - 18 + dy, 4, 1); ctx.fillRect(x - 1, y - 17 + dy, 2, 1);
  ctx.fillStyle = color; ctx.fillRect(x - 2, y - 20 + dy, 4, 1); ctx.fillRect(x - 1, y - 19 + dy, 2, 1);
}

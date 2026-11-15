// Arte de CUSTODIA — solo dibujo (sin reglas del juego).
// Suelos por tipo de sala, paredes con volumen y decoración, luces, brillos y partículas.
// Todo lo "fijo" se pinta una sola vez en la capa cacheada (main.js → drawBase); lo que se mueve va en glow() y las partículas.
// Nada de esto cambia el estado del juego, así que puede usar Math.random sin afectar las partidas con semilla.
import { suave } from './fx.js';

const TS = 16;
const rect = (b, c, x, y, w, h) => { b.fillStyle = c; b.fillRect(x, y, w, h); };

/** Color base de cada tipo de sala: tonos oscuros y suaves, distintos entre sí (cálido = comedor, acero = taller, oliva = bodega, azul = dormitorio/mando, verde = vida). */
export const ROOM_TINT = { dorm: '#24314a', comedor: '#352b20', gym: '#23302a', lab: '#1f2f38', mando: '#22283a', taller: '#272c33', inver: '#1d3322', ia: '#3a1416', bodega: '#2a2c22', esclusa: '#30302a', capsula: '#2b2d40', generador: '#33291a', refugio: '#2a2236', enfer: '#26343a', obs: '#1b2234', recreo: '#33282a', antena: '#262a2e' };
/** Color de las luces del techo por tipo de sala. */
const LIGHT = { dorm: [120, 160, 245], comedor: [250, 195, 125], gym: [130, 225, 175], lab: [150, 220, 245], mando: [130, 170, 250], taller: [160, 190, 225], inver: [170, 230, 140], ia: [255, 80, 90], bodega: [225, 215, 150], esclusa: [240, 215, 130], capsula: [175, 190, 250], generador: [250, 215, 120], refugio: [185, 150, 245], enfer: [190, 240, 230], obs: [120, 150, 245], recreo: [245, 170, 190], antena: [150, 215, 245] };
/** Velo suave por destino sobre pisos y pasillos: la Luna se ve azul-gris y Marte rojiza, sin cambiar el color propio de cada sala. */
const WASH = { estacion: null, luna: 'rgba(120,140,190,.13)', marte: 'rgba(170,95,60,.12)' };
/** Luces guía de los pasillos (borde tenue pegado a la pared) por destino: ayudan a seguir el camino sin cansar. */
const GUIDE = { estacion: '110,170,230', luna: '140,170,225', marte: '235,175,115' };

const edge = (r, x, y) => x === r.x || y === r.y || x === r.x + r.w - 1 || y === r.y + r.h - 1;

/** Un casillero de suelo interior. at(x,y) dice si hay piso; h(n) es el azar fijo por casilla. */
export function floorTile(b, s, T, x, y, r, h, at) {
  const px = x * TS, py = y * TS; const k = r?.kind; const hh = (n) => h(x * 31 + y * 17 + n);
  // base: color de la sala con un poco de variación por casilla (para que no se vea plano)
  rect(b, r ? (r.restricted ? T.danger : ROOM_TINT[k] ?? T.floor) : T.corr, px, py, TS, TS);
  const wash = WASH[s.L.theme]; if (wash && !(r?.kind === 'ia')) rect(b, wash, px, py, TS, TS);
  rect(b, hh(1) > 0.5 ? 'rgba(255,255,255,.028)' : 'rgba(0,0,0,.05)', px, py, TS, TS);
  rect(b, 'rgba(255,255,255,.03)', px + 1, py + 1, TS - 2, TS - 2);
  if (!r) { // pasillos: línea central discontinua, luces guía junto a la pared y flechas de tráfico
    rect(b, 'rgba(255,200,60,.14)', px + 6, py + 7, 4, 2);
    if ((x + y) % 4 === 0) rect(b, 'rgba(255,255,255,.05)', px + 2, py + 2, 12, 1);
    const gc = `rgba(${GUIDE[s.L.theme] ?? GUIDE.estacion},.2)`;
    if (!at(x - 1, y)) rect(b, gc, px + 2, py, 1, TS); if (!at(x + 1, y)) rect(b, gc, px + TS - 3, py, 1, TS); if (!at(x, y + 1)) rect(b, gc, px, py + TS - 3, TS, 1);
  } else if (k === 'dorm') { // alfombra con tejido
    for (let i = 0; i < TS; i += 4) rect(b, 'rgba(255,255,255,.035)', px, py + i, TS, 1);
    if (hh(2) > 0.7) rect(b, 'rgba(180,200,255,.10)', px + (hh(3) * 13 | 0), py + (hh(4) * 13 | 0), 2, 1);
  } else if (k === 'comedor') { // linóleo en damero
    if ((x + y) % 2) rect(b, 'rgba(255,235,200,.07)', px + 1, py + 1, TS - 2, TS - 2);
    rect(b, 'rgba(0,0,0,.18)', px, py, TS, 1); rect(b, 'rgba(0,0,0,.18)', px, py, 1, TS);
  } else if (k === 'gym') { // colchoneta con líneas de carril
    rect(b, 'rgba(0,0,0,.10)', px, py, TS, TS);
    if ((x - r.x) % 4 === 0) rect(b, 'rgba(255,255,255,.16)', px + 7, py, 2, TS);
    if (hh(5) > 0.8) rect(b, 'rgba(255,255,255,.07)', px + 3, py + 3, 3, 3);
  } else if (k === 'lab') { // baldosas limpias con rejilla
    rect(b, 'rgba(210,240,255,.05)', px + 1, py + 1, TS - 2, TS - 2);
    rect(b, 'rgba(255,255,255,.07)', px + 7, py, 1, TS); rect(b, 'rgba(255,255,255,.07)', px, py + 7, TS, 1);
    if (hh(6) > 0.93) rect(b, 'rgba(95,246,255,.35)', px + 7, py + 7, 2, 2);
  } else if (k === 'mando') { // rejilla metálica y círculo de mando en el centro
    rect(b, 'rgba(0,0,0,.22)', px + 3, py + 3, TS - 6, TS - 6); rect(b, 'rgba(120,150,200,.10)', px + 3, py + 3, TS - 6, 1);
    const d = Math.hypot(x - (r.x + (r.w - 1) / 2), y - (r.y + (r.h - 1) / 2));
    if (d > 2.1 && d < 3.1) rect(b, 'rgba(95,246,255,.16)', px + 2, py + 2, TS - 4, TS - 4);
  } else if (k === 'taller') { // chapa de diamante y franjas de peligro en el borde
    for (let i = 0; i < 2; i++) { rect(b, 'rgba(255,255,255,.07)', px + 3 + i * 8, py + 3, 1, 3); rect(b, 'rgba(255,255,255,.07)', px + 7 + i * 8, py + 9, 1, 3); }
    if (edge(r, x, y)) rect(b, ((x + y) % 2) ? 'rgba(255,200,40,.16)' : 'rgba(0,0,0,.22)', px, py, TS, TS);
  } else if (k === 'inver') { // camas de cultivo
    if ((y - r.y) % 3 === 1) {
      rect(b, '#2a1d12', px, py + 2, TS, 12); rect(b, 'rgba(255,255,255,.05)', px, py + 2, TS, 1);
      if (hh(7) > 0.35) { rect(b, '#2f7a35', px + 3 + (hh(8) * 4 | 0), py + 4, 3, 3); rect(b, '#58c25a', px + 4 + (hh(8) * 4 | 0), py + 3, 1, 2); }
      if (hh(9) > 0.7) rect(b, '#58c25a', px + 10, py + 6, 3, 3);
    } else rect(b, 'rgba(120,220,140,.05)', px, py, TS, TS);
  } else if (k === 'ia') { // placas con circuitos brillantes
    rect(b, 'rgba(255,70,80,.05)', px + 1, py + 1, TS - 2, TS - 2);
    if (y % 3 === 0) { rect(b, 'rgba(255,60,70,.22)', px, py + 7, TS, 1); if (hh(10) > 0.6) rect(b, 'rgba(255,90,90,.5)', px + 6, py + 6, 3, 3); }
    if (x % 4 === 0) rect(b, 'rgba(255,60,70,.14)', px + 7, py, 1, TS);
  } else if (k === 'bodega') { // concreto con líneas pintadas
    if (hh(11) > 0.6) rect(b, 'rgba(255,255,255,.05)', px + (hh(12) * 12 | 0), py + (hh(13) * 12 | 0), 3, 2);
    if ((y - r.y) % 5 === 0) rect(b, 'rgba(255,200,40,.16)', px, py + 7, TS, 2);
  } else if (k === 'esclusa' || k === 'capsula') { // franjas de seguridad
    if (edge(r, x, y)) rect(b, ((x + y) % 2) ? 'rgba(255,200,40,.15)' : 'rgba(0,0,0,.25)', px, py, TS, TS);
    else if (k === 'capsula') { // placa blindada con remaches y una plataforma central: se distingue de la esclusa
      rect(b, 'rgba(170,190,255,.07)', px + 1, py + 1, TS - 2, TS - 2);
      for (const [ox, oy] of [[3, 3], [12, 3], [3, 12], [12, 12]]) rect(b, 'rgba(200,215,255,.28)', px + ox, py + oy, 1, 1);
      const d = Math.hypot(x - (r.x + (r.w - 1) / 2), y - (r.y + (r.h - 1) / 2)); if (d < 1.8) rect(b, 'rgba(190,205,255,.10)', px + 2, py + 2, TS - 4, TS - 4);
    } else rect(b, 'rgba(255,255,255,.04)', px + 2, py + 2, TS - 4, TS - 4);
  } else if (k === 'enfer') { // baldosa clínica con cruz verde en el centro
    rect(b, 'rgba(230,255,250,.06)', px + 1, py + 1, TS - 2, TS - 2); rect(b, 'rgba(255,255,255,.06)', px, py + 7, TS, 1);
    if (x === (r.x + (r.w >> 1)) && y === (r.y + (r.h >> 1))) { rect(b, 'rgba(80,220,140,.35)', px + 6, py + 3, 4, 10); rect(b, 'rgba(80,220,140,.35)', px + 3, py + 6, 10, 4); }
  } else if (k === 'obs') { // suelo oscuro con puntos de luz tipo estrellas
    rect(b, 'rgba(0,0,0,.14)', px, py, TS, TS); if (hh(14) > 0.7) rect(b, 'rgba(160,190,255,.45)', px + (hh(15) * 13 | 0), py + (hh(16) * 13 | 0), 1, 1);
    if ((x + y) % 3 === 0) rect(b, 'rgba(120,150,255,.07)', px + 1, py + 1, TS - 2, TS - 2);
  } else if (k === 'recreo') { // alfombra de colores
    for (let i = 0; i < TS; i += 4) rect(b, 'rgba(255,150,170,.05)', px + i, py, 2, TS);
    if (((x >> 1) + (y >> 1)) % 2) rect(b, 'rgba(255,220,140,.06)', px, py, TS, TS);
  } else if (k === 'antena') { // chapa con cables en el suelo
    rect(b, 'rgba(0,0,0,.12)', px, py, TS, TS); if (y % 2) rect(b, 'rgba(255,200,60,.14)', px, py + 8, TS, 1); rect(b, 'rgba(150,220,255,.08)', px + 7, py, 1, TS);
  } else if (k === 'refugio') { // refugio de radiación: marco lila suave y anillo central (punto de referencia en la Luna)
    rect(b, 'rgba(160,120,255,.08)', px, py, TS, TS);
    if (edge(r, x, y)) rect(b, 'rgba(190,150,255,.13)', px, py, TS, TS);
    const d = Math.hypot(x - (r.x + (r.w - 1) / 2), y - (r.y + (r.h - 1) / 2)); if (d > 1.2 && d < 2.2) rect(b, 'rgba(200,170,255,.14)', px + 2, py + 2, TS - 4, TS - 4);
  }
  if (r?.restricted && edge(r, x, y) && k !== 'esclusa' && k !== 'capsula') rect(b, ((x + y) % 2) ? 'rgba(255,70,70,.10)' : 'rgba(0,0,0,.16)', px, py, TS, TS);
  // sombra de ambiente junto a las paredes
  if (!at(x, y - 1)) { rect(b, 'rgba(0,0,0,.34)', px, py, TS, 3); rect(b, 'rgba(0,0,0,.16)', px, py + 3, TS, 2); }
  if (!at(x - 1, y)) rect(b, 'rgba(0,0,0,.2)', px, py, 2, TS);
  if (!at(x + 1, y)) rect(b, 'rgba(0,0,0,.14)', px + TS - 2, py, 2, TS);
  rect(b, 'rgba(0,0,0,.2)', px, py + TS - 1, TS, 1); rect(b, 'rgba(0,0,0,.2)', px + TS - 1, py, 1, TS);
}

/** Charcos de luz del techo (se hornean en la capa fija). */
export function lightPools(b, s) {
  for (const r of s.L.rooms) {
    if (r.outside) continue;
    const c = LIGHT[r.kind] ?? [200, 220, 255]; const spots = [];
    if (r.w >= 9) spots.push([r.x + r.w * 0.28, r.y + r.h / 2], [r.x + r.w * 0.72, r.y + r.h / 2]); else spots.push([r.x + r.w / 2, r.y + r.h / 2]);
    for (const [sx, sy] of spots) {
      const rad = Math.max(r.w, r.h) * TS * 0.42; const gr = b.createRadialGradient(sx * TS, sy * TS, 2, sx * TS, sy * TS, rad);
      gr.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},${r.restricted ? 0.14 : 0.11})`); gr.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},0)`);
      b.save(); b.beginPath(); b.rect(r.x * TS, r.y * TS, r.w * TS, r.h * TS); b.clip(); b.fillStyle = gr; b.fillRect(r.x * TS, r.y * TS, r.w * TS, r.h * TS); b.restore();
    }
  }
}

/** Una pared: cara frontal con paneles, remaches y, a veces, ventana, pantalla, rejilla o luz. */
export function wallTile(b, s, T, x, y, h, at) {
  const px = x * TS, py = y * TS; const hh = (n) => h(x * 13 + y * 7 + n);
  const faceDown = at(x, y + 1); // hay piso debajo: se ve la cara frontal
  rect(b, T.wallDark, px, py, TS, TS);
  rect(b, T.wall, px, py, TS, TS - 4);
  rect(b, T.wallTop, px, py, TS, 3); rect(b, 'rgba(255,255,255,.18)', px, py, TS, 1);
  rect(b, 'rgba(0,0,0,.25)', px + 7, py + 3, 1, TS - 7); // junta entre paneles
  rect(b, 'rgba(255,255,255,.08)', px + 8, py + 3, 1, TS - 7);
  if (!faceDown) { rect(b, 'rgba(0,0,0,.18)', px, py + 3, TS, TS - 3); return; }
  rect(b, 'rgba(0,0,0,.3)', px, py + TS - 4, TS, 4); // base oscura
  rect(b, '#9aa6b8', px + 2, py + 5, 1, 1); rect(b, '#9aa6b8', px + 13, py + 5, 1, 1); // remaches
  const v = hh(1);
  if (v < 0.07) { // ventana al espacio
    rect(b, '#0b1220', px + 3, py + 4, 10, 6); rect(b, '#5a6a80', px + 2, py + 3, 12, 1); rect(b, '#5a6a80', px + 2, py + 10, 12, 1);
    for (let i = 0; i < 4; i++) rect(b, 'rgba(220,235,255,.65)', px + 4 + (hh(i + 2) * 8 | 0), py + 5 + (hh(i + 6) * 4 | 0), 1, 1);
    rect(b, 'rgba(255,255,255,.12)', px + 3, py + 4, 4, 1);
  } else if (v < 0.14) { // pantalla de datos
    rect(b, '#10161f', px + 3, py + 4, 10, 6); rect(b, hh(3) > 0.5 ? '#5fb6ff' : '#4dff88', px + 4, py + 5, 6, 1); rect(b, 'rgba(255,255,255,.5)', px + 4, py + 7, 3, 1); rect(b, hh(4) > 0.6 ? '#ffc23d' : '#5fb6ff', px + 4, py + 9, 5, 1);
  } else if (v < 0.2) { // rejilla de ventilación
    rect(b, '#1b222c', px + 3, py + 5, 10, 5); for (let i = 0; i < 4; i++) rect(b, '#6a7686', px + 4, py + 5 + i * 1 + (i > 1 ? 0 : 0), 8, 1);
  } else if (v < 0.25) { // tira de luz
    rect(b, '#2a3340', px + 2, py + 6, 12, 3); rect(b, 'rgba(255,245,210,.6)', px + 3, py + 7, 10, 1);
  } else if (v < 0.29) { // cartel de seguridad
    rect(b, '#c9a63a', px + 4, py + 4, 8, 6); rect(b, '#1a1a1a', px + 7, py + 5, 2, 3); rect(b, '#1a1a1a', px + 7, py + 9, 2, 1);
  } else if (v < 0.34) { // tubería
    rect(b, '#46566a', px, py + 7, TS, 3); rect(b, 'rgba(255,255,255,.2)', px, py + 7, TS, 1); rect(b, '#2a3442', px + 5, py + 6, 2, 5);
  }
}

/** Superficie (Luna y Marte): balizas tenues que guían desde la esclusa hasta cada objeto de afuera, y una plataforma bajo el módulo de ascenso. Solo adorno, se pinta debajo de los objetos. */
export function surfaceMarks(b, s) {
  const ext = s.L.rooms.find((r) => r.outside); const door = s.L.corridors.find((c) => c.b === 'exterior'); if (!ext || !door) return;
  const ex = ext.x * TS, ey = (door.r[1] + door.r[3] / 2) * TS; const col = s.L.theme === 'luna' ? '190,215,255' : '255,215,170';
  const dot = (x, y) => rect(b, `rgba(${col},.5)`, Math.round(x) - 1, Math.round(y) - 1, 2, 2);
  for (const o of s.objects) {
    if (o.x < ext.x || o.y < ext.y || o.x >= ext.x + ext.w || o.y >= ext.y + ext.h) continue;
    const ox = o.x * TS + 8, oy = o.y * TS + 8; // L: primero en horizontal por la altura de la esclusa, luego en vertical hasta el objeto
    for (let x = ex + 10; x < ox - 10; x += 22) dot(x, ey);
    const dir = oy > ey ? 1 : -1; for (let y = ey + dir * 14; dir * (oy - y) > 12; y += dir * 22) dot(ox, y);
    if (o.t === 'asiento' || o.t === 'caja') { // plataforma: anillo suave
      b.strokeStyle = `rgba(${col},.22)`; b.lineWidth = 1; b.beginPath(); b.ellipse(ox, oy + 4, 20, 12, 0, 0, 7); b.stroke();
      b.beginPath(); b.ellipse(ox, oy + 4, 14, 8, 0, 0, 7); b.stroke();
    }
  }
}

/** Decoración suelta en el suelo: plantas en las esquinas de salas habitables (solo adorno, no estorba). */
export function props(b, s) {
  const taken = new Set([...s.objects.map((o) => `${o.x},${o.y}`), ...s.L.grates.map((g) => `${g[0]},${g[1]}`)]);
  const door = new Set(); for (const d of s.map.doors) for (const [x, y] of d.tiles) { for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) door.add(`${x + dx},${y + dy}`); }
  for (const r of s.L.rooms) {
    if (r.restricted || r.outside || !['dorm', 'comedor', 'lab', 'mando', 'gym'].includes(r.kind)) continue;
    for (const [x, y] of [[r.x + r.w - 1, r.y + r.h - 1], [r.x, r.y + r.h - 1]]) {
      if (taken.has(`${x},${y}`) || door.has(`${x},${y}`)) continue;
      const px = x * TS, py = y * TS;
      rect(b, 'rgba(0,0,0,.3)', px + 3, py + 13, 10, 3); rect(b, '#6b4a2a', px + 5, py + 10, 6, 5); rect(b, '#8a6038', px + 5, py + 10, 6, 1);
      rect(b, '#2f7a35', px + 3, py + 5, 4, 5); rect(b, '#58c25a', px + 6, py + 2, 4, 7); rect(b, '#3f9a45', px + 9, py + 5, 4, 5); rect(b, '#9be39c', px + 7, py + 3, 1, 2);
    }
  }
}

// ---------- luz y brillos (por cuadro, baratos: usan sprites radiales cacheados, no gradientes nuevos) ----------
const sprites = new Map();
/** Sprite radial 64×64 (centro opaco → borde transparente) del color dado; se crea una vez por color. */
function glowSprite(rgb) {
  let c = sprites.get(rgb); if (c) return c;
  c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 1, 32, 32, 32); gr.addColorStop(0, `rgba(${rgb},1)`); gr.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  sprites.set(rgb, c); return c;
}
const spot = (cx, x, y, r, rgb, a) => { cx.globalAlpha = a > 1 ? 1 : a; cx.drawImage(glowSprite(rgb), x - r, y - r, r * 2, r * 2); };
const MANT = { vida: '95,211,255', energia: '255,210,61', rad: '255,178,61', comida: '95,211,95' };

/** Brillos que pulsan sobre pantallas, núcleo y paneles de mantenimiento (luz aditiva en cada cuadro).
 *  `target` = el objeto sobre el que actuarías con E (brilla más); los demás objetos a menos de 3 casillas brillan apenas. */
export function glow(cx, s, t, vis, target = null) {
  cx.save(); cx.globalCompositeOperation = 'lighter';
  const p = s.p;
  for (const o of s.objects) {
    if (!vis(o.x, o.y)) continue; const x = o.x * TS + 8, y = o.y * TS + 8; const k = 0.75 + 0.25 * Math.sin(t / 380 + o.x);
    if (o.t === 'estudio' || o.t === 'capcom') spot(cx, x, y - 2, 26, '90,180,255', 0.22 * k);
    else if (o.t === 'registro') spot(cx, x, y, 20, s.frags[o.frag] ? '70,255,140' : '255,60,60', 0.2 * k);
    else if (o.t === 'nucleo') spot(cx, x, y, 38, '255,50,60', (s.iaOn ? 0.34 : 0.05) * (0.7 + 0.3 * Math.sin(t / 220)));
    else if (o.t === 'mant' && s.sys) spot(cx, x, y, s.sys.done[o.sys] ? 18 : 28, s.sys.done[o.sys] ? '70,255,140' : MANT[o.sys], s.sys.done[o.sys] ? 0.16 : 0.3 * k);
    else if (o.t === 'trabajo' && s.L.theme === 'estacion') spot(cx, x, y, 22, '120,255,140', 0.12 * k);
    // pista de qué se puede usar: halo cálido y lento sobre el objeto de la tecla E; tenue en los cercanos
    if (o === target) spot(cx, x, y, 22, '255,235,170', 0.2 + (suave() ? 0.04 : 0.08 * Math.sin(t / 550)));
    else if (p && o.t !== 'nucleo') { const d = Math.hypot(o.x + 0.5 - p.x, o.y + 0.5 - p.y); if (d < 3.2) spot(cx, x, y, 16, '255,235,170', 0.09 * (1 - d / 3.2)); }
  }
  const em = s.sys?.emerg; if (em) spot(cx, em.x * TS, em.y * TS, 46, '255,50,50', 0.3 + 0.2 * Math.sin(t / 180));
  cx.restore();
}

/** Luz suave alrededor del jugador (un solo drawImage). El color depende del destino. Coordenadas del mundo, en píxeles. */
const LUZ = { estacion: '190,215,255', luna: '170,190,255', marte: '255,190,140' };
export function luzJugador(cx, px, py, theme) {
  cx.save(); cx.globalCompositeOperation = 'lighter'; spot(cx, px, py - 4, 64, LUZ[theme] ?? LUZ.estacion, 0.1); cx.restore();
}

/** Luces de emergencia en las esquinas de una sala sin energía (apagón): pulso lento de ~0,8 Hz, sin parpadeo. */
export function lamparas(cx, r, t) {
  const k = suave() ? 0.6 : 0.55 + 0.45 * Math.sin(t * 0.005);
  cx.save(); cx.globalCompositeOperation = 'lighter';
  for (const [x, y] of [[r.x, r.y], [r.x + r.w, r.y], [r.x, r.y + r.h], [r.x + r.w, r.y + r.h]]) spot(cx, x * TS, y * TS, 34, '255,50,50', 0.26 * k);
  cx.restore();
}

// ---------- viñetas y tintes de pantalla (cacheados: un sprite pequeño por color, estirado a la ventana) ----------
const vigs = new Map();
function vigSprite(rgb) {
  let c = vigs.get(rgb); if (c) return c;
  c = document.createElement('canvas'); c.width = 128; c.height = 72; const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 36, 0, 64, 36, 76); gr.addColorStop(0, `rgba(${rgb},0)`); gr.addColorStop(0.5, `rgba(${rgb},0)`); gr.addColorStop(1, `rgba(${rgb},1)`); g.fillStyle = gr; g.fillRect(0, 0, 128, 72);
  vigs.set(rgb, c); return c;
}
const LV = { amb: 0, red: 0, emer: 0 };
const ease = (v, tgt, dt, up, down) => v + (tgt - v) * Math.min(1, dt * (tgt > v ? up : down));
/** Capa de pantalla (sin cámara): viñeta ligera, tinte de amenaza (ámbar = sospechan, rojo = te persiguen; sube y baja suave, nunca parpadea)
 *  y luces de emergencia con pulso lento (≤1 Hz). `aviso` 0..1 = tinte ámbar extra (p. ej. basura orbital y no estás a salvo).
 *  En modo suave: sin viñeta ni tinte de amenaza; la emergencia queda como un borde rojo fijo y tenue. */
export function overlays(cx, s, t, dt, W, H, aviso = 0) {
  const sl = suave(); const lvl = s.threat?.lvl ?? 0, sus = s.threat?.sus ?? 0;
  LV.amb = ease(LV.amb, sl ? 0 : Math.max(lvl === 1 ? 0.4 + 0.6 * sus : 0, aviso), dt, 3, 1.2);
  LV.red = ease(LV.red, sl ? 0 : lvl === 2 ? 1 : 0, dt, 3, 1);
  const emer = !!s.sys?.emerg || !!s.final || s.hazards.some((h) => h.def.type === 'blackout' && !h.def.quarantine);
  LV.emer = ease(LV.emer, emer ? 1 : 0, dt, 4, 1.5);
  cx.save(); cx.setTransform(1, 0, 0, 1, 0, 0); cx.imageSmoothingEnabled = true;
  if (!sl) { cx.globalAlpha = 0.3; cx.drawImage(vigSprite('0,0,10'), 0, 0, W, H); }
  if (LV.amb > 0.02) { cx.globalAlpha = 0.32 * LV.amb * (1 + 0.1 * Math.sin(t * 0.002)); cx.drawImage(vigSprite('255,170,40'), 0, 0, W, H); }
  if (LV.red > 0.02) { cx.globalAlpha = 0.4 * LV.red * (1 + 0.12 * Math.sin(t * 0.0022)); cx.drawImage(vigSprite('215,25,25'), 0, 0, W, H); }
  if (LV.emer > 0.02) { cx.globalAlpha = LV.emer * (sl ? 0.14 : 0.1 + 0.14 * (0.5 + 0.5 * Math.sin(t * 0.005))); cx.drawImage(vigSprite('255,40,40'), 0, 0, W, H); }
  cx.restore(); cx.imageSmoothingEnabled = false;
}

// ---------- telegrafía de enemigos y zonas de peligro ----------
const OUT = 'rgba(8,11,18,.85)'; const DASH = [4, 3]; const NODASH = [];
/** Signo sobre la cabeza: «?» que se llena de abajo arriba según e.sus (sospecha) o entero mientras e.qT > 0 (oyó algo / perdió el rastro);
 *  «!» (e.alarmT > 0) que aparece con un pequeño crecimiento y se desvanece. No parpadea. */
function signo(cx, x, y, e, t) {
  if (e.alarmT > 0) {
    const k = Math.min(1, (1.2 - e.alarmT) / 0.18);
    cx.save(); cx.globalAlpha = Math.min(1, e.alarmT / 0.3); cx.translate(x, y); cx.scale(0.5 + 0.5 * k, 0.5 + 0.5 * k);
    cx.font = '16px VT323'; cx.lineWidth = 3; cx.strokeStyle = OUT; cx.strokeText('!', 0, 0); cx.fillStyle = '#ff4b4b'; cx.fillText('!', 0, 0); cx.restore(); return;
  }
  const fill = e.qT > 0 ? 1 : Math.min(1, e.sus ?? 0); if (fill < 0.06) return;
  cx.save(); cx.font = '15px VT323'; cx.lineWidth = 3; cx.strokeStyle = OUT; cx.globalAlpha = e.qT > 0 ? 0.85 + 0.15 * Math.sin(t / 400) : 1;
  cx.strokeText('?', x, y); cx.fillStyle = 'rgba(255,194,61,.22)'; cx.fillText('?', x, y);
  cx.beginPath(); cx.rect(x - 7, y + 6 - 12 * fill, 14, 12 * fill); cx.clip(); cx.fillStyle = fill > 0.66 ? '#ff7a3d' : '#ffc23d'; cx.fillText('?', x, y); cx.restore();
}
/** Anillo tenue donde vio al jugador por última vez, mientras va a investigar. */
function rastro(cx, e) {
  if (e.mode !== 'investiga' || !e.lastSeen) return;
  cx.strokeStyle = 'rgba(255,194,61,.4)'; cx.lineWidth = 1; cx.setLineDash(DASH); cx.beginPath(); cx.arc(e.lastSeen[0] * TS, e.lastSeen[1] * TS, 6, 0, 7); cx.stroke(); cx.setLineDash(NODASH);
}
/** «?», «!», rastro y aviso de embestida de drones, tripulación sospechosa, cámaras y robots. Va encima de los sprites, en coordenadas del mundo. */
export function senales(cx, s, t, vis) {
  cx.save(); cx.textAlign = 'center'; cx.textBaseline = 'middle';
  if (s.iaOn) for (const d of s.drones) if (d.stun <= 0 && vis(d.x, d.y, 3)) { signo(cx, d.x * TS, d.y * TS - 16, d, t); rastro(cx, d); }
  if (s.vil) for (const w of s.vil.walkers) if (!w.gone && !w.away && vis(w.x, w.y, 3)) { signo(cx, w.x * TS, w.y * TS - 29, w, t); rastro(cx, w); }
  for (const h of s.hazards) {
    const ty = h.def.type;
    if (ty === 'camera') { if (s.iaOn && h.stun <= 0 && vis(h.x, h.y, 3)) signo(cx, h.x * TS, h.y * TS - 14, h, t); }
    else if (ty === 'robot' && vis(h.x, h.y, 3)) {
      signo(cx, h.x * TS, h.y * TS - 14, h, t);
      if (h.tele > 0) { // se queda fijo antes de embestir: anillo que se cierra y carril hacia donde mira
        const k = Math.min(1, h.tele / 0.6); const x = h.x * TS, y = h.y * TS;
        cx.strokeStyle = 'rgba(255,90,60,.75)'; cx.lineWidth = 1.5; cx.beginPath(); cx.arc(x, y, 8 + 20 * k, 0, 7); cx.stroke();
        cx.strokeStyle = 'rgba(255,90,60,.5)'; cx.lineWidth = 1; cx.setLineDash(DASH); cx.beginPath(); cx.moveTo(x, y); cx.lineTo(x + Math.cos(h.dir) * 48, y + Math.sin(h.dir) * 48); cx.stroke(); cx.setLineDash(NODASH);
      }
    }
  }
  cx.restore();
}
/** Brazo robótico: el hueco por donde pasar en verde, la franja por donde barre (y las 3 casillas de delante) en rojo; más intensa mientras espera (h.tele). */
export function zonaBrazo(cx, s, h, r, t) {
  const pulse = suave() ? 0.5 : 0.5 + 0.5 * Math.sin(t * 0.005); const px = h.x * TS;
  cx.fillStyle = `rgba(70,255,150,${0.1 + 0.06 * pulse})`; cx.fillRect(r.x * TS, h.gap * TS, r.w * TS, 2 * TS);
  cx.fillStyle = 'rgba(70,255,150,.35)'; cx.fillRect(r.x * TS, h.gap * TS, r.w * TS, 1); cx.fillRect(r.x * TS, (h.gap + 2) * TS - 1, r.w * TS, 1);
  const base = h.tele > 0 ? 0.3 : 0.18; const lx0 = r.x * TS, lx1 = (r.x + r.w) * TS;
  for (let k = 0; k < 4; k++) {
    const x0 = k === 0 ? px - 0.5 * TS : h.dirx > 0 ? px + 0.5 * TS + (k - 1) * TS : px - 0.5 * TS - k * TS; const a = Math.max(lx0, x0), b = Math.min(lx1, x0 + TS); if (b <= a) continue;
    cx.fillStyle = `rgba(255,75,75,${k === 0 ? base : 0.1 / k})`;
    for (let y = r.y; y < r.y + r.h; y++) if (y < h.gap || y >= h.gap + 2) cx.fillRect(a, y * TS, b - a, TS);
  }
}
/** Basura orbital: la sala segura en verde con borde discontinuo (ámbar en los últimos 10 s) y un anillo que se vacía con el tiempo. */
export function zonaRefugio(cx, s, h, t) {
  const pulse = suave() ? 0.5 : 0.5 + 0.5 * Math.sin(t * 0.004); const warn = h.t <= 10;
  for (const id of h.def.safe) {
    const r = s.L.rooms.find((x) => x.id === id); if (!r) continue;
    cx.fillStyle = `rgba(80,255,170,${0.05 + 0.05 * pulse})`; cx.fillRect(r.x * TS, r.y * TS, r.w * TS, r.h * TS);
    cx.strokeStyle = warn ? 'rgba(255,194,61,.6)' : 'rgba(80,255,170,.5)'; cx.lineWidth = 1.5; cx.setLineDash([6, 4]); cx.strokeRect(r.x * TS + 1, r.y * TS + 1, r.w * TS - 2, r.h * TS - 2); cx.setLineDash(NODASH);
    const f = Math.max(0, Math.min(1, h.t / h.def.warn)); cx.strokeStyle = warn ? 'rgba(255,194,61,.7)' : 'rgba(80,255,170,.6)'; cx.lineWidth = 2;
    cx.beginPath(); cx.arc((r.x + r.w / 2) * TS, (r.y + r.h / 2) * TS, 16, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * f); cx.stroke();
  }
}

// ---------- partículas (solo adorno) ----------
// Tope: 110 partículas en el pozo + hasta 34 motas de polvo = 144 vivas como máximo. Pozo de arreglos fijos: sin objetos ni arrays nuevos por cuadro.
const MAXP = 110, MAXM = 34;
const P = { x: new Float32Array(MAXP), y: new Float32Array(MAXP), vx: new Float32Array(MAXP), vy: new Float32Array(MAXP), life: new Float32Array(MAXP), max: new Float32Array(MAXP), size: new Float32Array(MAXP), g: new Float32Array(MAXP), dr: new Float32Array(MAXP), c: new Uint8Array(MAXP), add: new Uint8Array(MAXP) };
const PK = Object.keys(P); const PA = PK.map((k) => P[k]);
let np = 0; let spill = 0;
const COLS = []; const CIDX = new Map();
const cid = (rgb) => { let i = CIDX.get(rgb); if (i === undefined) { i = COLS.length; COLS.push(`rgb(${rgb})`); CIDX.set(rgb, i); } return i; };
/** prio=1 (impactos, éxito) sobrescribe las más viejas si el pozo está lleno; prio=0 (ambiente) se descarta y nunca llena los últimos 30 huecos. */
function emit(x, y, vx, vy, life, size, g, dr, rgb, add, prio) {
  const cap = suave() ? 50 : MAXP; let i;
  if (np < cap) { if (!prio && np > cap - 30) return; i = np++; } else if (prio && np > 0) i = spill++ % np; else return;
  P.x[i] = x; P.y[i] = y; P.vx[i] = vx; P.vy[i] = vy; P.life[i] = life; P.max[i] = life; P.size[i] = size; P.g[i] = g; P.dr[i] = dr; P.c[i] = cid(rgb); P.add[i] = add;
}
/** Explosión de chispas en coordenadas del mundo (casillas). Máx. 30 por llamada; en modo suave, la mitad. */
export function burst(x, y, color = '255,210,90', n = 14) {
  n = Math.min(30, suave() ? (n + 1) >> 1 : n);
  for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, v = 14 + Math.random() * 38; emit(x * TS, y * TS - 6, Math.cos(a) * v, Math.sin(a) * v - 14, 0.5 + Math.random() * 0.5, 1.5, 60, 0, color, 1, 1); }
}
// anillos que se expanden (impacto, éxito): pozo de 6, cada uno dura menos de medio segundo
const rings = []; for (let i = 0; i < 6; i++) rings.push({ t: 0, d: 1, x: 0, y: 0, r: 0, c: 0 }); let rh = 0;
/** Onda circular en coordenadas del mundo (casillas); r = radio final en píxeles. */
export function ring(x, y, rgb = '255,210,90', r = 24, dur = 0.45) { const q = rings[rh++ % 6]; q.t = q.d = dur; q.x = x * TS; q.y = y * TS - 4; q.r = r; q.c = cid(rgb); }
/** Pisada del jugador (px, py = píxeles del mundo, a los pies): destello frío en la Estación, polvo gris en la Luna y rojizo en Marte (más afuera). */
export function step(px, py, theme, outside) {
  if (theme === 'estacion') { if (Math.random() < 0.4) emit(px + (Math.random() - 0.5) * 6, py, 0, -6, 0.35, 1, 0, 0, '150,205,255', 1, 0); return; }
  const rgb = theme === 'luna' ? '175,185,205' : '205,125,90'; const n = outside ? 4 : 2;
  for (let i = 0; i < n; i++) emit(px + (Math.random() - 0.5) * 6, py - 1, (Math.random() - 0.5) * 14, -6 - Math.random() * 8, (outside ? 0.8 : 0.55) + Math.random() * 0.3, 2, theme === 'luna' ? 10 : 16, 2.5, rgb, 0, 0);
}
const VAPOR = { estacion: '205,230,245', luna: '195,210,235', marte: '235,180,150' };
/** Ambiente por destino: chispas en los paneles de mantenimiento pendientes y en el núcleo encendido, vapor en las rejillas. Poco y a la vista. */
export function ambiente(s, dt, vis) {
  const k = (suave() ? 0.5 : 1) * dt; const theme = s.L.theme;
  for (const o of s.objects) {
    if (o.t === 'mant' && s.sys && !s.sys.done[o.sys]) { if (Math.random() < 0.7 * k && vis(o.x, o.y, 0)) emit(o.x * TS + 4 + Math.random() * 8, o.y * TS + 5, (Math.random() - 0.5) * 24, -10 - Math.random() * 12, 0.35 + Math.random() * 0.25, 1, 55, 0, MANT[o.sys], 1, 0); }
    else if (o.t === 'nucleo' && s.iaOn) { if (Math.random() < 0.5 * k && vis(o.x, o.y, 0)) emit(o.x * TS + 8, o.y * TS + 2, (Math.random() - 0.5) * 20, -12 - Math.random() * 10, 0.4, 1, 55, 0, '255,90,90', 1, 0); }
  }
  for (const gr of s.L.grates) if (Math.random() < 0.45 * k && vis(gr[0], gr[1], 0)) emit(gr[0] * TS + 4 + Math.random() * 8, gr[1] * TS + 6, (Math.random() - 0.5) * 6, -8, 1.4 + Math.random() * 0.5, 2, -2, 0.8, VAPOR[theme] ?? VAPOR.estacion, 0, 0);
}

// motas de polvo en la vista (pantalla), con carácter por destino: frías y lentas en la Estación, grises en la Luna, rojizas y empujadas por el viento en Marte
const M = { x: new Float32Array(MAXM), y: new Float32Array(MAXM), z: new Float32Array(MAXM), p: new Float32Array(MAXM) };
for (let i = 0; i < MAXM; i++) { M.x[i] = Math.random(); M.y[i] = Math.random(); M.z[i] = 0.4 + Math.random() * 0.6; M.p[i] = Math.random() * 6; }
const MOTE = { estacion: { n: 26, rgb: '200,220,255', vx: 0.004 }, luna: { n: 30, rgb: '185,200,235', vx: 0.0025 }, marte: { n: 34, rgb: '235,150,110', vx: 0.011 } };
let motas = 0;
/** Vivas ahora: partículas del pozo + motas activas (nunca pasa de 144). */
export const vivas = () => np + motas;
/** Avanza y dibuja motas y partículas. cam en píxeles del mundo; VW×VH = tamaño de la vista; storm = tormenta de polvo (viento fuerte). */
export function particles(cx, dt, cam, VW, VH, theme, storm = false) {
  const mt = MOTE[theme] ?? MOTE.estacion; const n = Math.min(MAXM, Math.round(mt.n * (suave() ? 0.6 : 1) * (storm ? 1.2 : 1))); motas = n; const wind = storm ? 4 : 1;
  cx.save(); cx.fillStyle = `rgb(${mt.rgb})`;
  for (let i = 0; i < n; i++) {
    M.p[i] += dt; M.x[i] += dt * mt.vx * M.z[i] * wind; M.y[i] += Math.sin(M.p[i]) * dt * 0.004 + (storm ? dt * 0.002 : 0);
    if (M.x[i] > 1) M.x[i] -= 1; if (M.y[i] > 1) M.y[i] -= 1; else if (M.y[i] < 0) M.y[i] += 1;
    cx.globalAlpha = (0.1 + 0.22 * M.z[i] * (0.5 + 0.5 * Math.sin(M.p[i] * 2))) * (storm ? 1.4 : 1);
    cx.fillRect(Math.round(cam.x + M.x[i] * VW), Math.round(cam.y + M.y[i] * VH), storm ? 4 : 1, 1);
  }
  // pozo de partículas: avanzar (se quita la que muere copiando la última en su lugar) y dibujar en dos pasadas (normal y aditiva)
  for (let i = 0; i < np; i++) {
    P.life[i] -= dt;
    if (P.life[i] <= 0) { np--; if (i < np) for (let k = 0; k < PA.length; k++) PA[k][i] = PA[k][np]; i--; continue; }
    if (P.dr[i]) { const f = Math.max(0, 1 - P.dr[i] * dt); P.vx[i] *= f; P.vy[i] *= f; }
    P.vy[i] += P.g[i] * dt; P.x[i] += P.vx[i] * dt; P.y[i] += P.vy[i] * dt;
  }
  for (let pass = 0; pass < 2; pass++) {
    cx.globalCompositeOperation = pass ? 'lighter' : 'source-over'; let lc = -1;
    for (let i = 0; i < np; i++) {
      if (P.add[i] !== pass) continue; const f = P.life[i] / P.max[i];
      if (P.c[i] !== lc) { lc = P.c[i]; cx.fillStyle = COLS[lc]; }
      cx.globalAlpha = pass ? Math.min(1, f * 2) : 0.5 * Math.min(1, f * 2); const sz = pass ? P.size[i] : P.size[i] * (1 + (1 - f) * 0.9);
      cx.fillRect(Math.round(P.x[i]), Math.round(P.y[i]), sz, sz);
    }
  }
  cx.globalCompositeOperation = 'source-over'; cx.globalAlpha = 1;
  for (const q of rings) if (q.t > 0) {
    q.t -= dt; if (q.t <= 0) continue; const k = 1 - q.t / q.d; cx.globalAlpha = (1 - k) * 0.8; cx.strokeStyle = COLS[q.c]; cx.lineWidth = 1.5;
    cx.beginPath(); cx.arc(q.x, q.y, q.r * (0.25 + 0.75 * (1 - (1 - k) * (1 - k))), 0, 7); cx.stroke();
  }
  cx.restore();
}

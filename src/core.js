// Lógica de LIFELINE: Rutina (sin pantalla). La interfaz llama a update(), interact(), useQ(), craft()…
import { ITEMS, LOOT, RECIPES, HAZARDS, DIFS, PERKS, PROTOCOLS } from './common.js';
import { NOTES, TRUE_END } from './story.js';
export const perk = (s) => PERKS[s.perk] ?? PERKS.novato;
export const dif = (s) => DIFS[s.dif] ?? DIFS.normal;
import { LOCS } from './locs.js';
import * as V from './villains.js';
import * as S from './sistemas.js';

export const DAYS = 10;
export const MIN_PER_SEC = 4;          // 1 s real = 4 min de juego
export const SLEEP_MULT = 10;
const VIEW = 6.5, FOV = Math.PI / 3.6;   // vigilancia: alcance (casillas) y medio ángulo
const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// ---------- azar con semilla (para repetir partidas en las pruebas) ----------
export function rand(s) { s.seed = (s.seed + 0x6D2B79F5) | 0; let t = s.seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
export const pick = (s, arr) => arr[Math.floor(rand(s) * arr.length)];
function pickWeighted(s, table) { const tot = Object.values(table).reduce((a, b) => a + b, 0); let r = rand(s) * tot; for (const [k, w] of Object.entries(table)) { r -= w; if (r <= 0) return k; } return Object.keys(table)[0]; }

// ---------- mapa ----------
export function buildMap(L) {
  const { W, H } = L; const idx = (x, y) => y * W + x; const ins = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
  const grid = new Uint8Array(W * H);          // 0 vacío, 1 piso, 2 escotilla
  const room = new Int8Array(W * H).fill(-1);
  L.rooms.forEach((r, i) => { for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) { grid[idx(x, y)] = 1; room[idx(x, y)] = i; } });
  const doors = []; const doorAt = new Int16Array(W * H).fill(-1);
  L.corridors.forEach((c) => {
    const [cx, cy, cw, ch] = c.r;
    for (let y = cy; y < cy + ch; y++) for (let x = cx; x < cx + cw; x++) grid[idx(x, y)] = 1;
    for (const rid of [c.a, c.b]) {
      const ri = L.rooms.findIndex((r) => r.id === rid); const tiles = [];
      for (let y = cy; y < cy + ch; y++) for (let x = cx; x < cx + cw; x++) if (N4.some(([dx, dy]) => ins(x + dx, y + dy) && room[idx(x + dx, y + dy)] === ri)) tiles.push([x, y]);
      const lock = c.lock?.[rid] ?? null;
      const d = { id: doors.length, tiles, room: rid, lock, open: !lock };
      doors.push(d); for (const [x, y] of tiles) { grid[idx(x, y)] = 2; doorAt[idx(x, y)] = d.id; }
    }
  });
  const duct = new Uint8Array(W * H);
  for (const [x0, y0, x1, y1] of L.ducts) for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) duct[idx(x, y)] = 1;
  return { grid, room, doors, doorAt, duct };
}

const I = (s, x, y) => y * s.L.W + x;
const inside = (s, x, y) => x >= 0 && y >= 0 && x < s.L.W && y < s.L.H;
export const roomAt = (s, x, y) => { if (!inside(s, Math.floor(x), Math.floor(y))) return null; const i = s.map.room[I(s, Math.floor(x), Math.floor(y))]; return i >= 0 ? s.L.rooms[i] : null; };
export const roomIdAt = (s, x, y) => roomAt(s, x, y)?.id ?? 'pasillo';
export const roomName = (s, id) => s.L.rooms.find((r) => r.id === id)?.name ?? 'Pasillo';
const doorOf = (s, tx, ty) => { const d = s.map.doorAt[I(s, tx, ty)]; return d >= 0 ? s.map.doors[d] : null; };

/** ¿Se puede pisar? who: 'p' jugador, 'd' dron/tripulación/robot (abren escotillas), 'gas' nubes y cosas que no las abren. */
export function walkable(s, tx, ty, who = 'p') {
  if (!inside(s, tx, ty)) return false;
  if (who === 'p' && s.p.inDuct) return s.map.duct[I(s, tx, ty)] === 1;
  if (who === 'p' && s.map.solid?.[I(s, tx, ty)]) return false; // los objetos son sólidos: se usan desde al lado
  const g = s.map.grid[I(s, tx, ty)];
  if (g === 1) return true;
  if (g === 2) return who === 'd' || doorOf(s, tx, ty).open;
  return false;
}

export function los(s, x0, y0, x1, y1) {
  const d = Math.hypot(x1 - x0, y1 - y0); const n = Math.ceil(d / 0.2);
  for (let i = 1; i < n; i++) {
    const tx = Math.floor(x0 + (x1 - x0) * i / n), ty = Math.floor(y0 + (y1 - y0) * i / n);
    if (!inside(s, tx, ty)) return false;
    const g = s.map.grid[I(s, tx, ty)];
    if (g === 0) return false;
    if (g === 2 && !doorOf(s, tx, ty).open) return false;
  }
  return true;
}

/** Camino más corto (BFS). avoid: ids de salas que no se pisan. */
export function path(s, sx, sy, tx, ty, who = 'd', avoid = null) {
  const { W, H } = s.L;
  sx = Math.floor(sx); sy = Math.floor(sy); tx = Math.floor(tx); ty = Math.floor(ty);
  if (sx === tx && sy === ty) return [];
  if (!inside(s, tx, ty)) return null;
  const prev = new Int32Array(W * H).fill(-1); const st = I(s, sx, sy); const q = [st]; prev[st] = st; const end = I(s, tx, ty);
  for (let h = 0; h < q.length && prev[end] === -1; h++) {
    const c = q[h]; const cx = c % W, cy = (c / W) | 0;
    for (const [dx, dy] of N4) {
      const nx = cx + dx, ny = cy + dy; if (!inside(s, nx, ny)) continue; const n = I(s, nx, ny);
      if (prev[n] !== -1) continue;
      const g = s.map.grid[n];
      if (g === 0 || (g === 2 && who === 'gas' && !doorOf(s, nx, ny).open)) continue;
      if (who !== 'gas' && n !== end && s.map.solid?.[n]) continue; // los objetos estorban a todos menos a los gases
      if (avoid && n !== end) { const ri = s.map.room[n]; if (ri >= 0 && avoid.includes(s.L.rooms[ri].id)) continue; }
      prev[n] = c; q.push(n);
    }
  }
  if (prev[end] === -1) return null;
  const out = []; for (let c = end; c !== st; c = prev[c]) out.push([c % W, (c / W) | 0]);
  return out.reverse();
}

/** Mueve un cuerpo por el camino hacia goal. Devuelve true si llegó. */
export function follow(s, b, goal, speed, dt, who = 'd') {
  b.repath = (b.repath ?? 0) - dt;
  const key = `${Math.floor(goal[0])},${Math.floor(goal[1])}`;
  if (!b.path || b.repath <= 0 || b.goalKey !== key) { b.path = path(s, b.x, b.y, goal[0], goal[1], who, b.avoid) ?? []; b.goalKey = key; b.repath = b.chasing ? 0.4 : 3; }
  let step = speed * dt;
  while (step > 0) {
    const next = b.path[0]; const tx = next ? next[0] + 0.5 : goal[0], ty = next ? next[1] + 0.5 : goal[1];
    const dx = tx - b.x, dy = ty - b.y, dist = Math.hypot(dx, dy);
    if (dist < 0.02) { if (next) { b.path.shift(); continue; } return true; }
    b.dir = Math.atan2(dy, dx); b.moving = true;
    const m = Math.min(step, dist); b.x += (dx / dist) * m; b.y += (dy / dist) * m; step -= m;
    if (m >= dist && next) b.path.shift(); else break;
  }
  return false;
}

// ---------- partida nueva ----------
export function newGame(loc = 'estacion', seed = Date.now() & 0x7fffffff, difKey = 'normal', opts = {}) {
  const L = LOCS[loc];
  const s = {
    loc, L, seed, dif: DIFS[difKey] ? difKey : 'normal', grace: 0, day: 1, mode: opts.mode === 'noche' ? 'noche' : 'campana', perk: PERKS[opts.perk] ? opts.perk : 'novato', daily: !!opts.daily,
    seen: opts.seen ?? [], notes: [], route: null, t: 0, min: 340, map: buildMap(L),
    p: { x: 3.5, y: 3.5, dir: 0, inDuct: false, hidden: null, crouch: false, noisy: false, dusty: 0, sleep: false, salud: 100, energia: 90, fuerza: 5, conoc: 5, o2: 100, inv: ['cinta', 'tornillos'], hit: 0, walk: 0 },
    stash: [], alert: 0, integ: 100, iaOn: true, frags: [false, false, false], grates: L.grates.map(() => false),
    objects: L.objects.map((o) => ({ ...o, loot: [], used: false })),
    vil: null, shake: 0, sfx: [], floor: [],
    drones: [], hazards: [], crew: [], log: [], block: -1, blockStart: 0, checked: false, ate: false, worked: 0, illegal: 0,
    action: null, pending: null, final: null, over: null, msg: null, events: [], noise: null, stats: { caught: 0, solved: 0, favors: 0, alertMax: 0, spotted: 0, hid: 0 },
  };
  addLockers(s); markSolid(s);
  for (let i = 0; i < 3; i++) addDrone(s, i);
  L.crew.forEach((c, i) => { const [bx, by] = L.beds[i]; s.crew.push({ ...c, trust: 0, betrayed: false, tellCd: 0, x: bx + 0.5, y: by + 0.5, dir: 0, path: null, goal: null, sayT: 5 + i * 7, say: null, want: null, avoid: ['ia', 'esclusa', 'capsula', 'exterior'] }); });
  const pk = perk(s); s.p.fuerza += pk.fuerza ?? 0; s.p.conoc += pk.conoc ?? 0; for (const it of pk.start ?? []) s.p.inv.push(it);
  if (s.mode === 'noche') setupNight(s);
  S.init(s, opts);
  refill(s); if (s.mode !== 'noche') planEvents(s); newWants(s); V.startDay(s);
  if (s.mode === 'noche') say(s, `UNA NOCHE en ${L.name}. Ya tienes parte del plan. Escapa antes de las 06:00 o ${L.ai} te descubre.`, 'ia');
  else say(s, `Día 1 en ${L.name}. ${L.ai} está fallando. La nave de rescate llega en ${DAYS} días: mantén viva la base hasta entonces.`, 'ia');
  return s;
}
/** Modo UNA NOCHE: empiezas a las 21:00 con medio plan hecho; escapa antes de que amanezca. */
function setupNight(s) {
  const p = s.p; s.min = 1260; p.conoc = Math.max(p.conoc, 45); p.fuerza = Math.max(p.fuerza, 45); p.energia = 100;
  p.inv = p.inv.filter((i) => i !== 'destornillador'); s.stash.push('destornillador'); // herramienta en el escondite: encima te la quitarían
  const pool = [...PLAN_IDS]; const got = [];
  while (got.length < 2) got.push(pool.splice(Math.floor(rand(s) * pool.length), 1)[0]);
  for (const id of got) {
    s.stash.push(id);
    if (id === 'codigo') s.frags = [true, true, true];
    if (id === 'celda') { const o = s.objects.find((x) => x.t === 'caja'); if (o) o.used = true; }
    if (id === 'traje') { const o = s.objects.find((x) => x.t === 'traje'); if (o) o.used = true; }
  }
  s.events = [1350 + Math.floor(rand(s) * 200)];
  say(s, `En tu escondite ya tienes: ${got.map((i) => itemName(s, i)).join(' y ')}.`, 'ok');
}
export const NIGHT_SPEED = 0.3125; // en UNA NOCHE el reloj va más lento: 9 h ≈ 7 min
/** Después de cargar una partida guardada: vuelve a armar lo que no se guarda. */
export function revive(o) {
  o.L = LOCS[o.loc]; const map = buildMap(o.L);
  (o.doorsOpen ?? []).forEach((v, i) => { if (map.doors[i]) map.doors[i].open = v; }); delete o.doorsOpen;
  o.map = map; markSolid(o); o.pending = null; o.action = null; o.floor ??= []; o.mode ??= 'campana'; o.sys ??= null; o.perk ??= 'novato'; o.seen ??= []; o.notes ??= []; o.t ??= 0;
  for (const c of o.crew) { c.trust ??= 0; c.tellCd ??= 0; }
  for (const h of o.hazards) h.def = HAZARDS[h.kind];
  (o.doorsLock ?? []).forEach((v, i) => { if (map.doors[i]) map.doors[i].lock = v; }); delete o.doorsLock;
  return o;
}
const NOSAVE = new Set(['busyBy', 'distractT', 'pending', 'who']);
export function serialize(s) { const { map, L, ...rest } = s; return JSON.stringify({ ...rest, hazards: s.hazards.map(({ def, ...h }) => h), doorsOpen: map.doors.map((d) => d.open), doorsLock: map.doors.map((d) => d.lock) }, (k, v) => (NOSAVE.has(k) ? undefined : v)); }

/** Casilleros para esconderse: uno por sala (menos dormitorio y salas prohibidas). */
/** Casillas ocupadas por objetos (todo objeto es sólido). Se recalcula al crear o cargar la partida. */
export function markSolid(s) { const sol = new Uint8Array(s.L.W * s.L.H); for (const o of s.objects) sol[o.y * s.L.W + o.x] = 1; s.map.solid = sol; }
function addLockers(s) {
  for (const r of s.L.rooms) {
    if (r.restricted || r.outside || r.id === 'dorm') continue;
    for (let k = 0; k < 12; k++) {
      const x = r.x + Math.floor(rand(s) * r.w), y = r.y + (rand(s) < 0.5 ? 0 : r.h - 1);
      const bloquea = s.map.grid[y * s.L.W + x] !== 1 || [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => s.map.grid[(y + dy) * s.L.W + x + dx] === 2) || s.L.grates.some(([gx, gy]) => gx === x && gy === y);
      if (!bloquea && !s.objects.some((o) => Math.abs(o.x - x) <= 1 && Math.abs(o.y - y) <= 1)) { s.objects.push({ t: 'casillero', x, y, loot: [], used: false }); break; }
    }
  }
}
function addDrone(s, i) {
  const r = s.L.routes[i % s.L.routes.length];
  s.drones.push({ x: r[0][0] + 0.5, y: r[0][1] + 0.5, route: i, wp: 1, path: null, dir: 0, mode: 'patrulla', stun: 0, lost: 0, target: null, cd: 0, avoid: ['exterior'] });
}

/** quiet = queda en el registro ([4] Avisos) pero NO sube a la pantalla (para lo que otro panel ya muestra o lo que duplica otro aviso). */
export function say(s, text, kind = 'info', quiet = false) { s.logSeq = (s.logSeq ?? 0) + 1; const l = { id: s.logSeq, text, kind, day: s.day, min: Math.floor(s.min) }; if (quiet) l.quiet = true; s.log.push(l); if (s.log.length > 50) s.log.shift(); }
export const flash = (s, text, kind = 'info') => { s.msg = { text, kind, t: 3.2 }; say(s, text, kind); };
export const itemName = (s, id) => s.L.plan[id]?.name ?? ITEMS[id]?.name ?? id;

function refill(s) { for (const o of s.objects) if (o.t === 'cajon') { o.loot = []; const n = rand(s) < 0.75 ? 1 + (rand(s) < 0.35 ? 1 : 0) : 0; for (let k = 0; k < n; k++) o.loot.push(pickWeighted(s, LOOT)); } }
function planEvents(s) { const n = s.day < 2 ? 0 : s.day < 5 ? 1 : 2; s.events = Array.from({ length: n }, () => 480 + Math.floor(rand(s) * 780)).sort((a, b) => a - b); }
function newWants(s) { for (const c of s.crew) { c.want = pickWeighted(s, LOOT); c.reward = pick(s, ['conoc', 'fuerza', 'pieza', 'pieza', 'chip']); } }

// ---------- jugador ----------
export const capacity = (s) => 5 + Math.floor(s.p.fuerza / 20) + (perk(s).cap ?? 0);
export const has = (s, id) => s.p.inv.includes(id);
export const isContraband = (id) => !!ITEMS[id]?.tool;
export function give(s, id) { if (s.p.inv.length >= capacity(s)) { flash(s, `Llevas las manos llenas: no puedes tomar ${itemName(s, id)}. Suelta algo con G (o SOLTAR en la mochila) o déjalo en tu escondite.`, 'warn'); return false; } s.p.inv.push(id); return true; }
export function take(s, id) { const i = s.p.inv.indexOf(id); if (i >= 0) s.p.inv.splice(i, 1); return i >= 0; }
export const block = (s) => s.L.schedule.find((b) => s.min >= b.from && s.min < b.to) ?? s.L.schedule[0];
export const isNight = (s) => s.min < 360 || s.min >= 1320;
export const playerRoom = (s) => roomIdAt(s, s.p.x, s.p.y);
export const isOutside = (s, x = s.p.x, y = s.p.y) => !!roomAt(s, x, y)?.outside;
export const PLAN_IDS = ['codigo', 'celda', 'traje', 'llave'];
export const planDone = (s) => PLAN_IDS.every((id) => has(s, id));
export const clock = (m) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(Math.floor(m % 60)).padStart(2, '0')}`;
export const recipes = (s) => RECIPES.filter((r) => !r.locs || r.locs.includes(s.loc));
/** Tormenta encima del jugador (oscuridad y menos visión de los drones). */
export const storm = (s) => s.hazards.find((h) => h.def.type === 'front' && h.def.dark && h.phase === 'barre' && s.p.x < h.x);
/** Oscuridad donde está el jugador: tormenta o apagón. */
export const dark = (s) => !!storm(s) || s.hazards.some((h) => h.def.type === 'blackout' && !h.def.quarantine && h.room === playerRoom(s));
/** Hay una emergencia real (no cuentan cámaras ni apagones): excusa faltar al horario. */
export const emergency = (s) => s.hazards.some((h) => !['camera', 'blackout'].includes(h.def.type)) || !!s.sys?.storm; // la tormenta solar excusa faltar al horario
const MAGNET = ['spread', 'chaser', 'pull', 'robot', 'mold'];

export function raise(s, n, why) {
  if (!s.iaOn || s.over || s.final) return;
  n *= dif(s).alert; s.alert = Math.min(100, s.alert + n); s.stats.alertMax = Math.max(s.stats.alertMax ?? 0, s.alert);
  if (why) say(s, `${s.L.ai}: ${why} (+${Math.round(n)} de alerta)`, 'ia');
  if (s.alert >= 100) lockdown(s);
}
export function lockdown(s, who) {
  const lost = s.p.inv.filter(isContraband);
  s.p.inv = s.p.inv.filter((i) => !isContraband(i));
  Object.assign(s.p, { x: 3.5, y: 3.5, inDuct: false, hidden: null }); s.p.energia = Math.max(0, s.p.energia - 20);
  s.alert = 40; s.stats.caught++; s.grace = dif(s).grace; V.calmAll(s);
  flash(s, `${who ? who + ' te atrapó. ' : ''}¡BLOQUEO! ${s.L.ai} te encerró en el dormitorio${lost.length ? ' y confiscó: ' + lost.map((i) => itemName(s, i)).join(', ') : ''}. Lo del escondite está a salvo.`, 'bad');
}

// ---------- ciclo principal ----------
export function update(s, dt, input = { dx: 0, dy: 0 }) {
  if (s.over || s.pending) return;
  if (s.msg && (s.msg.t -= dt) <= 0) s.msg = null;
  const p = s.p;
  let moving = Math.abs(input.dx) + Math.abs(input.dy) > 0.1;
  p.crouch = !!input.crouch;
  if (p.hidden && moving) { p.hidden = null; say(s, 'Saliste del escondite.', 'info'); }
  if (p.hidden) moving = false;
  p.noisy = moving && !p.crouch && !p.inDuct && !p.sleep;
  if (p.sleep && (moving || !isNight(s))) { p.sleep = false; if (!isNight(s)) say(s, 'Despiertas. Hora del pase de lista.', 'info'); }
  const prevMin = s.min;
  s.t += dt;
  s.min += dt * MIN_PER_SEC * (p.sleep ? SLEEP_MULT : 1) * (s.mode === 'noche' && !s.final ? NIGHT_SPEED : 1);
  if (s.mode === 'noche' && s.day >= 2 && s.min >= 360 && !s.final) { end(s, false, 'Amaneció', `Sonó el pase de lista de las 06:00 y ${s.L.ai} encontró tu cama vacía. La noche se acabó.`); return; }
  const dm = s.min - prevMin;

  if (s.min >= 1440) { newDay(s); if (s.over) return; }
  const bi = s.L.schedule.indexOf(block(s));
  if (bi !== s.block) { const prevId = s.block >= 0 ? s.L.schedule[s.block]?.id : null; S.blockEnd(s, prevId); s.block = bi; s.blockStart = s.min; s.checked = false; s.ate = false; s.worked = 0; onBlockStart(s); }
  if (!s.checked && s.min - s.blockStart >= dif(s).late) { s.checked = true; checkBlock(s); }
  if (s.events.length && s.min >= s.events[0]) { if (activeHaz(s) >= dif(s).maxHaz) s.events[0] += 45; else { s.events.shift(); spawnHazard(s); V.sfx(s, 'alarma'); } }
  if (s.min >= 1260 && prevMin < 1260 && s.iaOn) say(s, `${s.L.ai}: ${s.L.aiLines[Math.min(s.day - 1, s.L.aiLines.length - 1)]}`, 'ia');

  p.energia = p.sleep ? Math.min(100, p.energia + dm * 0.22) : Math.max(0, p.energia - dm * 0.07);
  if (p.energia > 30) p.salud = Math.min(100, p.salud + dm * dif(s).regen);
  if (s.iaOn) s.alert = Math.max(0, s.alert - dm / 60);
  if (s.illegal > 0) s.illegal -= dt;
  if (s.grace > 0) s.grace -= dt;
  if (p.hit > 0) p.hit -= dt;
  // oxígeno: afuera sin traje se acaba muy rápido
  if (isOutside(s) && !p.inDuct) { p.o2 = Math.max(0, p.o2 - dt * (has(s, 'traje') ? 0.6 : 14)); if (p.o2 <= 0) { p.salud -= 18 * dt; p.hit = 0.2; } }
  else p.o2 = Math.min(100, p.o2 + dt * 25);

  if (moving && !p.sleep) {
    s.action = null;
    const len = Math.hypot(input.dx, input.dy);
    let sp = (p.energia <= 0 ? 1.8 : 3.6) * (p.crouch ? 0.52 : 1) * (perk(s).speed ?? 1) * dt;
    if (slowHere(s)) sp *= 0.5;
    p.dir = Math.atan2(input.dy, input.dx); p.walk += dt;
    moveBody(s, p, (input.dx / len) * sp, (input.dy / len) * sp, 0.28, 'p');
  }
  if (s.action) { s.action.t += dt; if (s.action.t >= s.action.need) { const a = s.action; s.action = null; finishAction(s, a); } }

  const h0 = p.salud, i0 = s.integ; updateHazards(s, dt, dm); if (p.salud < h0) p.salud = h0 - (h0 - p.salud) * dif(s).dmg; if (s.integ < i0) s.integ = i0 - (i0 - s.integ) * dif(s).dmg;
  S.update(s, dt, dm);
  updateDrones(s, dt);
  updateCrew(s, dt);
  V.updateVillains(s, dt, dm);
  if (s.final) updateFinal(s, dt);

  if (p.salud <= 0) end(s, false, 'Evacuación médica', `Tu salud llegó a cero. ${s.L.ai} se quedó con todo.`);
  if (s.integ <= 0) end(s, false, 'Base perdida', 'La base quedó inhabitable: demasiados problemas sin resolver.');
}

export function moveBody(s, b, mx, my, r, who) {
  // La caja de colisión del jugador está en los PIES (el sprite se dibuja ~0,4 casillas por debajo de su centro), no en el centro del cuerpo.
  const [t0, t1] = who === 'p' ? [-0.05, 0.45] : [-r, r];
  const ok = (x, y) => walkable(s, Math.floor(x - r), Math.floor(y + t0), who) && walkable(s, Math.floor(x + r), Math.floor(y + t0), who) && walkable(s, Math.floor(x - r), Math.floor(y + t1), who) && walkable(s, Math.floor(x + r), Math.floor(y + t1), who);
  const atrapado = !ok(b.x, b.y); // si algo te dejó dentro de un objeto, puedes salir
  // si el paso completo choca, avanza lo que quepa hasta tocar (así se llega pegado a la pared o al objeto)
  const avanza = (px, py) => { if (atrapado || ok(b.x + px, b.y + py)) { b.x += px; b.y += py; return; } let k = 0.5; for (let i = 0; i < 4; i++, k /= 2) if (ok(b.x + px * k, b.y + py * k)) { b.x += px * k; b.y += py * k; return; } };
  avanza(mx, 0); avanza(0, my);
}

function newDay(s) {
  s.min -= 1440; s.day++;
  if (s.day > DAYS) { rescue(s); return; }
  if ((s.day === 4 || s.day === 7) && s.drones.length < 5) { addDrone(s, s.drones.length); say(s, `${s.L.ai} activó un tercer ${s.L.watcher} de vigilancia.`, 'ia'); }
  refill(s); planEvents(s); newWants(s); S.newDay(s);
  say(s, `— Día ${s.day} de ${DAYS} —`, 'day'); V.startDay(s);
}

function onBlockStart(s) {
  const b = block(s);
  if (b.id === 'trabajo') S.workStart(s);
  if (b.id === 'dormir' && s.min >= 1320) say(s, `Luces apagadas: la vigilancia sigue. Fuera del dormitorio es sospechoso.`, 'warn');
  else if (b.room) say(s, `Ahora: ${b.name} → ${roomName(s, b.room)}.`, 'info', true); // el panel AHORA ya lo muestra
}

function checkBlock(s) {
  const b = block(s); if (!b.room || !s.iaOn) return;
  const here = playerRoom(s) === b.room;
  if (b.id === 'lista') {
    if (!here) { raise(s, 20, 'Faltaste al pase de lista.'); return; }
    const cb = s.p.inv.filter(isContraband);
    if (cb.length >= 2) { const it = pick(s, cb); take(s, it); raise(s, 12, `Revisé tus bolsillos en el pase de lista y me llevé: ${itemName(s, it)}.`); }
    else say(s, 'Pase de lista sin problemas. (Llevar 2 o más herramientas encima es arriesgado.)', 'ok');
  } else if (b.id === 'dormir') { if (!here) raise(s, 15, 'No estabas en tu cama al apagar las luces.'); }
  else if (!here && !emergency(s)) raise(s, 10, `No fuiste a: ${b.name}.`);
}

// ---------- vigilancia ----------
function updateDrones(s, dt) {
  const p = s.p; const dk = dark(s);
  const front = s.hazards.find((h) => (h.def.type === 'front' && h.def.safe) || h.def.type === 'shelter');
  for (const d of s.drones) {
    d.moving = false;
    if (!s.iaOn) { d.mode = 'apagado'; continue; }
    if (d.stun > 0) { d.stun -= dt; continue; }
    if (d.busy > 0) { d.busy -= dt; if (d.busyBy) d.dir = Math.atan2(d.busyBy.y - d.y, d.busyBy.x - d.x); continue; }
    if (d.ignore > 0) d.ignore -= dt;
    if (d.alarmT > 0) d.alarmT -= dt; if (d.qT > 0) d.qT -= dt;
    d.cd = Math.max(0, d.cd - dt);
    // detección gradual: patrulla → sospecha (?) → persigue (!) → investiga la última posición vista (ver villains.js: suspect)
    const seen = canSee(s, d, dk ? 0.55 : 1) && suspicious(s) && !(d.ignore > 0);
    const sure = V.suspect(s, d, seen, dt) || (seen && !!s.final);
    if (d.mode === 'persigue') {
      if (seen) { d.lost = 0; d.target = [p.x, p.y]; raise(s, 14 * dt); }
      else { d.lost += dt; if (d.lost > 3) { d.mode = 'investiga'; d.target = d.lastSeen ?? d.target; d.look = 4; d.path = null; d.sus = 0; d.qT = 1.5; V.sfx(s, 'perdido'); } }
    } else if (seen) {
      if (sure) { V.spotted(s, d); s.stats.spotted++; d.mode = 'persigue'; d.lost = 0; d.target = [p.x, p.y]; raise(s, 14 * dt); }
      else if (d.mode !== 'busca') { if (d.mode !== 'sospecha') { d.mode = 'sospecha'; d.qT = 1.2; V.sfx(s, 'sospecha'); } d.target = [p.x, p.y]; }
    } else if (d.mode === 'sospecha' && d.sus <= 0) { d.mode = 'investiga'; d.target = d.lastSeen ?? d.target; d.look = 3; d.path = null; }
    // oído: pasos cerca o un ruido
    if (d.mode === 'patrulla' && p.noisy && !p.hidden && Math.hypot(p.x - d.x, p.y - d.y) < (perk(s).quiet ? 1.3 : 2.8)) { d.mode = 'investiga'; d.target = [p.x, p.y]; d.look = 3; d.qT = 1; }
    if (d.mode === 'patrulla' && V.hearsNoise(s, d)) { d.mode = 'investiga'; d.target = [s.noise.x, s.noise.y]; d.look = 4; d.qT = 1.2; }
    d.chasing = d.mode === 'persigue' || !!s.final;
    let goal, hold = false;
    const haz = s.hazards.find((h) => MAGNET.includes(h.def.type) && !isOutside(s, h.x, h.y));
    if (d.mode === 'sospecha') { goal = d.target; hold = true; d.dir = Math.atan2(d.target[1] - d.y, d.target[0] - d.x); } // se detiene y mira: la señal para reaccionar
    else if (d.mode === 'persigue' || d.mode === 'busca') goal = d.target;
    else if (s.final) goal = [p.x, p.y];
    else if (d.mode === 'investiga') {
      goal = d.target;
      if (Math.hypot(goal[0] - d.x, goal[1] - d.y) < 0.8) { d.look -= dt; d.dir += dt * 2.2; if (d.look <= 0) { d.mode = 'patrulla'; d.path = null; } continue; }
    }
    else if (front && d.route !== 0) { const r = s.L.rooms.find((x) => x.id === 'ia'); goal = [r.x + 2.5, r.y + 2.5]; }
    else if (haz && d.route !== 0) goal = [haz.x, haz.y];
    else {
      // ronda con variaciones suaves: a veces se detiene a mirar alrededor, se salta un punto o da la vuelta (siempre con rand(s))
      const r = s.L.routes[d.route % s.L.routes.length]; const n = r.length; d.wp = ((d.wp % n) + n) % n; let w = r[d.wp];
      if (d.pause > 0) { d.pause -= dt; hold = true; d.dir += (d.scan ?? 1) * dt * 1.3; }
      else if (Math.hypot(w[0] + 0.5 - d.x, w[1] + 0.5 - d.y) < 0.6) {
        const q = rand(s); const st = d.step ?? 1;
        if (q < 0.12) d.step = -st; else if (q < 0.2) d.wp += st; // da la vuelta / se salta un punto
        d.wp = (((d.wp + (d.step ?? 1)) % n) + n) % n; w = r[d.wp];
        if (rand(s) < 0.4) { d.pause = 0.8 + rand(s) * 1.6; d.scan = rand(s) < 0.5 ? 1 : -1; hold = true; }
      }
      goal = [w[0] + 0.5, w[1] + 0.5];
    }
    if (!hold) follow(s, d, goal, (d.chasing ? 3.4 : d.mode === 'patrulla' ? 2.0 : 2.6) * (s.final ? 1.2 : 1) * dif(s).spd, dt, 'd');
    if (d.mode === 'persigue' && seen) d.dir = Math.atan2(p.y - d.y, p.x - d.x);
    else if (d.mode === 'persigue' && d.target && Math.hypot(d.target[0] - d.x, d.target[1] - d.y) < 0.9) d.dir += dt * 2.2; // llegó a donde te vio: mira alrededor
    // buscar en el escondite donde te vio meterte
    if (d.mode === 'busca' && Math.hypot(d.target[0] - d.x, d.target[1] - d.y) < 1.3) {
      if (p.hidden && Math.hypot(p.hidden.x - d.x, p.hidden.y - d.y) < 1.8 && !s.pending) { s.pending = { kind: 'respira', who: d }; d.mode = 'patrulla'; }
      else { d.mode = 'investiga'; d.look = 3; }
      continue;
    }
    // en cuanto te toca, te atrapa
    if (d.cd <= 0 && !p.inDuct && !p.hidden && Math.hypot(p.x - d.x, p.y - d.y) < 0.75 && (d.chasing || suspicious(s) || p.inv.some(isContraband)) && !(s.grace > 0 && !d.chasing && !s.final && s.illegal <= 0)) {
      d.cd = 4; s.stats.caught++;
      if (s.final) { s.final.t -= 15; p.hit = 0.8; flash(s, `¡Un ${s.L.watcher} te agarró! −15 s.`, 'bad'); d.stun = 3; continue; }
      p.hit = 1; s.shake = 0.5; lockdown(s, `Un ${s.L.watcher}`);
      d.mode = 'patrulla'; d.path = null;
    }
  }
  // herramientas tiradas a la vista: las confiscan
  for (const d of s.drones) { if (!s.iaOn || d.stun > 0) continue;
    const f = s.floor.find((f) => isContraband(f.id) && Math.hypot(f.x - d.x, f.y - d.y) < 4 && los(s, d.x, d.y, f.x, f.y));
    if (f) { s.floor.splice(s.floor.indexOf(f), 1); raise(s, 4, `Encontré ${itemName(s, f.id)} tirado en ${roomName(s, roomIdAt(s, f.x, f.y))}. Confiscado.`); } }
  if (s.noise && (s.noise.t -= dt) <= 0) s.noise = null;
}
/** Alguien te descubrió en un escondite y aguantaste (o no) la respiración. */
export function resolveBreath(s, ok) {
  const pd = s.pending; s.pending = null; if (!pd) return;
  const w = pd.who;
  if (ok) { w.mode = 'patrulla'; w.path = null; w.ignore = 8; w.lost = 0; w.sus = 0; flash(s, 'Contuviste la respiración… se alejó.', 'ok'); return; }
  s.p.hidden = null; s.shake = 0.6;
  if (w.vid) return V.caughtBy(s, w);
  s.stats.caught++; lockdown(s, `Un ${s.L.watcher} abrió tu escondite y`);
}
/** Tecla F: meterse o salir de un escondite (casillero o debajo de una cama). */
export function toggleHide(s) {
  const p = s.p; if (s.over || s.pending || p.inDuct) return;
  if (p.hidden) { p.hidden = null; return say(s, 'Saliste del escondite.', 'info'); }
  const o = s.objects.filter((x) => ['escondite', 'cama', 'casillero'].includes(x.t)).map((x) => [x, Math.hypot(x.x + 0.5 - p.x, x.y + 0.5 - p.y)]).sort((a, b) => a[1] - b[1])[0];
  if (!o || o[1] > 1.4) return flash(s, 'No hay dónde esconderse aquí (casilleros o debajo de las camas).', 'warn');
  p.hidden = { x: o[0].x + 0.5, y: o[0].y + 0.5, t: o[0].t };
  // quien te estaba persiguiendo y te vio meterte, va a revisar
  for (const h of [...s.drones, ...(s.vil?.walkers ?? [])]) if ((h.mode === 'persigue') && Math.hypot(h.x - p.x, h.y - p.y) < 8 && h.lost < 1) { h.mode = 'busca'; h.target = [p.hidden.x, p.hidden.y]; h.goal = h.target; }
  flash(s, o[0].t === 'cama' ? 'Te metiste debajo de la cama. No respires.' : o[0].t === 'escondite' ? 'Te metiste en tu casillero. No hagas ruido.' : 'Te metiste en el casillero. No hagas ruido.', 'info');
}
/** Tecla T: lanzar una pieza para hacer ruido y atraer a la vigilancia. */
export function throwItem(s) {
  const p = s.p; if (s.over || s.pending || p.hidden || p.inDuct) return;
  const i = p.inv.findIndex((x) => !ITEMS[x].tool); if (i < 0) return flash(s, 'No tienes piezas sueltas para lanzar (las herramientas no se tiran).', 'warn');
  let x = p.x, y = p.y; const dx = Math.cos(p.dir), dy = Math.sin(p.dir);
  for (let k = 0; k < 24; k++) { const nx = x + dx * 0.25, ny = y + dy * 0.25; if (!walkable(s, Math.floor(nx), Math.floor(ny), 'gas')) break; x = nx; y = ny; }
  const [it] = p.inv.splice(i, 1);
  s.noise = { x, y, t: 6 }; s.thrown = { x0: p.x, y0: p.y, x, y, t: 0.5 };
  say(s, `Lanzaste ${ITEMS[it].name}: ¡CLANG! La vigilancia irá a ver.`, 'info');
}
/** Soltar una cosa en el suelo (para hacer espacio). Las herramientas tiradas las pueden encontrar los vigilantes. */
export function dropItem(s, i = s.p.inv.length - 1) {
  const p = s.p; if (s.over || p.hidden || p.inDuct || !p.inv[i]) return false;
  if (p.inv[i] in (s.L.plan ?? {})) { flash(s, 'Eso es parte del plan de regreso: no lo sueltes, guárdalo en tu escondite.', 'warn'); return false; }
  const [it] = p.inv.splice(i, 1); s.floor.push({ id: it, x: p.x + Math.cos(p.dir) * 0.3, y: p.y + Math.sin(p.dir) * 0.3 });
  say(s, `Soltaste ${itemName(s, it)} en el suelo.${isContraband(it) ? ' Ojo: si un vigilante ve una herramienta tirada, la confisca.' : ''}`, 'info'); return true;
}
export const nearest = (arr, x, y) => arr.slice().sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y))[0];

export function canSee(s, d, k = 1) {
  const p = s.p; if (p.inDuct || p.hidden || d.stun > 0 || !s.iaOn) return false;
  k *= dif(s).see * (perk(s).see ?? 1); if (p.crouch) k *= 0.7; if (isNight(s)) k *= 0.85;
  const dx = p.x - d.x, dy = p.y - d.y, dist = Math.hypot(dx, dy);
  if (dist > VIEW * k) return false;
  if (dist > 1.2) { let a = Math.atan2(dy, dx) - d.dir; a = Math.atan2(Math.sin(a), Math.cos(a)); if (Math.abs(a) > FOV) return false; }
  return los(s, d.x, d.y, p.x, p.y);
}

export function suspicious(s) {
  const room = roomAt(s, s.p.x, s.p.y);
  if (s.final || s.illegal > 0) return true;
  if (room?.restricted || room?.outside) return true;
  if (isNight(s) && room?.id !== 'dorm' && !(dif(s).excuse && emergency(s))) return true;
  const b = block(s);
  if (b.room && s.checked && room?.id !== b.room && !emergency(s) && !(s.grace > 0)) return true;
  return false;
}

// ---------- tripulación ----------
const CREW_LINES = ['¿Escuchaste ese ruido anoche?', 'Extraño la lluvia.', 'Dicen que la IA lee nuestros diarios.', 'Hoy me tocó limpiar filtros. Otra vez.', 'Mi familia no sabe nada de mí.', 'Si necesitas algo, pídemelo.', 'No confío en esos drones.', 'Hay que volver a casa. Como sea.', 'Hice 2 horas de bici. Me duelen las piernas.', '¿Probaste el café rehidratado? Horrible.'];
function updateCrew(s, dt) {
  const b = block(s);
  s.crew.forEach((c, i) => {
    c.moving = false;
    const danger = s.hazards.find((h) => MAGNET.includes(h.def.type) && Math.hypot(h.x - c.x, h.y - c.y) < 4);
    if (!c.goal || c.goalBlock !== s.block || c.goalDay !== s.day) {
      c.goalBlock = s.block; c.goalDay = s.day;
      if (b.id === 'dormir') { const [bx, by] = s.L.beds[i]; c.goal = [bx + 0.5, by + 0.5]; }
      else {
        const r = s.L.rooms.find((x) => x.id === (b.room ?? pick(s, ['comedor', 'lab', 'gimnasio', 'nodo', 'dorm']))) ?? s.L.rooms[0];
        let gx, gy, tries = 0;
        do { gx = r.x + Math.floor(rand(s) * r.w); gy = r.y + 1 + Math.floor(rand(s) * (r.h - 1)); tries++; } while (tries < 20 && s.objects.some((o) => o.x === gx && o.y === gy));
        c.goal = [gx + 0.5, gy + 0.5];
      }
    }
    if (c.busyT > 0 && c.distractT) { c.busyT -= dt; c.goal = [c.distractT.x + 0.9, c.distractT.y]; c.goalBlock = s.block; c.goalDay = s.day; if (c.busyT <= 0) { c.distractT = null; c.goal = null; } }
    follow(s, c, c.goal ?? [c.x, c.y], c.busyT > 0 ? 3 : 2.1, dt, 'd');
    c.sayT -= dt;
    if (c.betrayed && s.iaOn && (c.tellCd -= dt) <= 0 && suspicious(s) && !s.p.hidden && !s.p.inDuct && Math.hypot(c.x - s.p.x, c.y - s.p.y) < 6 && los(s, c.x, c.y, s.p.x, s.p.y)) { c.tellCd = 20; c.say = '¡IA! ¡Mira lo que hace!'; c.sayFor = 3; raise(s, 8, `${c.name} me contó que te vio en algo raro.`); }
    if (danger && !c.alarmed) { c.alarmed = true; c.say = pick(s, ['¡Cuidado!', '¡Alerta! ¡Protocolo!', '¿Alguien tiene herramientas?', '¡Aléjate de eso!']); c.sayFor = 3; }
    if (!danger) c.alarmed = false;
    if (c.sayT <= 0) { c.sayT = 18 + rand(s) * 25; c.say = pick(s, CREW_LINES); c.sayFor = 4; }
    if (c.sayFor > 0 && (c.sayFor -= dt) <= 0) c.say = null;
  });
}

/** Hablar con un compañero: te pide una pieza y te devuelve un favor. */
function talk(s, c) {
  if (c.betrayed) return flash(s, `${c.name}: "No te hablo. Me vendiste."`, 'bad');
  if (!c.want) {
    if (c.dday === s.day) return flash(s, `${c.name}: "Ya te cubrí hoy. Mañana te ayudo otra vez."`, 'info');
    const targets = [...s.drones.filter((d) => s.iaOn && d.stun <= 0), ...(s.vil?.walkers ?? []).filter((w) => !w.away && !w.gone && w.kind === 'walker')];
    const t = nearest(targets, s.p.x, s.p.y);
    if (!t || Math.hypot(t.x - s.p.x, t.y - s.p.y) > 22) return flash(s, `${c.name}: "No veo a nadie a quien distraer."`, 'info');
    c.dday = s.day; c.distractT = t; c.busyT = 30; t.busy = 30; t.busyBy = c; t.mode = t.vid ? 'charla' : 'patrulla';
    c.say = pick(s, ['¡Oye! ¡Mira esto!', '¡Creo que hay una fuga aquí!', 'Tengo una pregunta del reglamento…']); c.sayFor = 5;
    return flash(s, `${c.name} va a distraer a ${t.vid ? t.name : 'un ' + s.L.watcher} durante 30 s. ¡Aprovecha!`, 'ok');
  }
  if (!has(s, c.want)) return flash(s, `${c.name}: "¿Me consigues ${ITEMS[c.want].name}? Te lo devuelvo con un favor."`, 'info');
  take(s, c.want); c.want = null; s.stats.favors++; c.trust++;
  if (c.trust === 2) say(s, `${c.name} confía en ti por completo. (Ruta MOTÍN: ${s.crew.filter((x) => x.trust >= 2).length}/3)`, 'ok');
  const r = c.reward;
  if (r === 'conoc') { s.p.conoc = Math.min(100, s.p.conoc + 6); flash(s, `${c.name} te enseñó trucos de ingeniería (+6 conocimiento).`, 'ok'); }
  else if (r === 'fuerza') { s.p.fuerza = Math.min(100, s.p.fuerza + 6); flash(s, `${c.name} te armó una rutina de ejercicios (+6 fuerza).`, 'ok'); }
  else { const it = r === 'chip' ? 'chip' : pickWeighted(s, LOOT); if (give(s, it)) flash(s, `${c.name} te dio: ${ITEMS[it].name}.`, 'ok'); }
  s.alert = Math.max(0, s.alert - 5);
}

// ---------- problemas-enemigo ----------
/** Peligros activos que cuentan para el tope por dificultad (no cámaras ni apagones). */
export const activeHaz = (s) => s.hazards.filter((h) => !['camera', 'blackout'].includes(h.def.type)).length;
export function spawnHazard(s, kind = pick(s, s.L.hazards), roomId) {
  const def = HAZARDS[kind];
  const indoor = s.L.rooms.filter((r) => !r.restricted && !r.outside && r.id !== 'dorm');
  const byId = (id) => s.L.rooms.find((x) => x.id === id);
  let r = roomId ? byId(roomId) : def.room ? byId(def.room) : def.outside ? s.L.rooms.find((x) => x.outside) : def.spawn ? byId(def.spawn) : pick(s, indoor);
  if (!r) r = pick(s, indoor);
  let cx, cy, tries = 0; // nunca aparece pegado al jugador (justicia): reintenta hasta 8 veces
  do { cx = r.x + Math.floor(rand(s) * r.w); cy = r.y + Math.floor(rand(s) * r.h); tries++; } while (tries < 8 && !s.p.inDuct && Math.hypot(cx + 0.5 - s.p.x, cy + 0.5 - s.p.y) < 3.5);
  const h = { kind, def, room: r.id, x: cx + 0.5, y: cy + 0.5 };
  if (def.type === 'spread') Object.assign(h, { tiles: [I(s, cx, cy)], t: 0 });
  else if (def.type === 'chaser') Object.assign(h, { life: def.life, path: null });
  else if (def.type === 'bouncer') h.bits = Array.from({ length: def.n ?? 3 }, () => { const a = rand(s) * Math.PI * 2; return { x: cx + 0.5, y: cy + 0.5, vx: Math.cos(a) * 2.4, vy: Math.sin(a) * 2.4, rot: 0 }; });
  else if (def.type === 'pull') { const side = rand(s) < 0.5; const lx = side ? r.x + r.w - 1 : r.x; h.x = lx + 0.5 + (side ? 0.45 : -0.45); h.y = r.y + Math.floor(rand(s) * r.h) + 0.5; h.tres = def.tres; }
  else if (def.type === 'front') Object.assign(h, { phase: 'aviso', t: def.warn, x: -2, y: s.L.H / 2 });
  else if (def.type === 'robot') Object.assign(h, { stun: 0, cd: 0, dir: 0, path: null, chasing: false, goal: null });
  else V.initHazard(s, h, r);
  s.hazards.push(h);
  const tool = def.tool ? (dif(s).kit ? `Ve y pulsa E: el armario de emergencia tiene ${ITEMS[def.tool].name}.` : `Necesitas: ${ITEMS[def.tool].name}.`) : def.hint ? def.hint : def.type === 'robot' ? 'Inhíbelo (Q) y desármalo con el destornillador.' : def.outside ? 'Métete a la base.' : '';
  flash(s, def.msg ?? `¡${def.name} en ${roomName(s, h.room)}! ${tool}`, 'bad');
  return h;
}

function spreadTiles(s, h) {
  const from = pick(s, h.tiles); const fx = from % s.L.W, fy = (from / s.L.W) | 0;
  const [dx, dy] = pick(s, N4); const nx = fx + dx, ny = fy + dy;
  if (!walkable(s, nx, ny, 'gas')) return;
  if (h.def.sameRoom && roomIdAt(s, nx, ny) !== h.room) return;
  const n = I(s, nx, ny); if (!h.tiles.includes(n)) h.tiles.push(n);
}
export const onTiles = (s, h, x, y, r = 0.9) => !!h.tiles?.some((t) => Math.hypot((t % s.L.W) + 0.5 - x, ((t / s.L.W) | 0) + 0.5 - y) < r);
function slowHere(s) { return !s.p.inDuct && s.hazards.some((h) => h.def.type === 'spread' && h.def.slow && onTiles(s, h, s.p.x, s.p.y, 0.7)); }

function updateHazards(s, dt, dm) {
  const p = s.p;
  const kill = (h) => s.hazards.splice(s.hazards.indexOf(h), 1);
  for (const h of [...s.hazards]) {
    const def = h.def;
    // Cadete: si nadie lo resuelve a tiempo, un compañero lo controla con su protocolo (la base pierde un poco).
    if (dif(s).crewFix && def.tool && def.type !== 'robot' && def.type !== 'camera') {
      h.crewT = (h.crewT ?? 0) + dt;
      if (h.crewT > dif(s).crewFix) {
        kill(h); s.integ -= 3; s.stats.crewFixed = (s.stats.crewFixed ?? 0) + 1;
        const c = s.crew.find((x) => !x.betrayed) ?? { name: 'La tripulación' }; const pr = def.proto && PROTOCOLS[def.proto];
        say(s, `${c.name} controló ${def.name.toLowerCase()}${pr ? ` siguiendo el protocolo: ${pr.steps.slice(0, 3).join(' → ')}…` : '.'} (−3 de integridad). La próxima, ¡resuélvelo tú con su herramienta!`, 'ok');
        continue;
      }
    }
    const near = (x, y, r) => !p.inDuct && Math.hypot(p.x - x, p.y - y) < r;
    if (def.type === 'spread') {
      h.t += dt; if (h.t > def.rate) { h.t = 0; spreadTiles(s, h); }
      const r = s.L.rooms.find((x) => x.id === h.room);
      if (h.tiles.length > r.w * r.h * def.maxFrac) { kill(h); s.integ -= def.loss; flash(s, `${def.name}: se perdió ${r.name} por un tiempo (−${def.loss} de integridad).`, 'bad'); continue; }
      s.integ -= h.tiles.length * 0.003 * dm;
      if (def.dmg && !p.inDuct && onTiles(s, h, p.x, p.y)) { p[def.stat] = Math.max(def.stat === 'salud' ? -1 : 0, p[def.stat] - def.dmg * dt); p.hit = 0.2; }
    } else if (def.type === 'chaser') {
      h.life -= dt;
      if (h.life <= 0) { kill(h); say(s, `${def.name}: se disipó solo.`, 'warn'); if (!def.outside) s.integ -= 5; continue; }
      const chase = !p.inDuct && !(def.outside && !isOutside(s));
      if (chase) { h.repath = (h.repath ?? 0) - dt; if (!h.path || h.repath <= 0) { h.path = path(s, h.x, h.y, p.x, p.y, 'gas', def.outside ? s.L.rooms.filter((r) => !r.outside).map((r) => r.id) : null) ?? []; h.repath = 0.8; } }
      const nx = chase ? h.path?.[0] : null;
      if (nx) { const dx = nx[0] + 0.5 - h.x, dy = nx[1] + 0.5 - h.y, d = Math.hypot(dx, dy); if (d < 0.1) h.path.shift(); else { h.x += dx / d * def.speed * dt; h.y += dy / d * def.speed * dt; } }
      if (!def.outside) s.integ -= 0.02 * dm;
      if (near(h.x, h.y, 1.5) && !(def.immune && has(s, def.immune))) {
        p.salud -= def.dmg * dt; p.hit = 0.2;
        if (def.knock) { const d = Math.hypot(p.x - h.x, p.y - h.y) || 1; moveBody(s, p, (p.x - h.x) / d * 3 * dt, (p.y - h.y) / d * 3 * dt, 0.28, 'p'); }
      }
    } else if (def.type === 'bouncer') {
      for (const b of h.bits) {
        b.rot += dt * 4;
        const nx = b.x + b.vx * dt, ny = b.y + b.vy * dt;
        if (!walkable(s, Math.floor(nx), Math.floor(b.y), 'gas')) b.vx *= -1; else b.x = nx;
        if (!walkable(s, Math.floor(b.x), Math.floor(ny), 'gas')) b.vy *= -1; else b.y = ny;
        if (near(b.x, b.y, 0.6) && p.hit <= 0) {
          p.salud -= def.dmg ?? 10; p.hit = 0.8; const d = Math.hypot(p.x - b.x, p.y - b.y) || 1;
          moveBody(s, p, (p.x - b.x) / d * 0.8, (p.y - b.y) / d * 0.8, 0.28, 'p');
          s.noise = { x: b.x, y: b.y, t: 6 }; say(s, def.fire ? '¡Te quemó una bola de fuego!' : '¡Te golpeó la chatarra! El ruido atrajo vigilancia.', 'warn');
        }
      }
      s.integ -= 0.01 * dm;
    } else if (def.type === 'pull') {
      h.tres -= dt; s.integ -= 0.05 * dm;
      const d = Math.hypot(h.x - p.x, h.y - p.y);
      if (!p.inDuct && d < 5 && d > 0.6) moveBody(s, p, (h.x - p.x) / d * 1.6 * (1 - d / 5) * dt, (h.y - p.y) / d * 1.6 * (1 - d / 5) * dt, 0.28, 'p');
      if (h.tres <= 0) { kill(h); s.integ -= 30; flash(s, `Se acabó el tiempo: las escotillas de emergencia sellaron ${roomName(s, h.room)}. Se perdió mucho aire (−30).`, 'bad'); }
    } else if (def.type === 'front') {
      if (h.phase === 'aviso') { h.t -= dt; if (!h.w5 && h.t <= 5 && h.t > 0) { h.w5 = true; V.sfx(s, 'aviso'); say(s, `${def.name}: ¡5 segundos!`, 'warn'); } if (h.t <= 0) { h.phase = 'barre'; say(s, `¡${def.name} llegó!`, 'bad'); } continue; }
      h.x += def.speed * dt;
      if (h.x - def.width > s.L.W) { kill(h); s.stats.solved++; flash(s, `${def.name}: ya pasó. Sobreviviste.`, 'ok'); continue; }
      const inBand = p.x < h.x && p.x > h.x - def.width;
      const room = roomAt(s, p.x, p.y);
      if (inBand && !p.inDuct && (def.outsideOnly ? room?.outside : !(def.safe ?? []).includes(room?.id))) { p.salud -= def.dmg * dt; p.hit = 0.2; }
      if (def.safe) s.crew.forEach((c, i) => { const r = s.L.rooms.find((x) => x.id === def.safe[0]); c.goal = [r.x + 1.5 + i, r.y + 2.5]; c.goalBlock = s.block; c.goalDay = s.day; });
    } else if (def.type === 'robot') {
      h.moving = false;
      if ((h.age = (h.age ?? 0) + dt) > dif(s).robotLife) { kill(h); say(s, `${def.name} se quedó sin batería y se apagó.`, 'ok'); continue; }
      if (h.stun > 0) { h.stun -= dt; continue; }
      h.cd = Math.max(0, h.cd - dt); if (h.alarmT > 0) h.alarmT -= dt;
      const dist = Math.hypot(p.x - h.x, p.y - h.y);
      const seen = dist < 7 && los(s, h.x, h.y, p.x, p.y);
      const smell = def.smell && dist < def.smell && p.inv.some(isContraband);
      if (seen || smell) { h.trackT = def.track ?? 0; h.lastSeen = [p.x, p.y]; } else h.trackT = (h.trackT ?? 0) - dt;
      const was = !!h.chasing;
      h.chasing = !p.inDuct && !p.hidden && (seen || smell || h.trackT > 0);
      // telegrafía: al engancharte se queda fijo un instante (h.tele) con "!" (h.alarmT) antes de arrancar
      if (h.chasing && !was) { h.tele = V.SUS.tele; h.alarmT = 1.2; V.sfx(s, 'visto'); }
      if (h.chasing) h.goal = [p.x, p.y];
      else if (!h.goal || Math.hypot(h.goal[0] - h.x, h.goal[1] - h.y) < 0.6) {
        const o = pick(s, s.objects.filter((x) => x.t === 'cajon' && !roomAt(s, x.x, x.y)?.restricted));
        h.goal = [o.x + 0.5, o.y + 0.5]; h.obj = o;
      }
      if (h.tele > 0) { h.tele -= dt; h.dir = Math.atan2(p.y - h.y, p.x - h.x); }
      else follow(s, h, h.goal, def.speed * (h.chasing ? 1 : 0.6) * dif(s).spd, dt, 'd');
      if (!h.chasing && h.obj && def.steals && Math.hypot(h.obj.x + 0.5 - h.x, h.obj.y + 0.5 - h.y) < 1 && h.obj.loot.length) { h.obj.loot = []; say(s, `${def.name} desarmó un cajón en ${roomName(s, roomIdAt(s, h.x, h.y))}.`, 'warn'); }
      if (dist < 0.75 && h.cd <= 0 && !(h.tele > 0) && !p.inDuct && !p.hidden) { h.cd = 2; h.stun = dif(s).robotStun; p.salud -= def.dmg; if (def.grab) { const it = p.inv.find(isContraband); if (it) { take(s, it); say(s, `${def.name} te arrancó: ${itemName(s, it)}.`, 'bad'); } } p.hit = 0.8; const d = dist || 1; moveBody(s, p, (p.x - h.x) / d * 1.2, (p.y - h.y) / d * 1.2, 0.28, 'p'); say(s, `¡El ${def.name.toLowerCase()} te chocó! (−${def.dmg} salud)`, 'bad'); }
      s.integ -= 0.01 * dm;
    } else if (V.updateHazard(s, h, dt, dm)) kill(h);
  }
}

// ---------- tecla E ----------
export function nearby(s) {
  const p = s.p; const out = [];
  if (p.inDuct) { s.L.grates.forEach(([x, y], i) => { if (Math.hypot(x + 0.5 - p.x, y + 0.5 - p.y) < 0.9) out.push({ kind: 'rejilla', i, d: 0 }); }); return out; }
  for (const h of s.hazards) {
    const def = h.def; let d = Infinity;
    if (def.type === 'spread') { for (const t of h.tiles) d = Math.min(d, Math.hypot((t % s.L.W) + 0.5 - p.x, ((t / s.L.W) | 0) + 0.5 - p.y)); }
    else if (def.type === 'bouncer') d = Math.min(...h.bits.map((b) => Math.hypot(b.x - p.x, b.y - p.y)));
    else if (def.type === 'mold') d = Math.min(...h.blocked.map((i) => Math.hypot(s.L.grates[i][0] + 0.5 - p.x, s.L.grates[i][1] + 0.5 - p.y)));
    else if (def.type !== 'front') d = Math.hypot(h.x - p.x, h.y - p.y);
    if (d < 1.8 && (def.tool || def.type === 'robot' || def.type === 'camera')) out.push({ kind: 'peligro', h, d: -0.1 });
  }
  const em = S.emergNear(s); if (em) out.push(em);
  for (const c of s.crew) { const d = Math.hypot(c.x - p.x, c.y - p.y); if (d < 1.1) out.push({ kind: 'crew', c, d: d - 0.3 }); }
  out.push(...V.nearbyVillains(s));
  s.floor.forEach((f) => { const d = Math.hypot(f.x - p.x, f.y - p.y); if (d < 1) out.push({ kind: 'suelo', f, d: d - 0.6 }); });
  s.objects.forEach((o) => { const d = Math.hypot(o.x + 0.5 - p.x, o.y + 0.5 - p.y); if (d < 1.5) out.push({ kind: 'obj', o, d }); });
  s.L.grates.forEach(([x, y], i) => { const d = Math.hypot(x + 0.5 - p.x, y + 0.5 - p.y); if (d < 0.9) out.push({ kind: 'rejilla', i, d: d + 0.05 }); });
  for (const door of s.map.doors) { const d = Math.min(...door.tiles.map(([x, y]) => Math.hypot(x + 0.5 - p.x, y + 0.5 - p.y))); if (d < 1.4) out.push({ kind: 'puerta', door, d: d + 0.3 }); }
  return out.sort((a, b) => a.d - b.d);
}

const OBJ_LABEL = { cama: 'Dormir', escondite: 'Escondite', cajon: 'Revisar cajón', mesa: 'Comer', cinta: 'Hacer ejercicio', estudio: 'Estudiar', registro: 'Hackear registro', capcom: 'Radio con la Tierra', nucleo: 'Núcleo de la IA', casillero: 'Esconderse (F)' };
export function label(s, n) {
  if (!n) return '';
  if (n.kind === 'suelo') return `Recoger ${itemName(s, n.f.id)}`;
  if (n.kind === 'emerg') return S.emergLabel(s);
  if (n.kind === 'obj') return n.o.t === 'mant' ? S.label(s, n.o) : (s.L.labels[n.o.t] ?? OBJ_LABEL[n.o.t]);
  if (n.kind === 'crew') return n.c.betrayed ? `${n.c.name} (te odia)` : (n.c.want ? `Hablar con ${n.c.name}` : `Pedir a ${n.c.name} que distraiga`) + (s.iaOn && !dif(s).noBetray ? ' · [B] delatar' : '');
  if (n.kind === 'vil') return V.label(s, n);
  if (n.kind === 'rejilla') return s.p.inDuct ? 'Salir del conducto' : 'Entrar al conducto';
  if (n.kind === 'puerta') return (n.door.open ? 'Cerrar' : 'Abrir') + ' escotilla';
  if (n.h.def.type === 'camera') return n.h.stun > 0 ? 'Desarmar cámara' : 'Cámara (inhíbela con Q)';
  if (n.h.def.type === 'robot') return n.h.stun > 0 ? 'Desarmar robot' : 'Robot (inhíbelo con Q)';
  return `Resolver: ${n.h.def.name.toLowerCase()}`;
}

export function interact(s) {
  if (s.over || s.pending) return;
  if (s.p.hidden) return flash(s, 'Estás escondido. Pulsa F para salir.', 'info');
  const n = nearby(s)[0]; const p = s.p;
  if (!n) return;
  if (n.kind === 'puerta') return toggleDoor(s, n.door);
  if (n.kind === 'crew') return talk(s, n.c);
  if (n.kind === 'vil') return V.interact(s, n);
  if (n.kind === 'rejilla') {
    const why = V.grateBlocked(s, n.i); if (why) return flash(s, why, 'warn');
    V.onGrate(s, n.i);
    if (!p.inDuct && !s.grates[n.i]) { if (!has(s, 'destornillador')) return flash(s, 'La rejilla está atornillada. Fabrica un destornillador (tornillos + placa).', 'warn'); s.grates[n.i] = true; }
    const [gx, gy] = s.L.grates[n.i]; Object.assign(p, { x: gx + 0.5, y: gy + 0.5, inDuct: !p.inDuct }); s.illegal = 1.5;
    return say(s, p.inDuct ? 'Entraste al conducto: aquí no te ven.' : 'Saliste del conducto.', 'info');
  }
  if (n.kind === 'emerg') return S.fixEmerg(s);
  if (n.kind === 'peligro') return fixHazard(s, n.h);
  if (n.kind === 'suelo') { if (give(s, n.f.id)) { s.floor.splice(s.floor.indexOf(n.f), 1); say(s, `Recogiste ${itemName(s, n.f.id)}.`, 'ok'); } return; }
  const o = n.o; const b = block(s);
  switch (o.t) {
    case 'cama':
      if (!o.mine) return flash(s, 'Esa no es tu cama.', 'info');
      if (!isNight(s)) return flash(s, 'Solo se duerme con las luces apagadas (22:00).', 'info');
      if (s.mode === 'noche') return flash(s, 'Esta noche no se duerme: tienes hasta las 06:00 para escapar.', 'warn');
      p.sleep = true; return say(s, 'Duermes… (el tiempo pasa rápido; muévete para despertar)', 'info');
    case 'escondite': s.pending = { kind: 'escondite' }; return;
    case 'casillero': return toggleHide(s);
    case 'cajon': return start(s, 'cajon', 1.2, o);
    case 'mesa':
      if (b.id !== 'comer') return flash(s, 'Ahora no se sirve comida. Comidas: 07:00, 12:00 y 19:00.', 'info');
      if (s.ate) return flash(s, 'Ya comiste en este turno.', 'info');
      if (s.sys && s.sys.lvl.comida <= 0) return flash(s, 'No quedan raciones: el invernadero está agotado. Haz su mantenimiento.', 'warn');
      if (s.sys) s.sys.lvl.comida = Math.max(0, s.sys.lvl.comida - 3);
      s.ate = true; p.energia = Math.min(100, p.energia + 35); p.salud = Math.min(100, p.salud + 10); return say(s, 'Comida rehidratada… +35 energía, +10 salud.', 'ok');
    case 'cinta': if (p.energia < 10) return flash(s, 'Estás demasiado cansado para entrenar.', 'warn'); return start(s, 'cinta', 5, o);
    case 'estudio': if (p.energia < 6) return flash(s, 'Estás demasiado cansado para estudiar.', 'warn'); return start(s, 'estudio', 5, o);
    case 'registro':
      if (s.frags[o.frag]) return flash(s, 'Ya hackeaste este registro.', 'info');
      if (p.conoc < 15) return flash(s, `No entiendes el código de ${s.L.ai}. Necesitas 15 de conocimiento (estudia en el Laboratorio).`, 'warn');
      s.illegal = 4; s.pending = { kind: 'codigo', o }; return;
    case 'capcom': return flash(s, hint(s), 'info');
    case 'mant': return S.useStation(s, o);
    case 'trabajo': if (b.id !== 'trabajo') return flash(s, 'Esto se hace en el turno de trabajo (08:00–12:00).', 'info'); return start(s, 'trabajo', 2, o);
    case 'caja':
      if (o.used) return flash(s, 'Ya lo sacaste.', 'info');
      if (p.fuerza < 40) return flash(s, `Pesa demasiado. Necesitas 40 de fuerza (tienes ${Math.floor(p.fuerza)}). Entrena en el Gimnasio.`, 'warn');
      s.illegal = 2.5; return start(s, 'caja', 2, o);
    case 'traje': if (o.used) return flash(s, 'Ya tomaste el traje.', 'info'); if (give(s, 'traje_roto')) { o.used = true; flash(s, 'Tomaste el traje… tiene un corte. Repáralo con un parche (menú Fabricar).', 'ok'); } return;
    case 'nucleo':
      if (!s.iaOn) return flash(s, `${s.L.ai} está apagada. Silencio total.`, 'ok');
      if (!has(s, 'tarjeta')) return flash(s, 'Hace falta la tarjeta clonada para tocar el núcleo.', 'warn');
      if (p.conoc < 50) return flash(s, 'Necesitas 50 de conocimiento para entender el núcleo.', 'warn');
      s.pending = { kind: 'protocolo', id: 'ia' }; return;
    case 'palanca':
      if (!s.final) return flash(s, `${s.L.labels.palanca}. Solo sirve al momento de irse.`, 'info');
      if (s.final.lever) return flash(s, `¡Listo! Corre a: ${s.L.labels.asiento}.`, 'ok');
      if (s.route === 'motin') { s.final.lever = true; return flash(s, `Tu tripulación tira de la palanca contigo. ¡Corre a: ${s.L.labels.asiento}!`, 'ok'); }
      if (!has(s, 'llave')) return flash(s, `Necesitas: ${itemName(s, 'llave')}.`, 'warn');
      s.pending = { kind: 'protocolo', id: s.L.finalProto }; return;
    case 'asiento':
      if (s.final?.lever) return win(s);
      if (s.final) return flash(s, `Primero ve a la ${s.L.labels.palanca} (${roomName(s, 'nodo')}).`, 'warn');
      { const r = routes(s).find((x) => x.ok);
        if (!r) return flash(s, 'Aún no puedes irte. Rutas: ' + routes(s).map((x) => `${x.name}: ${x.desc}`).join(' · '), 'warn');
        s.route = r.id; return startFinal(s); }
  }
}

function start(s, kind, need, o) { s.action = { kind, need, t: 0, o }; }

function finishAction(s, a) {
  const p = s.p; const o = a.o;
  if (a.kind === 'cajon') {
    if (rand(s) < 0.3 && findNote(s)) return;
    if (!o.loot.length) return say(s, 'Cajón vacío. Se vuelve a llenar cada mañana.', 'info');
    const got = []; while (o.loot.length && p.inv.length < capacity(s)) { const it = o.loot.shift(); p.inv.push(it); got.push(ITEMS[it].name); }
    if (got.length) say(s, 'Encontraste: ' + got.join(', ') + '.', 'ok'); else flash(s, 'Llevas las manos llenas. Suelta algo con G.', 'warn');
  } else if (a.kind === 'cinta') { p.fuerza = Math.min(100, p.fuerza + 2); p.energia = Math.max(0, p.energia - 7); say(s, `Entrenaste. Fuerza ${Math.floor(p.fuerza)}.`, 'ok'); }
  else if (a.kind === 'estudio') { p.conoc = Math.min(100, p.conoc + 2); p.energia = Math.max(0, p.energia - 6); say(s, `Estudiaste manuales. Conocimiento ${Math.floor(p.conoc)}.`, 'ok'); }
  else if (a.kind === 'trabajo') { s.worked++; if (s.worked % 2 === 0 && p.inv.length < capacity(s)) { const it = pickWeighted(s, LOOT); p.inv.push(it); say(s, `Buen trabajo. Encontraste: ${ITEMS[it].name}.`, 'ok'); } else say(s, 'Trabajaste un rato.', 'ok'); }
  else if (a.kind === 'mant' || a.kind === 'emerg') S.finish(s, a);
  else if (a.kind === 'caja') { if (give(s, 'celda')) { o.used = true; flash(s, `¡Conseguiste: ${itemName(s, 'celda').toUpperCase()}!`, 'ok'); } }
}

/** Historia: encuentra la siguiente nota que aún no conoces de este destino. */
export function findNote(s) {
  const all = NOTES[s.loc] ?? []; const i = all.findIndex((_, k) => !s.seen.includes(k) && !s.notes.includes(k));
  if (i < 0) return false;
  s.notes.push(i); (s.sfx ??= []).push('nota');
  flash(s, `📄 Encontraste una nota: «${all[i][0]}». Léela en la mochila (I).`, 'ok'); return true;
}
export const notesKnown = (s) => new Set([...s.seen, ...s.notes]).size;
/** Rutas de escape: cada una con lo que pide y si ya está lista. */
export function routes(s) {
  const loyal = s.crew.filter((c) => c.trust >= 2 && !c.betrayed).length;
  return [
    { id: 'motin', name: 'Motín', desc: `Gánate a los 3 compañeros (2 favores cada uno; vas ${loyal}/3) y lleva ${itemName(s, 'codigo')} + ${itemName(s, 'celda')}. Ellos tiran de la palanca y frenan a los drones.`, ok: loyal === 3 && has(s, 'codigo') && has(s, 'celda') },
    { id: 'sabotaje', name: 'Sabotaje', desc: `Apaga a ${s.L.ai} y despega a mano: solo ${itemName(s, 'codigo')} + ${itemName(s, 'llave')}.`, ok: !s.iaOn && has(s, 'codigo') && has(s, 'llave') },
    { id: 'plan', name: 'Plan de regreso', desc: 'Las 4 piezas del plan.', ok: planDone(s) },
  ];
}
/** Delatar a un compañero ante la IA: baja tu alerta y te premian, pero te deja solo. */
export function betray(s) {
  if (dif(s).noBetray) return; // Cadete (7-12): no se ofrece delatar a un compañero
  if (s.over || s.pending || !s.iaOn) return s.iaOn ? undefined : flash(s, `${s.L.ai} está apagada: no hay a quién delatar.`, 'info');
  const c = s.crew.find((x) => !x.betrayed && Math.hypot(x.x - s.p.x, x.y - s.p.y) < 1.4);
  if (!c) return flash(s, 'No hay ningún compañero cerca para delatar.', 'info');
  c.betrayed = true; c.trust = -9; c.want = null; s.alert = Math.max(0, s.alert - 35);
  const prize = has(s, 'tarjeta') ? 'chip' : 'tarjeta'; give(s, prize);
  c.say = pick(s, ['¿Por qué...?', 'Confié en ti.', 'Esto no se olvida.']); c.sayFor = 5;
  flash(s, `Delataste a ${c.name}. ${s.L.ai} te premió (−35 alerta y ${itemName(s, prize)}). ${c.name} ya no te ayudará… y le contará a la IA lo que te vea hacer.`, 'bad');
}
/** Resultado del minijuego de hackeo (memoria de código). */
export function resolveCodigo(s, ok) {
  const pd = s.pending; s.pending = null; if (!pd) return;
  if (!ok) return raise(s, 10, 'Detecté un intento de acceso a mis registros.');
  s.frags[pd.o.frag] = true; const n = s.frags.filter(Boolean).length;
  say(s, `Registro de ${s.L.ai} hackeado (${n}/3).`, 'ok');
  if (n === 3) { if (give(s, 'codigo')) flash(s, `¡Armaste el ${itemName(s, 'codigo').toUpperCase()} con los 3 registros!`, 'ok'); else s.frags[pd.o.frag] = false; }
}

function toggleDoor(s, d) {
  if (!d.open && d.lock === 'energia') { if (!has(s, 'bateria')) return flash(s, `Apagón: la escotilla no tiene energía. Conéctale una batería… o usa los conductos.`, 'warn'); take(s, 'bateria'); d.lock = null; d.open = true; return flash(s, 'Conectaste una batería: la escotilla se abrió.', 'ok'); }
  if (!d.open && d.lock === 'cuarentena') return flash(s, 'CUARENTENA: sellada por bioseguridad. Espera o entra por los conductos.', 'warn');
  if (!d.open && d.lock && !has(s, d.lock) && !(d.lock === 'tarjeta' && !s.iaOn)) return flash(s, d.lock === 'tarjeta' ? 'Escotilla con tarjeta. Fabrica una tarjeta clonada… o busca otro camino (conductos).' : `Pide un código. Hackea los 3 registros de ${s.L.ai}.`, 'warn');
  d.open = !d.open;
}

function fixHazard(s, h) {
  const def = h.def;
  if (def.type === 'camera') {
    if (h.stun <= 0) return flash(s, 'Primero inhíbela con Q.', 'warn');
    if (!has(s, 'destornillador')) return flash(s, 'Necesitas un destornillador para desarmarla.', 'warn');
    s.hazards.splice(s.hazards.indexOf(h), 1); s.stats.solved++; give(s, 'chip'); return flash(s, 'Desarmaste la cámara. Te quedas con un chip.', 'ok');
  }
  if (def.type === 'robot') {
    if (h.stun <= 0) return flash(s, 'Primero inhíbelo con Q (inhibidor: batería + chip + cable).', 'warn');
    if (!has(s, 'destornillador')) return flash(s, 'Necesitas un destornillador para desarmarlo.', 'warn');
    s.pending = { kind: 'cables', h }; return;
  }
  if (!has(s, def.tool) && !dif(s).kit) return flash(s, `Necesitas: ${ITEMS[def.tool].name}. ${RECIPES.some((r) => r.id === def.tool) ? 'Fabrícalo (tecla C).' : 'Búscalo en los cajones.'}`, 'warn');
  if (!has(s, def.tool)) say(s, `Tomaste ${ITEMS[def.tool].name} del armario de emergencia.`, 'info'); // Cadete: siempre hay herramienta para vivir el protocolo
  if (def.type === 'bouncer') { h.bits = h.bits.filter((b) => Math.hypot(b.x - s.p.x, b.y - s.p.y) >= 1.8); say(s, def.fire ? 'Apagaste las llamas cercanas.' : 'Amarraste la chatarra.', 'ok'); if (!h.bits.length) { s.hazards.splice(s.hazards.indexOf(h), 1); s.stats.solved++; flash(s, def.fire ? 'Fuego apagado.' : 'Chatarra asegurada.', 'ok'); } return; }
  s.pending = def.cables ? { kind: 'cables', h } : { kind: 'protocolo', id: def.proto, h };
}

/** Resultado de un minijuego (protocolo o cables). */
export function resolveProtocol(s, ok) {
  const pd = s.pending; s.pending = null; if (!pd) return;
  if (pd.id === 'ia') {
    if (ok) { s.iaOn = false; s.alert = 0; flash(s, `¡${s.L.ai} APAGADA! La vigilancia cae al piso y las escotillas con tarjeta se abren.`, 'ok'); for (const d of s.map.doors) if (d.lock === 'tarjeta') d.open = true; }
    else raise(s, 30, 'Intento de apagado detectado.');
    return;
  }
  if (pd.kind === 'protocolo' && pd.id === s.L.finalProto) {
    if (ok) { s.final.lever = true; flash(s, `¡LISTO! Corre a: ${s.L.labels.asiento}.`, 'ok'); } else { s.final.t -= 12; flash(s, 'Te equivocaste de paso. Perdiste 12 s.', 'bad'); }
    return;
  }
  const h = pd.h; if (!h || !s.hazards.includes(h)) return;
  const def = h.def;
  if (def.type === 'robot') {
    if (ok) { s.hazards.splice(s.hazards.indexOf(h), 1); s.stats.solved++; flash(s, `Desarmaste el ${def.name.toLowerCase()}. Te quedas con un chip.`, 'ok'); give(s, 'chip'); }
    else { h.stun = 0; flash(s, '¡Cable equivocado! El robot despertó.', 'bad'); }
    return;
  }
  if (ok) { s.hazards.splice(s.hazards.indexOf(h), 1); s.stats.solved++; flash(s, `Bien hecho: ${def.name.toLowerCase()} resuelto.`, 'ok'); if (def.tool !== 'mascara' && has(s, def.tool)) take(s, def.tool); }
  else if (def.type === 'spread') { h.tiles = h.tiles.slice(0, Math.ceil(h.tiles.length / 2)); take(s, def.tool); flash(s, 'Te salió a medias: gastaste la herramienta y solo resolviste la mitad.', 'bad'); }
  else if (def.type === 'pull') { h.tres -= 40; flash(s, 'El parche no agarró bien. Perdiste 40 s.', 'bad'); }
  else { s.p.salud -= 15; flash(s, 'Te salió mal (−15 salud). Inténtalo otra vez.', 'bad'); }
}

// ---------- fabricar, escondite, inhibidor ----------
export function canCraft(s, r) {
  const inv = [...s.p.inv];
  for (const n of r.need) { const i = inv.indexOf(n); if (i < 0) return false; inv.splice(i, 1); }
  return s.p.conoc >= r.k;
}
export function craft(s, id) {
  const r = recipes(s).find((x) => x.id === id);
  if (!r || !canCraft(s, r)) return false;
  for (const n of r.need) take(s, n);
  s.p.inv.push(id); s.illegal = 2;
  say(s, `Fabricaste: ${itemName(s, id)}.`, 'ok');
  return true;
}
export const STASH_MAX = 10;
export function stashPut(s, i) { if (s.stash.length >= STASH_MAX) return false; const [it] = s.p.inv.splice(i, 1); if (it) s.stash.push(it); return true; }
export function stashTake(s, i) { if (s.p.inv.length >= capacity(s)) return false; const [it] = s.stash.splice(i, 1); if (it) s.p.inv.push(it); return true; }

export function useQ(s) {
  if (!has(s, 'inhibidor')) return flash(s, 'No tienes inhibidor (batería + chip + cable, 30 de conocimiento).', 'warn');
  const targets = [...s.drones.filter((d) => d.stun <= 0 && s.iaOn), ...s.hazards.filter((h) => ['robot', 'camera'].includes(h.def.type) && h.stun <= 0)];
  const t = nearest(targets, s.p.x, s.p.y);
  if (!t || Math.hypot(t.x - s.p.x, t.y - s.p.y) > 3) return flash(s, 'No hay nada que inhibir cerca (3 casillas).', 'warn');
  t.stun = 20; if (t.mode) t.mode = 'patrulla'; take(s, 'inhibidor');
  flash(s, t.def ? `${t.def.type === 'camera' ? 'Cámara' : 'Robot'} inhibido 20 s: ¡desármalo con E!` : 'Vigilancia inhibida por 20 segundos.', 'ok');
}

export function hint(s) {
  const r = routes(s).find((x) => x.ok); if (r && r.id !== 'plan') return `Tierra (señal débil): "Ruta ${r.name.toUpperCase()} lista. Ve a: ${s.L.labels.asiento}."`;
  const miss = PLAN_IDS.find((id) => !has(s, id));
  if (!miss) return `Tierra (señal débil): "Tienes todo. Ve a: ${s.L.labels.asiento}, y prepárate para correr."`;
  return `Tierra (señal débil): "Te falta ${itemName(s, miss)}. ${s.L.plan[miss].hint}"`;
}

// ---------- final ----------
function startFinal(s) {
  s.final = { t: s.iaOn ? s.L.finalTime : s.L.finalTime + 45, lever: false, doorT: 0 };
  if (s.route === 'motin') { s.final.t += 30; for (const d of s.drones) d.stun = 40; for (const c of s.crew) c.say = '¡AHORA! ¡Nos vamos todos!'; }
  flash(s, s.iaOn ? `¡${s.L.ai} TE DESCUBRIÓ! ${s.final.t} s: ve a la ${s.L.labels.palanca} (${roomName(s, 'nodo')}) y vuelve.` : `Con ${s.L.ai} apagada vas más tranquilo: ve a la ${s.L.labels.palanca} y vuelve.`, 'bad');
}
function updateFinal(s, dt) {
  const f = s.final; f.t -= dt;
  if (s.iaOn) { f.doorT += dt; if (f.doorT > 5) { f.doorT = 0; const open = s.map.doors.filter((d) => d.open && !d.lock); if (open.length) { const d = pick(s, open); d.open = false; say(s, `${s.L.ai} cerró una escotilla hacia ${roomName(s, d.room)}.`, 'ia'); } } }
  if (f.t <= 0) end(s, false, 'Sin salida', `Se acabó el tiempo: ${s.L.ai} bloqueó la nave para siempre.`);
}
function win(s) {
  let stars = 1; if (!s.iaOn) stars++; if (s.alert < 50 && s.integ >= 50) stars++;
  const k = !s.iaOn ? 0 : s.alert < 50 ? 1 : 2;
  const ROUTE = { motin: 'MOTÍN: la tripulación entera se levantó contigo. ', sabotaje: 'SABOTAJE: despegaste a mano, sin piloto automático. ', plan: '' };
  const traitor = s.crew.filter((c) => c.betrayed).map((c) => c.name);
  const crewEnd = traitor.length ? ` Te fuiste sin ${traitor.join(' ni ')}: nunca supiste qué fue de ${traitor.length > 1 ? 'ellos' : 'ese compañero'}.` : s.crew.every((c) => c.trust >= 2) ? ' Toda la tripulación volvió contigo.' : '';
  const trueEnd = notesKnown(s) >= (NOTES[s.loc]?.length ?? 99);
  end(s, true, trueEnd ? 'Final verdadero' : ['Base recuperada', 'Regreso silencioso', 'Por los pelos'][k], `${ROUTE[s.route] ?? ''}${s.L.win[k]}${crewEnd} ${s.mode === 'noche' ? 'Hora' : 'Día ' + s.day + ','} ${clock(s.min)}.${trueEnd ? ' ' + TRUE_END[s.loc] : ''}`, stars);
  s.over.route = s.route; s.over.trueEnd = trueEnd;
}
/**
 * Llegó la nave de rescate (al terminar el día 10): la misión se cumple si la tripulación sigue viva y la base en pie
 * (si no, la partida ya terminó antes). Estrellas: 1 por llegar; +1 si los 4 sistemas quedaron cuidados (promedio ≥ 70 %);
 * +1 si la radiación quedó baja (< 50 % del límite) y la base sana (integridad ≥ 50).
 */
export const RESCUE_TITLE = 'Rescate: misión cumplida';
export function rescueStars(s) {
  const lvl = s.sys ? Object.values(s.sys.lvl) : [];
  const avg = lvl.length ? lvl.reduce((a, b) => a + b, 0) / lvl.length : 100;
  const dose = s.sys ? S.dosePct(s) : 0;
  return { avg, dose, cuidada: avg >= 70, segura: dose < 50 && (s.integ ?? 0) >= 50 };
}
export function rescue(s) {
  const r = rescueStars(s);
  const stars = 1 + (r.cuidada ? 1 : 0) + (r.segura ? 1 : 0);
  end(s, true, RESCUE_TITLE, `Llegó la nave de rescate y encontró la base en pie: sistemas al ${Math.round(r.avg)} % y radiación al ${Math.round(r.dose)} % del límite. ${s.L.ai} quedó desconectada para revisarla en la Tierra.`, stars);
  s.over.route = 'rescate';
}
export function end(s, won, title, text, stars = 0) { if (!s.over) s.over = { won, title, text, stars }; }

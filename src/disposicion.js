// Disposición del mapa (lógica pura, sin pantalla ni azar de la partida): arma una VARIANTE de un destino a partir del mapa hecho a
// mano, para que cada destino tenga su propia forma y cada partida se sienta distinta.
//   lay = { espejo: bool, cambia: [['dorm', 'comedor'], …], quita: ['obs', …] }
//   · quita: salas opcionales que esta vez no existen (con sus pasillos, objetos, rejillas y puntos de patrulla).
//   · cambia: intercambia dos salas del MISMO tamaño; cada una se lleva sus objetos, camas y el punto de inicio.
//     Los pasillos, ductos con sus rejillas y las rutas de los drones se quedan en su lugar (unen huecos, no salas).
//   · espejo: refleja todo el mapa de izquierda a derecha (las paredes de arriba siguen arriba, así nada queda "colgado").
// variante() no valida: core.newGame prueba la variante con mapaValido() y, si no sirve, usa una más simple (ver candidatas()).
// La variante sale de la semilla (layDe) con un hash propio: NO gasta rand(s), así el resto de la partida no cambia de orden.

/** Forma propia de cada destino (siempre, también en las pruebas): la Luna y Marte ya no copian la Estación. */
export const FIJO = {
  estacion: { espejo: false, cambia: [], quita: [] },
  luna: { espejo: true, cambia: [['dorm', 'comedor']], quita: [] }, // la superficie queda a la izquierda y el dormitorio en el medio
  marte: { espejo: false, cambia: [['dorm', 'comedor'], ['gimnasio', 'ia']], quita: [] },
};

/** Salas que pueden faltar en una partida (no tienen paneles, registros, horario ni nada imprescindible). */
export const OPCIONALES = { estacion: ['enfermeria', 'obs', 'recreo', 'antena'], luna: [], marte: [] };

/** Salas que nunca se mueven (su lugar importa para la historia o las reglas: la nave, la esclusa, el exterior). */
const FIJAS = new Set(['esclusa', 'capsula', 'exterior']);

const dentro = (r, x, y) => x >= r.x && y >= r.y && x < r.x + r.w && y < r.y + r.h;
/** Hash entero estable (no usa el azar de la partida). */
export function hash(n, sal) { let h = (n ^ Math.imul(sal + 0x9e37, 0x85ebca6b)) | 0; h = Math.imul(h ^ (h >>> 16), 0x7feb352d); h = Math.imul(h ^ (h >>> 15), 0x846ca68b); return (h ^ (h >>> 16)) >>> 0; }

/** Junta dos disposiciones (la propia del destino + la de la partida): los cambios se suman y el espejo se alterna. */
export function junta(a, b) { return { espejo: !!a.espejo !== !!b.espejo, cambia: [...(a.cambia ?? []), ...(b.cambia ?? [])], quita: [...new Set([...(a.quita ?? []), ...(b.quita ?? [])])] }; }

/** Disposición de la partida según su semilla: espejo al azar, salas del mismo tamaño mezcladas entre sí y 0–3 salas opcionales menos. */
export function layDe(L0, seed) {
  const h = (n) => hash(seed, n);
  const lay = { espejo: h(1) % 2 === 1, cambia: [], quita: [] };
  const op = OPCIONALES[L0.id] ?? []; const nq = op.length ? h(2) % Math.min(4, op.length) : 0; // 0..3 salas menos
  const orden = [...op].sort((a, b) => h(a.length * 7 + a.charCodeAt(0)) - h(b.length * 7 + b.charCodeAt(0)));
  lay.quita = orden.slice(0, nq);
  // grupos de salas del mismo tamaño que se pueden intercambiar
  const grupos = {};
  for (const r of L0.rooms) if (!r.outside && !FIJAS.has(r.id) && !lay.quita.includes(r.id)) (grupos[`${r.w}x${r.h}`] ??= []).push(r.id);
  // cada grupo se mezcla por completo (Fisher-Yates con el hash): se anota como una lista de intercambios que se aplican en orden
  Object.values(grupos).filter((g) => g.length > 1).forEach((g, gi) => {
    const pos = [...g];
    for (let i = pos.length - 1; i > 0; i--) { const j = h(100 + gi * 10 + i) % (i + 1); if (j !== i) { lay.cambia.push([pos[i], pos[j]]); [pos[i], pos[j]] = [pos[j], pos[i]]; } }
  });
  return lay;
}

/** Variantes de más a menos ambiciosas: si la primera no pasa mapaValido(), se prueba la siguiente (la última es solo la forma propia). */
export function candidatas(L0, seed) {
  const fijo = FIJO[L0.id] ?? { espejo: false, cambia: [], quita: [] }; const l = layDe(L0, seed);
  return [junta(fijo, l), junta(fijo, { ...l, cambia: l.cambia.slice(0, 1) }), junta(fijo, { ...l, cambia: [] }), junta(fijo, { espejo: l.espejo }), fijo];
}

/** Arma el destino con la disposición `lay`. Devuelve un objeto que hereda del original (textos, horario, getters) y solo cambia lo del mapa. */
export function variante(L0, lay) {
  if (!lay || (!lay.espejo && !lay.cambia?.length && !lay.quita?.length)) return L0;
  let rooms = L0.rooms.map((r) => ({ ...r })); let corridors = L0.corridors.map((c) => ({ ...c, r: [...c.r] }));
  let objects = L0.objects.map((o) => ({ ...o })); let beds = L0.beds.map((b) => [...b]); let grates = L0.grates.map((g) => [...g]);
  let routes = L0.routes.map((rt) => rt.map((p) => [...p])); let ducts = L0.ducts.map((d) => [...d]); let inicio = [...(L0.inicio ?? [3.5, 3.5])];
  // 1 · quitar salas opcionales
  const fuera = rooms.filter((r) => lay.quita?.includes(r.id));
  if (fuera.length) {
    const en = (x, y) => fuera.some((r) => dentro(r, x, y));
    rooms = rooms.filter((r) => !fuera.includes(r)); const ids = new Set(fuera.map((r) => r.id));
    corridors = corridors.filter((c) => !ids.has(c.a) && !ids.has(c.b));
    objects = objects.filter((o) => !en(o.x, o.y)); beds = beds.filter(([x, y]) => !en(x, y)); grates = grates.filter(([x, y]) => !en(x, y));
    // los pasillos que quedaron sueltos (ya no tocan ninguna sala) tampoco se usan en las rutas
    const piso = (x, y) => rooms.some((r) => dentro(r, x, y)) || corridors.some((c) => x >= c.r[0] && y >= c.r[1] && x < c.r[0] + c.r[2] && y < c.r[1] + c.r[3]);
    routes = routes.map((rt) => rt.filter(([x, y]) => piso(x, y))).filter((rt) => rt.length >= 2);
    if (!routes.length) routes = L0.routes.slice(0, 1).map((rt) => rt.filter(([x, y]) => piso(x, y))).filter((rt) => rt.length >= 2);
  }
  // 2 · intercambiar salas del mismo tamaño (cada una se lleva lo que tiene adentro)
  for (const [ia, ib] of lay.cambia ?? []) {
    const A = rooms.find((r) => r.id === ia), B = rooms.find((r) => r.id === ib);
    if (!A || !B || A.w !== B.w || A.h !== B.h || A === B) continue;
    const da = [B.x - A.x, B.y - A.y]; const ea = (x, y) => dentro(A, x, y), eb = (x, y) => dentro(B, x, y);
    const mueve = ([x, y]) => (ea(x, y) ? [x + da[0], y + da[1]] : eb(x, y) ? [x - da[0], y - da[1]] : [x, y]);
    objects = objects.map((o) => { const [x, y] = mueve([o.x, o.y]); return { ...o, x, y }; });
    beds = beds.map(mueve); // las rejillas NO se mueven: van unidas a los ductos, que se quedan en su lugar
    if (ea(Math.floor(inicio[0]), Math.floor(inicio[1]))) inicio = [inicio[0] + da[0], inicio[1] + da[1]];
    else if (eb(Math.floor(inicio[0]), Math.floor(inicio[1]))) inicio = [inicio[0] - da[0], inicio[1] - da[1]];
    const [ax, ay] = [A.x, A.y]; A.x = B.x; A.y = B.y; B.x = ax; B.y = ay;
    // los pasillos unen huecos: el que llegaba al hueco de A ahora llega a B y al revés
    corridors = corridors.map((c) => ({ ...c, a: c.a === ia ? ib : c.a === ib ? ia : c.a, b: c.b === ia ? ib : c.b === ib ? ia : c.b, ...(c.lock ? { lock: Object.fromEntries(Object.entries(c.lock).map(([k, v]) => [k, v])) } : {}) }));
  }
  // 2b · acomodar: si al cambiar de hueco un objeto quedó junto a una escotilla, se corre por la misma pared hasta un lugar libre
  if (lay.cambia?.length) ({ objects, beds } = acomoda(rooms, corridors, objects, beds, grates));
  // 3 · espejo de izquierda a derecha
  if (lay.espejo) {
    const W = L0.W, mx = (x) => W - 1 - x;
    rooms = rooms.map((r) => ({ ...r, x: W - r.x - r.w })); corridors = corridors.map((c) => ({ ...c, r: [W - c.r[0] - c.r[2], c.r[1], c.r[2], c.r[3]] }));
    objects = objects.map((o) => ({ ...o, x: mx(o.x) })); beds = beds.map(([x, y]) => [mx(x), y]); grates = grates.map(([x, y]) => [mx(x), y]);
    routes = routes.map((rt) => rt.map(([x, y]) => [mx(x), y])); ducts = ducts.map(([x0, y0, x1, y1]) => [mx(x0), y0, mx(x1), y1]); inicio = [W - inicio[0], inicio[1]];
  }
  const L = Object.create(L0); // hereda textos, horario, tripulación y getters del destino original
  Object.assign(L, { rooms, corridors, objects, beds, grates, routes, ducts, inicio, lay });
  return L;
}

/**
 * Corre por su misma pared (hasta 4 casillas) a los objetos que quedaron pegados a una escotilla. Las camas de la tripulación (L.beds)
 * que estaban en ese lugar se mueven con su cama. Lo que no encuentra lugar queda igual (y mapaValido() descarta la variante).
 */
function acomoda(rooms, corridors, objects, beds, grates) {
  const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]]; const sala = (x, y) => rooms.find((r) => dentro(r, x, y));
  const puerta = new Set(); // casillas de pasillo pegadas a una sala = escotillas
  for (const c of corridors) for (let y = c.r[1]; y < c.r[1] + c.r[3]; y++) for (let x = c.r[0]; x < c.r[0] + c.r[2]; x++) if (N4.some(([dx, dy]) => sala(x + dx, y + dy))) puerta.add(`${x},${y}`);
  const malo = (x, y) => N4.some(([dx, dy]) => puerta.has(`${x + dx},${y + dy}`)) || grates.some(([gx, gy]) => gx === x && gy === y);
  const ocupado = new Set(objects.map((o) => `${o.x},${o.y}`));
  const out = objects.map((o) => ({ ...o })); let camas = beds.map((b) => [...b]);
  for (const o of out) {
    const r = sala(o.x, o.y); if (!r || r.outside || !malo(o.x, o.y)) continue;
    const enX = o.y === r.y || o.y === r.y + r.h - 1; // pegado a la pared de arriba/abajo: se corre en x; si no, en y
    for (const d of [1, -1, 2, -2, 3, -3, 4, -4]) {
      const nx = enX ? o.x + d : o.x, ny = enX ? o.y : o.y + d;
      if (!dentro(r, nx, ny) || ocupado.has(`${nx},${ny}`) || malo(nx, ny)) continue;
      ocupado.delete(`${o.x},${o.y}`); ocupado.add(`${nx},${ny}`);
      camas = camas.map(([bx, by]) => (bx === o.x && by === o.y ? [nx, ny] : [bx, by])); o.x = nx; o.y = ny; break;
    }
  }
  return { objects: out, beds: camas };
}

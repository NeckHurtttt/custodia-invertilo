// Simulador sin pantalla: un jugador "obediente" que solo cumple el horario.
// Mide cuánto lo castigan sin hacer nada ilegal. Uso: node tools/sim.mjs [destino] [partidas] [dificultad]
import * as G from '../src/core.js';
import * as Sys from '../src/sistemas.js';
const locs = process.argv[2] && process.argv[2] !== 'all' ? [process.argv[2]] : ['estacion', 'luna', 'marte'];
const DBG = {}; const N = +(process.argv[3] ?? 20), dif = process.argv[4];
const DT = 1 / 20, DAYS_MAX = +(process.argv[5] ?? 3);
function bot(s) {
  const p = s.p; if (p.sleep) return { dx: 0, dy: 0 };
  // huir: si algo le hace daño, se va a la sala sin peligros más cercana unos segundos
  if (p.salud < (p.last ?? 100) - 0.01) { const bad = new Set(s.hazards.map((h) => h.room ?? G.roomIdAt(s, h.x, h.y)));
    const ok = s.L.rooms.filter((r) => !r.outside && !r.restricted && !bad.has(r.id) && r.id !== G.playerRoom(s));
    const far = ok.sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0];
    if (far) { p.flee = [far.x + Math.floor(far.w / 2) + 0.5, far.y + Math.floor(far.h / 2) + 0.5]; p.fleeT = 8; } }
  p.last = p.salud;
  if (p.fleeT > 0) { p.fleeT -= DT; return toward(s, p.flee); }
  if (s.sys && !process.env.LAZY) { const mv = sysBot(s); if (mv) return mv; }
  const b = G.block(s); const id = b.room ?? 'dorm';
  if (G.isNight(s) && G.playerRoom(s) === 'dorm') {
    const bed = s.objects.find((o) => o.t === 'cama' && o.mine);
    if (bed && Math.hypot(bed.x + 0.5 - p.x, bed.y + 0.5 - p.y) < 1.45) { G.interact(s); return { dx: 0, dy: 0 }; }
    return toward(s, spot(s, bed.x + 0.5, bed.y + 0.5));
  }
  const r = s.L.rooms.find((x) => x.id === id);
  if (b.id === 'comer' && !s.ate && G.playerRoom(s) === id) {
    const m = s.objects.find((o) => o.t === 'mesa' && G.roomIdAt(s, o.x + 0.5, o.y + 0.5) === id);
    if (m) { if (Math.hypot(m.x + 0.5 - p.x, m.y + 0.5 - p.y) < 1.45) { G.interact(s); return { dx: 0, dy: 0 }; } const g = toward(s, spot(s, m.x + 0.5, m.y + 0.5)); if (g.dx || g.dy) return g; }
  }
  if (G.playerRoom(s) === id && (!p.goal || G.roomIdAt(s, ...p.goal) === id) && p.arr) return { dx: 0, dy: 0 };
  return toward(s, [r.x + Math.floor(r.w / 2) + 0.5, r.y + Math.floor(r.h / 2) + 0.5]);
}
/** Mantenimiento: atiende emergencias y hace las 4 revisiones del turno de trabajo (el LAZY=1 se las salta). */
function sysBot(s) {
  const p = s.p; const y = s.sys; const still = { dx: 0, dy: 0 };
  if (s.action) return still;
  const go = (x0, y0) => { const [x, yy] = spot(s, x0, y0); if (Math.hypot(x - p.x, yy - p.y) < 0.3) { G.interact(s); return still; } const m = toward(s, [x, yy], s.L.rooms.filter((r) => r.restricted || r.outside).map((r) => r.id)); if (m.dx || m.dy) return m; if (Math.hypot(x - p.x, yy - p.y) > 0.1) return { dx: x - p.x, dy: yy - p.y }; G.interact(s); return still; };
  // (se para encima del panel: si no, un compañero cercano se lleva la tecla E)
  if (y.emerg && !process.env.DEAF) return go(y.emerg.x, y.emerg.y);
  if (G.block(s).id === 'trabajo') { const o = Sys.pending(s).map((id) => Sys.station(s, id)).sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0]; if (o) return go(o.x + 0.5, o.y + 0.5); }
  return null;
}
/** Los objetos son sólidos: el bot se para en la casilla libre y alcanzable más cercana a ellos. */
function spot(s, x, y) {
  const tx = Math.floor(x), ty = Math.floor(y); if (!s.map.solid[ty * s.L.W + tx]) return [x, y];
  let best = null; for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) { const nx = tx + dx, ny = ty + dy; if (s.map.grid[ny * s.L.W + nx] !== 1 || s.map.solid[ny * s.L.W + nx]) continue; const pa = G.path(s, s.p.x, s.p.y, nx, ny, 'p'); if (pa && (!best || pa.length < best[0])) best = [pa.length, nx + 0.5, ny + 0.5]; }
  return best ? [best[1], best[2]] : [x, y];
}
function toward(s, g, avoid = ['exterior']) {
  const p = s.p; const pa = G.path(s, p.x, p.y, g[0], g[1], 'p', avoid);
  if (!pa || !pa.length) { p.arr = true; return { dx: 0, dy: 0 }; }
  p.arr = false; const [tx, ty] = pa[0];
  // las escotillas cerradas (la IA cierra una cada 5 s) se abren con E, como haría una persona
  const dr = s.map.doors.find((d) => !d.open && !d.lock && d.tiles.some((q) => q[0] === tx && q[1] === ty));
  const dd = (d) => Math.min(...d.tiles.map(([x, y]) => Math.hypot(x + 0.5 - p.x, y + 0.5 - p.y)));
  if (dr && dd(dr) < 1.3 && s.map.doors.every((d) => d === dr || dd(d) > dd(dr))) { G.interact(s); return { dx: 0, dy: 0 }; } // solo si es la más cercana (E abre la más cercana)
  return { dx: tx + 0.5 - p.x, dy: ty + 0.5 - p.y };
}
for (const loc of locs) {
  const agg = { caught: 0, alertMax: 0, lock: 0, dead: 0, lost: 0, integ: 0, salud: 0, days: 0 };
  for (let k = 0; k < N; k++) {
    const s = G.newGame(loc, 1000 + k, dif, { reflex: !!process.env.REFLEX }); let mx = 0, lk = 0, prevC = 0;
    for (let t = 0; t < 20 * 60 * 60 && !s.over; t++) {
      if (process.env.CALM) { s.hazards.length = 0; s.events.length = 0; s.alert = 0; if (process.env.CALM === '2') s.drones = []; for (const d of s.map.doors) if (d.lock === 'energia' || d.lock === 'cuarentena') d.lock = null; if (s.vil) { s.vil.walkers = []; s.vil.mission = null; } } // CALM=1: sin peligros ni villanos, para medir solo los sistemas
      if (s.pending) { if (s.pending.kind === 'respira') G.resolveBreath(s, Math.random() < 0.7); else s.pending = null; }
      const ctx = `${G.playerRoom(s)}/${G.block(s).id}${s.checked ? '+chk' : ''}${G.isNight(s) ? ' noche' : ''}${G.suspicious(s) ? ' SOSP' : ''} fl${(s.p.fleeT ?? 0) > 0 ? 1 : 0}`; const hs = s.p.salud, ig = s.integ; G.update(s, DT, bot(s));
      const tag = s.hazards.map((h) => h.kind).sort().join(',') || '-';
      if (s.p.salud < hs) DBG['salud ' + tag] = (DBG['salud ' + tag] ?? 0) + hs - s.p.salud;
      if (s.stats.caught > prevC) { const m = s.log[s.log.length - 1]?.text.slice(0, 40); DBG['atrapa ' + m + ' @' + ctx] = (DBG['atrapa ' + m + ' @' + ctx] ?? 0) + 1; }
      if (s.integ < ig) DBG['integ ' + tag] = (DBG['integ ' + tag] ?? 0) + ig - s.integ; mx = Math.max(mx, s.alert);
      if (s.alert === 40 && s.stats.caught > prevC) lk++; prevC = s.stats.caught;
      if (s.day > DAYS_MAX) break;
    }
    agg.caught += s.stats.caught; agg.alertMax += mx; agg.days += s.day; agg.integ += s.integ; agg.salud += s.p.salud;
    if (s.over) { if (/salud/.test(s.over.text)) agg.dead++; else agg.lost++; }
    if (s.sys) { agg.dose = (agg.dose ?? 0) + Sys.dosePct(s); agg.done = (agg.done ?? 0) + s.sys.st.done; agg.skip = (agg.skip ?? 0) + s.sys.st.skipped; agg.saved = (agg.saved ?? 0) + s.sys.st.saved; agg.lvl = (agg.lvl ?? 0) + Object.values(s.sys.lvl).reduce((x, y) => x + y, 0) / 4; if (s.over) agg.why = { ...(agg.why ?? {}), [s.over.title]: ((agg.why ?? {})[s.over.title] ?? 0) + 1 }; }
  }
  if (process.env.DBG) { Object.entries(DBG).sort((a, b) => b[1] - a[1]).filter(([k], i) => i < 6 || k.startsWith('atrapa')).forEach(([k, v]) => console.log('   ', Math.round(v / N), k)); for (const k in DBG) delete DBG[k]; }
  const f = (x) => (x / N).toFixed(1);
  console.log(`${loc.padEnd(9)} atrapado/partida ${f(agg.caught)} · alerta máx ${f(agg.alertMax)} · integridad ${f(agg.integ)} · salud ${f(agg.salud)} · día ${f(agg.days)} · muertes ${agg.dead} · otras derrotas ${agg.lost}`);
  if (agg.dose !== undefined) console.log(`          sistemas: dosis ${f(agg.dose)} % · revisiones hechas ${f(agg.done)} · omitidas ${f(agg.skip)} · emergencias salvadas ${f(agg.saved)} · nivel medio final ${f(agg.lvl)} %${agg.why ? ' · fin: ' + JSON.stringify(agg.why) : ''}`);
}

// Dificultad progresiva y memoria por partida. Lógica pura, sin red ni DOM.
const INTENSITY = { cadete: 0.25, facil: 0.5, normal: 1, dificil: 1.35 };
export function tuning(s) {
  const progress = Math.max(0, Math.min(1, s.mode === 'noche' ? (s.t ?? 0) / 420 : (s.day - 1) / 9));
  const k = progress * (INTENSITY[s.dif] ?? 1);
  return { progress, speed: 1 + 0.27 * k, vision: 1 + 0.22 * k,
    reaction: 1 / (1 + 0.55 * k), persistence: 3 + 4 * k,
    interval: 45 / (1 + 2 * k), searches: k >= 0.8 ? 2 : 1 };
}
export const memory = (s) => s.aiMemory ??= { zones: {}, last: null, sample: 0, decay: 0, stage: 0 };
export function observe(s, dt, visible) {
  if (!s.iaOn) return;
  const m = memory(s), now = s.t ?? 0;
  if (now >= m.decay) {
    m.decay = now + 60;
    for (const [id, z] of Object.entries(m.zones)) {
      z.count *= 0.8; if (z.count < 0.5) delete m.zones[id];
    }
  }
  if (now < m.sample) return;
  m.sample = now + 1;
  if (s.p.hidden || s.p.inDuct || s.p.sleep || !visible) { m.last = null; return; }
  const x = Math.floor(s.p.x) + 0.5, y = Math.floor(s.p.y) + 0.5;
  const slot = Math.floor(s.min / 240), id = `${slot}:${x},${y}`;
  if (m.last !== id) remember(s, id, { x, y, slot, hide: false });
  m.last = id;
}
function remember(s, id, data) {
  const zones = memory(s).zones;
  const z = zones[id] ??= { ...data, count: 0 };
  z.count = Math.min(16, z.count + 1);
  const keys = Object.keys(zones);
  if (keys.length > 128) {
    const weakest = keys.reduce((a, b) => zones[a].count < zones[b].count ? a : b);
    delete zones[weakest];
  }
}
export function hideSeen(s, h) {
  if (s.iaOn) remember(s, `hide:${h.x},${h.y}`, { ...h, slot: Math.floor(s.min / 240), hide: true });
}
export function predict(s) {
  if (!s.iaOn || tuning(s).progress < 0.1) return null;
  const slot = Math.floor(s.min / 240);
  let best = null, score = 0;
  for (const z of Object.values(memory(s).zones)) {
    if (z.count < 2.5) continue;
    const value = z.count * (z.slot === slot ? 1.5 : 0.5) * (z.hide ? 1.2 : 1);
    if (value > score) { best = z; score = value; }
  }
  return best;
}

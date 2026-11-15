// Presupuesto visual de los avisos flotantes. Lógica pura (sin DOM) para poder probarla.
// Idea: la pantalla es de quien juega, no del registro. Todo lo que pasa queda en el panel [4] Avisos; solo se SUBE a la pantalla
// lo que ayuda a decidir algo ahora, con un tope fijo, sin repetir lo que otro panel ya dice y sin estorbar durante una emergencia.
export const PRIO = { bad: 4, ia: 4, warn: 3, day: 2, ok: 2, info: 1 };
export const MAX_AVISOS = 2; // nunca más de dos avisos a la vez (más tapaba el centro de la pantalla)
export const TTL = { bad: 6000, ia: 5500, warn: 4500, day: 4000, ok: 2800, info: 2500 }; // ms en pantalla

const prio = (k) => PRIO[k] ?? 1;

/**
 * Decide qué hacer con un aviso nuevo.
 * visibles: [{ id, kind, text }] en orden de llegada (el más viejo primero). nuevo: { kind, text, quiet }.
 * ctx.emergencia: hay un cartel de emergencia en pantalla → solo pasan avisos de prioridad 3 o más.
 * Devuelve { mostrar: boolean, quitar: [id…] } (avisos viejos que hay que retirar para hacerle lugar).
 */
export function admite(visibles, nuevo, ctx = {}) {
  const no = { mostrar: false, quitar: [] };
  if (!nuevo || nuevo.quiet) return no; // solo al registro
  if (visibles.some((v) => v.text === nuevo.text)) return no; // ya está en pantalla
  const p = prio(nuevo.kind);
  if (ctx.emergencia && p < 3) return no; // en una emergencia no se estorba con información menor
  if (visibles.length < MAX_AVISOS) return { mostrar: true, quitar: [] };
  // sin lugar: se retira el más viejo de los que valen igual o menos; si todos valen más, el nuevo no entra
  const candidato = visibles.filter((v) => prio(v.kind) <= p).sort((a, b) => prio(a.kind) - prio(b.kind))[0];
  return candidato ? { mostrar: true, quitar: [candidato.id] } : no;
}

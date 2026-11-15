// Aspecto de los objetos según el destino (solo dibujo, sin reglas ni azar): el mismo objeto se ve distinto en la Estación,
// la Luna y Marte, para que cada escenario se sienta propio.
//  · Estación (tipo ISS): microgravedad. Sacos de dormir sujetos a la pared, racks blancos con velcro azul, pasamanos amarillos.
//  · Luna (base tipo Artemis): módulos claros con mantas térmicas doradas, polvo gris de regolito, franjas naranjas.
//  · Marte (hábitat): metal oxidado y compuesto marrón, polvo rojo en los bordes, acentos turquesa.
// main.js llama a objeto(); si devuelve false, usa su dibujo de siempre. Cada objeto cabe en 16×16 px (la casilla).
// Pruebas: tests/ambientes.test.js (cada objeto se ve distinto en los tres destinos).

/** Paleta de materiales por destino. */
export const MAT = {
  estacion: { cuerpo: '#d9dee5', borde: '#8f9aa8', oscuro: '#4a5664', acento: '#2f6fd6', acento2: '#ffd23d', tela: '#3b6db3', polvo: null },
  luna: { cuerpo: '#c8c2b4', borde: '#8a8476', oscuro: '#4d4a44', acento: '#e0a83a', acento2: '#ff8a3d', tela: '#d4a640', polvo: '#9a978f' },
  marte: { cuerpo: '#8a5a44', borde: '#5c3a2c', oscuro: '#36231b', acento: '#3dbcb0', acento2: '#ff7a3d', tela: '#d8662e', polvo: '#b5532e' },
};

const R = (b, c, x, y, w, h) => { b.fillStyle = c; b.fillRect(x, y, w, h); };
/** Polvo del destino en el borde de abajo del objeto (la Estación no tiene polvo). */
const polvo = (b, m, x, y, w) => { if (m.polvo) { R(b, m.polvo, x, y, w, 1); R(b, m.polvo, x + 2, y - 1, 3, 1); R(b, m.polvo, x + w - 5, y - 1, 2, 1); } };

/** Dibuja el objeto `o` (o.t = tipo) con el aspecto del destino `theme`. Devuelve false si ese tipo no tiene versión propia. */
export function objeto(b, o, theme) {
  const m = MAT[theme]; if (!m) return false;
  const x = o.x * 16, y = o.y * 16; const est = theme === 'estacion', luna = theme === 'luna';
  switch (o.t) {
    case 'cama':
      if (est) { // saco de dormir vertical, sujeto a la pared con correas (en microgravedad se duerme "parado")
        R(b, m.oscuro, x + 3, y, 10, 16); R(b, o.mine ? '#2bb8c4' : m.tela, x + 4, y + 1, 8, 14); R(b, '#e8eef5', x + 5, y + 2, 6, 3);
        R(b, m.acento2, x + 3, y + 6, 10, 1); R(b, m.acento2, x + 3, y + 11, 10, 1); R(b, m.borde, x + 2, y + 1, 1, 14); R(b, m.borde, x + 13, y + 1, 1, 14);
      } else if (luna) { // litera baja con manta térmica dorada
        R(b, m.borde, x, y + 4, 16, 10); R(b, m.cuerpo, x + 1, y + 5, 14, 7); R(b, '#f2efe6', x + 2, y + 6, 4, 4);
        R(b, o.mine ? '#2bb8c4' : m.tela, x + 6, y + 5, 9, 7); R(b, '#f5d27a', x + 7, y + 6, 7, 1); R(b, m.oscuro, x + 1, y + 13, 2, 3); R(b, m.oscuro, x + 13, y + 13, 2, 3); polvo(b, m, x, y + 15, 16);
      } else { // catre inflable con manta naranja y costillas
        R(b, m.oscuro, x, y + 3, 16, 12); R(b, '#c9b8a6', x + 1, y + 4, 14, 9); for (let i = 0; i < 4; i++) R(b, '#a8978a', x + 2 + i * 4, y + 4, 1, 9);
        R(b, '#efe6da', x + 2, y + 5, 3, 3); R(b, o.mine ? '#2bb8c4' : m.tela, x + 6, y + 5, 9, 7); polvo(b, m, x, y + 15, 16);
      }
      return true;
    case 'escondite': case 'casillero':
      if (est) { // rack blanco con paneles de velcro y etiqueta azul
        R(b, m.borde, x + 2, y, 12, 16); R(b, m.cuerpo, x + 3, y + 1, 10, 14); R(b, m.acento, x + 4, y + 2, 8, 2);
        for (let i = 0; i < 3; i++) R(b, '#b9c2cc', x + 4, y + 6 + i * 3, 8, 2); R(b, m.oscuro, x + 11, y + 9, 1, 2);
      } else if (luna) { // casillero aislado beige con franja naranja y polvo
        R(b, m.oscuro, x + 2, y, 12, 16); R(b, m.cuerpo, x + 3, y + 1, 10, 14); R(b, m.acento2, x + 3, y + 3, 10, 2);
        R(b, m.borde, x + 8, y + 6, 1, 8); R(b, '#5a5650', x + 10, y + 9, 1, 2); polvo(b, m, x + 2, y + 15, 12);
      } else { // armario de metal oxidado con remaches y visor turquesa
        R(b, m.oscuro, x + 2, y, 12, 16); R(b, m.cuerpo, x + 3, y + 1, 10, 14); R(b, m.acento, x + 5, y + 3, 6, 2);
        for (const [dx, dy] of [[4, 6], [11, 6], [4, 13], [11, 13]]) R(b, '#c48a6a', x + dx, y + dy, 1, 1); R(b, '#e0c0a0', x + 10, y + 9, 1, 2); polvo(b, m, x + 2, y + 15, 12);
      }
      if (o.t === 'escondite') R(b, '#2bb8c4', x + 3, y + 14, 10, 1); // el tuyo lleva una marca cian
      return true;
    case 'cajon':
      if (est) { R(b, m.borde, x + 1, y + 4, 14, 12); R(b, m.cuerpo, x + 2, y + 5, 12, 10); R(b, m.acento, x + 2, y + 5, 12, 2); R(b, '#b9c2cc', x + 3, y + 9, 10, 1); R(b, m.oscuro, x + 7, y + 11, 2, 1); }
      else if (luna) { R(b, m.oscuro, x + 1, y + 5, 14, 11); R(b, '#d9dde2', x + 2, y + 6, 12, 9); R(b, m.acento2, x + 2, y + 9, 12, 2); R(b, m.oscuro, x + 7, y + 12, 2, 1); polvo(b, m, x + 1, y + 15, 14); }
      else { R(b, m.oscuro, x + 1, y + 5, 14, 11); R(b, '#a8743a', x + 2, y + 6, 12, 9); R(b, '#6e4a26', x + 2, y + 10, 12, 1); R(b, m.acento, x + 6, y + 7, 4, 2); polvo(b, m, x + 1, y + 15, 14); }
      return true;
    case 'mesa':
      if (est) { // mesa de la cocina con bolsas de comida pegadas con velcro
        R(b, m.borde, x, y + 4, 16, 9); R(b, m.cuerpo, x, y + 3, 16, 4); R(b, m.acento, x + 1, y + 7, 14, 1);
        R(b, '#e8b04a', x + 2, y + 4, 3, 3); R(b, '#6ac46a', x + 7, y + 4, 3, 3); R(b, '#ff8a6a', x + 11, y + 4, 3, 3); R(b, m.acento2, x, y + 12, 16, 1);
      } else if (luna) { R(b, m.oscuro, x + 2, y + 11, 2, 5); R(b, m.oscuro, x + 12, y + 11, 2, 5); R(b, m.borde, x, y + 5, 16, 7); R(b, m.cuerpo, x + 1, y + 5, 14, 5); R(b, '#f2efe6', x + 3, y + 6, 4, 2); R(b, m.acento, x + 9, y + 6, 4, 2); polvo(b, m, x, y + 15, 16); }
      else { R(b, m.oscuro, x + 1, y + 11, 3, 5); R(b, m.oscuro, x + 12, y + 11, 3, 5); R(b, m.cuerpo, x, y + 4, 16, 8); R(b, '#a8745a', x, y + 4, 16, 2); R(b, '#6ac46a', x + 3, y + 7, 3, 3); R(b, m.acento, x + 9, y + 7, 4, 3); polvo(b, m, x, y + 15, 16); }
      return true;
    case 'cinta':
      if (est) { // cinta con arnés de bungee (hay que sujetarse para correr en microgravedad)
        R(b, m.oscuro, x, y + 7, 16, 8); R(b, '#2a2e36', x + 1, y + 8, 14, 6); R(b, m.cuerpo, x + 1, y + 1, 2, 7); R(b, m.cuerpo, x + 13, y + 1, 2, 7);
        R(b, m.acento, x + 3, y + 2, 1, 6); R(b, m.acento, x + 12, y + 2, 1, 6); R(b, m.acento2, x + 1, y + 1, 14, 1);
      } else if (luna) { R(b, m.oscuro, x, y + 7, 16, 8); R(b, '#3a3833', x + 1, y + 8, 14, 6); R(b, m.cuerpo, x + 1, y + 2, 14, 2); R(b, m.cuerpo, x + 1, y + 2, 2, 6); R(b, m.acento2, x + 12, y + 2, 3, 3); polvo(b, m, x, y + 15, 16); }
      else { R(b, m.oscuro, x, y + 6, 16, 9); R(b, '#3a2a22', x + 1, y + 7, 14, 6); R(b, m.cuerpo, x + 1, y + 1, 2, 6); R(b, m.cuerpo, x + 13, y + 1, 2, 6); R(b, m.acento, x + 1, y + 1, 14, 2); polvo(b, m, x, y + 15, 16); }
      return true;
    case 'estudio':
      if (est) { R(b, m.borde, x + 1, y + 1, 14, 12); R(b, '#10243a', x + 2, y + 2, 12, 8); R(b, '#9fd4ff', x + 3, y + 3, 7, 1); R(b, '#9fd4ff', x + 3, y + 5, 5, 1); R(b, m.acento2, x + 3, y + 11, 10, 2); R(b, m.oscuro, x + 7, y + 13, 2, 3); }
      else if (luna) { R(b, m.borde, x, y + 9, 16, 6); R(b, m.oscuro, x + 3, y + 1, 10, 8); R(b, '#2a2410', x + 4, y + 2, 8, 6); R(b, m.acento, x + 5, y + 3, 5, 1); R(b, m.acento, x + 5, y + 5, 3, 1); polvo(b, m, x, y + 15, 16); }
      else { R(b, m.cuerpo, x, y + 9, 16, 6); R(b, m.oscuro, x + 2, y + 1, 12, 8); R(b, '#0e2a28', x + 3, y + 2, 10, 6); R(b, m.acento, x + 4, y + 3, 6, 1); R(b, m.acento, x + 4, y + 5, 4, 1); polvo(b, m, x, y + 15, 16); }
      return true;
    case 'capcom':
      if (est) { R(b, m.borde, x, y + 5, 16, 11); R(b, m.cuerpo, x + 1, y + 6, 14, 9); R(b, '#10243a', x + 2, y + 7, 7, 5); R(b, '#5ff6ff', x + 3, y + 8, 5, 1); R(b, m.oscuro, x + 12, y, 1, 6); R(b, m.acento, x + 11, y, 3, 2); }
      else if (luna) { R(b, m.oscuro, x, y + 6, 16, 10); R(b, m.cuerpo, x + 1, y + 7, 14, 8); R(b, '#2a2410', x + 2, y + 8, 7, 4); R(b, m.acento, x + 3, y + 9, 5, 1); R(b, '#d9dde2', x + 10, y, 5, 4); R(b, m.oscuro, x + 12, y + 3, 1, 4); polvo(b, m, x, y + 15, 16); }
      else { R(b, m.oscuro, x, y + 6, 16, 10); R(b, m.cuerpo, x + 1, y + 7, 14, 8); R(b, '#0e2a28', x + 2, y + 8, 7, 4); R(b, m.acento, x + 3, y + 9, 5, 1); R(b, '#c9b8a6', x + 9, y, 6, 3); R(b, m.oscuro, x + 11, y + 2, 1, 5); polvo(b, m, x, y + 15, 16); }
      return true;
    case 'registro':
      if (est) { R(b, '#3a1418', x + 2, y, 12, 16); R(b, m.cuerpo, x + 3, y + 1, 10, 14); for (let i = 0; i < 4; i++) R(b, '#c94a4a', x + 4, y + 3 + i * 3, 8, 1); }
      else if (luna) { R(b, '#3a1418', x + 2, y, 12, 16); R(b, '#5a2a26', x + 3, y + 1, 10, 14); for (let i = 0; i < 4; i++) R(b, m.acento, x + 4, y + 3 + i * 3, 8, 1); polvo(b, m, x + 2, y + 15, 12); }
      else { R(b, '#2a0c0c', x + 2, y, 12, 16); R(b, '#4a1c18', x + 3, y + 1, 10, 14); for (let i = 0; i < 4; i++) R(b, '#ff6b4a', x + 4, y + 3 + i * 3, 8, 1); polvo(b, m, x + 2, y + 15, 12); }
      return true;
    case 'traje':
      if (est) { // traje de caminata espacial (blanco, mochila grande)
        R(b, m.borde, x + 1, y, 14, 16); R(b, '#f2f5f9', x + 4, y + 1, 8, 6); R(b, '#d8b14a', x + 6, y + 2, 4, 3); R(b, '#f2f5f9', x + 3, y + 7, 10, 6); R(b, '#f2f5f9', x + 4, y + 13, 3, 3); R(b, '#f2f5f9', x + 9, y + 13, 3, 3); R(b, '#ff4b4b', x + 4, y + 8, 2, 1);
      } else if (luna) { R(b, m.oscuro, x + 1, y, 14, 16); R(b, '#f2efe6', x + 4, y + 1, 8, 6); R(b, '#2a3a5a', x + 6, y + 2, 4, 3); R(b, '#f2efe6', x + 3, y + 7, 10, 6); R(b, m.acento2, x + 3, y + 9, 10, 1); R(b, '#f2efe6', x + 4, y + 13, 3, 3); R(b, '#f2efe6', x + 9, y + 13, 3, 3); polvo(b, m, x + 1, y + 15, 14); }
      else { R(b, m.oscuro, x + 1, y, 14, 16); R(b, '#e8ddd0', x + 4, y + 1, 8, 6); R(b, '#1e3a3a', x + 6, y + 2, 4, 3); R(b, '#e8ddd0', x + 3, y + 7, 10, 6); R(b, m.acento2, x + 3, y + 8, 2, 4); R(b, m.acento2, x + 11, y + 8, 2, 4); R(b, '#e8ddd0', x + 4, y + 13, 3, 3); R(b, '#e8ddd0', x + 9, y + 13, 3, 3); polvo(b, m, x + 1, y + 15, 14); }
      return true;
    case 'palanca':
      R(b, m.oscuro, x, y + 4, 16, 12); R(b, m.cuerpo, x + 2, y + 5, 12, 4); R(b, est ? m.acento2 : m.acento, x + 2, y + 11, 12, 2); R(b, '#888', x + 7, y - 2, 2, 7); R(b, '#ff4b4b', x + 6, y - 3, 4, 2);
      if (!est) polvo(b, m, x, y + 15, 16);
      return true;
    case 'mant': { // el color del sistema se mantiene igual en los tres (así se reconoce); cambia el marco
      const c = { vida: '#5fd3ff', energia: '#ffd23d', rad: '#ffb23d', comida: '#5fd35f' }[o.sys] ?? '#fff';
      R(b, m.borde, x + 1, y + 1, 14, 14); R(b, '#161c26', x + 2, y + 2, 12, 9); R(b, c, x + 3, y + 3, 10, 2); R(b, c, x + 3, y + 6, 6, 2);
      R(b, est ? m.cuerpo : m.oscuro, x + 2, y + 12, 12, 2); if (!est) polvo(b, m, x + 1, y + 15, 14); else R(b, m.acento2, x + 1, y + 1, 14, 1);
      return true;
    }
    default: return false;
  }
}

/**
 * Detalles del suelo y las paredes por destino (se hornean una vez en la capa fija). b = contexto, x/y = esquina de la casilla en px,
 * h = número del azar fijo de esa casilla (0..1), pared = la casilla de arriba es pared.
 *  · Estación: pasamanos amarillos bajo las paredes y paneles con tornillos.
 *  · Luna: manchas de regolito gris en el piso.
 *  · Marte: polvo rojo acumulado junto a las paredes y vetas oxidadas.
 */
export function detallePiso(b, theme, x, y, h, pared) {
  if (theme === 'estacion') { if (pared && h < 0.45) R(b, '#c9a92a', x + 2, y + 1, 12, 1); else if (h > 0.93) { R(b, '#3a4a5c', x + 3, y + 3, 1, 1); R(b, '#3a4a5c', x + 12, y + 12, 1, 1); } }
  else if (theme === 'luna') { if (h > 0.82) { R(b, 'rgba(160,156,146,.22)', x + (h * 9 | 0), y + 4, 5, 3); R(b, 'rgba(160,156,146,.16)', x + 3, y + 10, 3, 2); } }
  else if (theme === 'marte') { if (pared) { R(b, 'rgba(181,83,46,.35)', x, y + 1, 16, 2); R(b, 'rgba(181,83,46,.2)', x + (h * 10 | 0), y + 3, 5, 1); } else if (h > 0.88) R(b, 'rgba(120,60,40,.3)', x + 2, y + (h * 12 | 0), 9, 1); }
}

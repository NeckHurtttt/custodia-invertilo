// Los dos "cables" del cooperativo. Los dos devuelven el mismo objeto Link:
//   { send(obj), onmessage(obj), onpeer(up:boolean), onclose(), close(), kind, peerUp, estado, onestado(e) }
//   1) wsLink  → por la red local, usando el servidor del juego (node tools/serve.mjs --lan). Hay que escribir el código de sala.
//   2) rtcHost / rtcGuest → directo de navegador a navegador (WebRTC) sin servidor: se copian y pegan dos códigos a mano.
const mk = (kind) => ({ kind, peerUp: false, onmessage: null, onpeer: null, onclose: null, send() {}, close() {} });
const peer = (L, up) => { L.peerUp = up; L.onpeer?.(up); }; // recuerda si el otro lado está: así se puede enganchar después
const enc = (o) => btoa(unescape(encodeURIComponent(JSON.stringify(o))));
const dec = (t) => JSON.parse(decodeURIComponent(escape(atob(String(t).replace(/\s+/g, '')))));

export const newRoom = () => Array.from({ length: 4 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ'[Math.floor(Math.random() * 24)]).join('');

/** Información de red del servidor (para decirle al jugador qué dirección abrir en la otra computadora). */
export async function netInfo() {
  try { const r = await fetch('/coop/info', { cache: 'no-store' }); const j = await r.json(); return j?.ok ? j : null; } catch { return null; }
}

/**
 * Cable por la red local. Si se cae (WiFi que parpadea, laptop dormida un momento) reconecta solo, con el mismo código de sala:
 *   L.estado: 'ok' | 'reconectando' | 'cerrado'      L.onestado(estado) avisa de cada cambio.
 * Cada 4 s el servidor manda un latido; si pasan 12 s sin oír nada, se da la conexión por colgada y se reconecta.
 * Opciones (para pruebas): { url, WS } = dirección y clase WebSocket alternativas.
 */
export function wsLink(room, role, opt = {}) {
  return new Promise((ok, no) => {
    const WS = opt.WS ?? WebSocket;
    const url = opt.url ?? `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/coop?room=${encodeURIComponent(room)}&role=${role}`;
    const L = mk('ws'); L.estado = 'ok'; let ws = null, cerrado = false, primera = true, intentos = 0, ultimo = 0, vigila = 0, espera = 0;
    const estado = (e) => { if (L.estado !== e) { L.estado = e; L.onestado?.(e); } };
    const silencio = () => { if (!ws || ws.readyState !== 1) return; if (Date.now() - ultimo > 12000) ws.close(); else ws.send('{"t":"hb"}'); }; // latido hacia el servidor: así él también nota si nos fuimos
    const reintenta = () => {
      if (cerrado) return;
      if (++intentos > 30) { cerrado = true; estado('cerrado'); L.onclose?.(); return; } // ~1.5 min sin lograrlo: se da por perdida
      estado('reconectando'); espera = setTimeout(abre, Math.min(3000, 400 * intentos));
    };
    function abre() {
      let w; try { w = new WS(url); } catch (e) { if (primera) return no(e); return reintenta(); }
      ws = w; let abierto = false;
      w.onopen = () => { abierto = true; intentos = 0; ultimo = Date.now(); clearInterval(vigila); vigila = setInterval(silencio, 4000); estado('ok'); if (primera) { primera = false; ok(L); } else L.onback?.(); };
      w.onerror = () => { if (primera && !abierto) { cerrado = true; no(new Error('No pude conectar. ¿Abriste el juego con “node tools/serve.mjs 8000 --lan”? ¿La sala ya tiene ese rol?')); } };
      w.onmessage = (e) => { if (ws !== w) return; ultimo = Date.now(); let m; try { m = JSON.parse(e.data); } catch { return; } if (m?.t === 'hb') return; if (m?.t === 'peer') peer(L, !!m.up); else L.onmessage?.(m); };
      w.onclose = () => { if (ws !== w) return; clearInterval(vigila); if (!abierto && primera) return; peer(L, false); if (cerrado) { estado('cerrado'); L.onclose?.(); } else reintenta(); };
    }
    L.send = (o) => { if (ws && ws.readyState === 1) ws.send(JSON.stringify(o)); };
    L.close = () => { cerrado = true; clearTimeout(espera); clearInterval(vigila); try { ws?.close(); } catch { /* ya cerrada */ } };
    L.drop = () => { try { ws?.close(); } catch { /* ya cerrada */ } }; // simula un corte de red (para pruebas)
    abre();
  });
}

const ICE = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }; // sin internet también sirve en la misma red (candidatos locales)
const listo = (pc) => new Promise((r) => {
  if (pc.iceGatheringState === 'complete') return r();
  const f = () => { if (pc.iceGatheringState === 'complete') { pc.removeEventListener('icegatheringstatechange', f); r(); } };
  pc.addEventListener('icegatheringstatechange', f); setTimeout(r, 5000);
});
function atar(L, ch) {
  L.send = (o) => { if (ch.readyState === 'open') ch.send(JSON.stringify(o)); };
  L.close = () => ch.close();
  ch.onopen = () => peer(L, true); ch.onclose = () => { peer(L, false); L.onclose?.(); };
  ch.onmessage = (e) => { let m; try { m = JSON.parse(e.data); } catch { return; } L.onmessage?.(m); };
  if (ch.readyState === 'open') queueMicrotask(() => peer(L, true));
}

/** Astronauta: genera la invitación. Luego se llama accept(codigoDeRespuesta). */
export async function rtcHost() {
  const pc = new RTCPeerConnection(ICE); const L = mk('rtc'); atar(L, pc.createDataChannel('coop'));
  await pc.setLocalDescription(await pc.createOffer()); await listo(pc);
  return { code: enc(pc.localDescription.toJSON()), link: L, accept: (resp) => pc.setRemoteDescription(dec(resp)) };
}
/** Control de Misión: recibe la invitación y devuelve el código de respuesta. */
export async function rtcGuest(invitacion) {
  const pc = new RTCPeerConnection(ICE); const L = mk('rtc'); pc.ondatachannel = (e) => atar(L, e.channel);
  await pc.setRemoteDescription(dec(invitacion)); await pc.setLocalDescription(await pc.createAnswer()); await listo(pc);
  return { code: enc(pc.localDescription.toJSON()), link: L };
}

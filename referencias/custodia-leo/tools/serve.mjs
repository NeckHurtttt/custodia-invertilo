// Servidor estático mínimo, sin dependencias: para jugar en local.
// Uso (desde la carpeta del proyecto):  node tools/serve.mjs [puerto]
// Luego abre http://localhost:8000 en el navegador.
// Cooperativo en red local:  node tools/serve.mjs 8000 --lan   (deja entrar a otras computadoras de la misma red; muestra su dirección)
// El servidor también hace de "cartero" del cooperativo (WebSocket a mano, sin dependencias): solo reenvía mensajes entre dos jugadores de una sala.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { ordenaRedes } from './redes.mjs';

const raiz = resolve(fileURLToPath(new URL('..', import.meta.url)));
const lan = process.argv.includes('--lan') || process.env.LAN === '1';
const puerto = Number(process.argv.slice(2).find((a) => /^\d+$/.test(a)) ?? process.env.PORT ?? 8000);
const redes = () => ordenaRedes(); // [{ nombre, ip, probable }], la mejor primero (WiFi/Ethernet de casa antes que adaptadores virtuales)
const ips = () => redes().map((r) => r.ip);
const tipos = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg' };

const servidor = createServer(async (req, res) => {
  try {
    let ruta = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (ruta === '/coop/info') { res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify({ ok: true, lan, port: puerto, ips: lan ? ips() : [], redes: lan ? redes() : [] })); return; }
    if (ruta.endsWith('/')) ruta += 'index.html';
    const archivo = normalize(join(raiz, ruta));
    if (archivo !== raiz && !archivo.startsWith(raiz + sep)) { res.writeHead(403).end('Prohibido'); return; }
    if (archivo.split(sep).some((p) => p === '.git' || p === 'node_modules')) { res.writeHead(404).end('No encontrado'); return; }
    const datos = await readFile(archivo);
    res.writeHead(200, { 'Content-Type': tipos[extname(archivo).toLowerCase()] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(datos);
  } catch { res.writeHead(404).end('No encontrado'); }
});
servidor.on('error', (e) => { console.error(e.code === 'EADDRINUSE' ? `El puerto ${puerto} está ocupado. Prueba: node tools/serve.mjs ${puerto + 1}` : e.message); process.exit(1); });

// ---- Cooperativo: salas de 2 jugadores (host = astronauta, guest = Control de Misión). Solo reenvía texto. ----
const salas = new Map();
const MAX_SALAS = 50, MAX_MSG = 64 * 1024;
const ESC = Number(process.env.COOP_ESCALA ?? 1); // solo para pruebas: 0.2 = todo cinco veces más rápido
const LATIDO = 4000 * ESC, SILENCIO = 12000 * ESC, RELEVO = 7000 * ESC; // ms: se manda un latido cada 4 s; sin oír nada en 12 s se corta; tras 7 s sin oír, un cliente nuevo con el mismo rol puede tomar su lugar
function enviar(sock, texto, op = 1) {
  const b = Buffer.from(texto); const n = b.length;
  const cab = n < 126 ? Buffer.from([0x80 | op, n]) : n < 65536 ? Buffer.from([0x80 | op, 126, n >> 8, n & 255]) : null;
  if (cab && !sock.destroyed) sock.write(Buffer.concat([cab, b]));
}
servidor.on('upgrade', (req, sock) => {
  const u = new URL(req.url, 'http://x'); const room = u.searchParams.get('room') ?? ''; const role = u.searchParams.get('role');
  const key = req.headers['sec-websocket-key'];
  if (u.pathname !== '/coop' || !key || !/^[A-Za-z0-9]{3,12}$/.test(room) || !['host', 'guest'].includes(role)) { sock.end('HTTP/1.1 400 Bad Request\r\n\r\n'); return; }
  const origen = req.headers.origin; // una página de otro sitio no puede abrir salas desde el navegador del jugador
  if (origen) { let o = ''; try { o = new URL(origen).host; } catch { /* origen raro */ } if (o !== req.headers.host) { sock.end('HTTP/1.1 403 Forbidden\r\n\r\n'); return; } }
  let sala = salas.get(room);
  const viejo = sala?.[role]; // si el cliente anterior con ese rol ya no da señales (WiFi caído), el nuevo toma su lugar: así funciona reconectar
  if (viejo && Date.now() - viejo.visto > RELEVO) { sala[role] = null; viejo.destroy(); }
  if ((role === 'host' && sala?.host) || (role === 'guest' && sala?.guest) || (!sala && salas.size >= MAX_SALAS)) { sock.end('HTTP/1.1 409 Conflict\r\n\r\n'); return; }
  sock.setNoDelay(true); sock.visto = Date.now();
  const acepta = createHash('sha1').update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
  sock.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${acepta}\r\n\r\n`);
  if (!sala) salas.set(room, (sala = {})); sala[role] = sock;
  const otro = () => sala[role === 'host' ? 'guest' : 'host'];
  const avisa = (up) => { for (const x of [sala.host, sala.guest]) if (x) enviar(x, JSON.stringify({ t: 'peer', up })); };
  if (sala.host && sala.guest) avisa(true);
  let buf = Buffer.alloc(0); let frag = null;
  sock.on('data', (d) => {
    sock.visto = Date.now(); buf = Buffer.concat([buf, d]);
    while (buf.length >= 2) {
      const op = buf[0] & 15, fin = buf[0] & 128, mask = buf[1] & 128; let n = buf[1] & 127, i = 2;
      if (n === 126) { if (buf.length < 4) return; n = buf.readUInt16BE(2); i = 4; } else if (n === 127) { sock.destroy(); return; }
      if (n > MAX_MSG || !mask) { sock.destroy(); return; }
      if (buf.length < i + 4 + n) return;
      const m = buf.subarray(i, i + 4); const dato = Buffer.from(buf.subarray(i + 4, i + 4 + n)); for (let k = 0; k < n; k++) dato[k] ^= m[k & 3];
      buf = buf.subarray(i + 4 + n);
      if (op === 8) { sock.end(); return; }
      if (op === 9) { enviar(sock, dato.toString(), 10); continue; }
      if (op === 1 || op === 0) { frag = op === 1 ? dato : Buffer.concat([frag ?? Buffer.alloc(0), dato]); if (!fin) continue; const txt = frag.toString(); frag = null; if (txt.length < 24 && txt.includes('"hb"')) continue; const o = otro(); if (o) enviar(o, txt); }
    }
  });
  const sale = () => { if (sala[role] !== sock) { sock.destroy(); return; } delete sala[role]; if (otro()) enviar(otro(), JSON.stringify({ t: 'peer', up: false })); if (!sala.host && !sala.guest) salas.delete(room); };
  sock.on('close', sale); sock.on('error', sale);
});
setInterval(() => { // latido: los dos lados saben que el otro sigue vivo, y se cierran las conexiones colgadas
  const ahora = Date.now();
  for (const sala of salas.values()) for (const rol of ['host', 'guest']) { const x = sala[rol]; if (!x) continue; if (ahora - x.visto > SILENCIO) { x.destroy(); continue; } enviar(x, '{"t":"hb"}'); }
}, LATIDO).unref();
servidor.listen(puerto, lan ? '0.0.0.0' : '127.0.0.1', () => {
  console.log(`Juego en http://localhost:${puerto}  (Ctrl+C para parar)`);
  if (lan) {
    const l = redes();
    if (!l.length) console.log('Modo --lan activo, pero no encuentro una red. ¿Estás conectado al WiFi?');
    else {
      console.log('Cooperativo en red local. En la otra computadora abre:');
      for (const r of l) console.log(`   http://${r.ip}:${puerto}${r.probable ? '   ← la más probable' : ''}   (${r.nombre})`);
      console.log('Si no abre: (1) las dos deben estar en la misma WiFi; (2) si Windows pregunta por el firewall, acepta “Redes privadas”.');
      if (process.platform === 'win32') console.log(`Si ya dijiste que no al firewall, abre PowerShell como administrador y pega:\n   netsh advfirewall firewall add rule name="Custodia cooperativo" dir=in action=allow protocol=TCP localport=${puerto}`);
    }
  }
  else console.log('Para jugar cooperativo con otra computadora: node tools/serve.mjs ' + puerto + ' --lan');
});

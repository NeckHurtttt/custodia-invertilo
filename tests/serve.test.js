import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

// Prueba el "cartero" del cooperativo con el servidor real y dos WebSocket de verdad (Node 22+).
const PORT = 18000 + Math.floor(Math.random() * 1000);
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
async function arranca() {
  const p = spawn(process.execPath, ['tools/serve.mjs', String(PORT)], { stdio: 'pipe' });
  for (let i = 0; i < 50; i++) { try { await fetch(`http://127.0.0.1:${PORT}/coop/info`); return p; } catch { await espera(100); } }
  p.kill(); throw new Error('el servidor no arrancó');
}
const conecta = (room, role) => new Promise((ok, no) => {
  const ws = new WebSocket(`ws://127.0.0.1:${PORT}/coop?room=${room}&role=${role}`); const inbox = [];
  ws.onmessage = (e) => inbox.push(JSON.parse(e.data)); ws.onopen = () => ok({ ws, inbox }); ws.onerror = () => no(new Error('rechazado'));
});

test('cooperativo: el servidor empareja host y guest y reenvía mensajes en los dos sentidos', async () => {
  const srv = await arranca();
  try {
    const h = await conecta('ABCD', 'host'); const g = await conecta('ABCD', 'guest'); await espera(150);
    assert.ok(h.inbox.some((m) => m.t === 'peer' && m.up) && g.inbox.some((m) => m.t === 'peer' && m.up));
    h.ws.send(JSON.stringify({ t: 'snap', n: 1 })); g.ws.send(JSON.stringify({ t: 'cmd', k: 'aviso' }));
    const grande = JSON.stringify({ t: 'snap', pad: 'x'.repeat(5000) }); h.ws.send(grande); await espera(200);
    assert.ok(g.inbox.some((m) => m.t === 'snap' && m.n === 1)); assert.ok(h.inbox.some((m) => m.t === 'cmd'));
    assert.ok(g.inbox.some((m) => m.pad?.length === 5000)); // mensajes de más de 125 bytes
    g.ws.close(); await espera(150); assert.ok(h.inbox.some((m) => m.t === 'peer' && m.up === false));
    h.ws.close();
  } finally { srv.kill(); }
});

test('cooperativo: rechaza salas con nombre raro, segundo host y la información de red sin --lan', async () => {
  const srv = await arranca();
  try {
    await assert.rejects(conecta('../x', 'host')); await assert.rejects(conecta('ZZZZ', 'admin'));
    const h = await conecta('SALA', 'host'); await assert.rejects(conecta('SALA', 'host')); h.ws.close();
    const info = await (await fetch(`http://127.0.0.1:${PORT}/coop/info`)).json(); assert.equal(info.lan, false); assert.deepEqual(info.ips, []);
  } finally { srv.kill(); }
});

// ---- Robustez de la conexión (latido, relevo de conexiones caídas, reconexión, origen, direcciones) ----
import { request } from 'node:http';
import { connect as tcp } from 'node:net';
import { ordenaRedes } from '../tools/redes.mjs';

async function arrancaRapido() { // el mismo servidor con los tiempos de latido 5 veces más cortos
  const p = spawn(process.execPath, ['tools/serve.mjs', String(PORT)], { stdio: 'pipe', env: { ...process.env, COOP_ESCALA: '0.2' } });
  for (let i = 0; i < 50; i++) { try { await fetch(`http://127.0.0.1:${PORT}/coop/info`); return p; } catch { await espera(100); } }
  p.kill(); throw new Error('el servidor no arrancó');
}
const intentoRaw = (ruta, headers = {}) => new Promise((ok) => {
  const r = request({ host: '127.0.0.1', port: PORT, path: ruta, headers: { Connection: 'Upgrade', Upgrade: 'websocket', 'Sec-WebSocket-Version': '13', 'Sec-WebSocket-Key': Buffer.from('0123456789abcdef').toString('base64'), ...headers } });
  r.on('upgrade', (res, sock) => { sock.destroy(); ok(res.statusCode); }); r.on('response', (res) => ok(res.statusCode)); r.on('error', () => ok(0)); r.end();
});

test('cooperativo: una página de otro sitio no puede abrir salas (Origin)', async () => {
  const srv = await arranca();
  try {
    assert.equal(await intentoRaw('/coop?room=ORIG&role=host', { Origin: 'http://malo.example' }), 403);
    assert.equal(await intentoRaw('/coop?room=ORIG&role=host', { Origin: `http://127.0.0.1:${PORT}` }), 101);
  } finally { srv.kill(); }
});

test('cooperativo: el servidor manda latidos y suelta a quien se queda callado, para que otro tome su lugar', async () => {
  const srv = await arrancaRapido();
  try {
    const h = await conecta('LATE', 'host'); await espera(1000); assert.ok(h.inbox.some((m) => m.t === 'hb'), 'llega un latido'); h.ws.close();
    // un invitado "fantasma": abre la conexión y no vuelve a decir nada
    const muerto = tcp(PORT, '127.0.0.1'); await new Promise((r) => muerto.once('connect', r));
    muerto.write(`GET /coop?room=FANT&role=guest HTTP/1.1\r\nHost: 127.0.0.1:${PORT}\r\nConnection: Upgrade\r\nUpgrade: websocket\r\nSec-WebSocket-Version: 13\r\nSec-WebSocket-Key: ${Buffer.from('0123456789abcdef').toString('base64')}\r\n\r\n`);
    await espera(300); assert.equal(await intentoRaw('/coop?room=FANT&role=guest'), 409, 'mientras está vivo, nadie le quita el lugar');
    await espera(1700); // pasó el tiempo de relevo
    assert.equal(await intentoRaw('/coop?room=FANT&role=guest'), 101, 'el fantasma ya no estorba');
    muerto.destroy();
  } finally { srv.kill(); }
});

test('cooperativo: wsLink reconecta solo tras un corte y los dos lados se enteran', async () => {
  const srv = await arrancaRapido();
  const antes = globalThis.location; globalThis.location = { protocol: 'http:', host: `127.0.0.1:${PORT}` };
  try {
    const { wsLink } = await import('../src/link.js');
    const host = await wsLink('RECO', 'host'); const guest = await wsLink('RECO', 'guest');
    const seen = { h: [], g: [] }; host.onpeer = (u) => seen.h.push(u); guest.onpeer = (u) => seen.g.push(u); guest.onmessage = (m) => seen.g.push(m.t);
    await espera(200); assert.equal(host.peerUp, true); assert.equal(guest.peerUp, true);
    const estados = []; guest.onestado = (e) => estados.push(e);
    guest.drop(); // se cae la WiFi del invitado
    await espera(1500);
    assert.deepEqual(estados, ['reconectando', 'ok']); assert.equal(guest.peerUp, true, 'el invitado volvió a ver al astronauta');
    assert.ok(seen.h.includes(false) && host.peerUp, 'el astronauta vio el corte y la vuelta');
    host.send({ t: 'snap', n: 7 }); await espera(150); assert.ok(seen.g.includes('snap'), 'los mensajes vuelven a pasar');
    host.close(); guest.close();
  } finally { globalThis.location = antes; srv.kill(); }
});

test('redes: pone primero el WiFi de casa y deja al final los adaptadores virtuales', () => {
  const v4 = (address) => ({ family: 'IPv4', internal: false, address });
  const r = ordenaRedes({
    'vEthernet (WSL)': [v4('172.28.64.1')], 'VirtualBox Host-Only Network': [v4('192.168.56.1')], 'Wi-Fi': [v4('192.168.1.34')],
    Loopback: [{ family: 'IPv4', internal: true, address: '127.0.0.1' }], 'Ethernet 2': [v4('169.254.10.3')],
  });
  assert.equal(r[0].ip, '192.168.1.34'); assert.equal(r[0].probable, true); assert.equal(r.length, 3, 'sin loopback ni 169.254'); assert.ok(r.slice(1).every((x) => !x.probable));
  assert.deepEqual(ordenaRedes({}), []);
});

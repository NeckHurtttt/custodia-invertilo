// Prueba del cooperativo con DOS navegadores reales: uno es el astronauta y otro Control de Misión.
// Usa el servidor real del juego (node tools/serve.mjs --lan) y comprueba las dos conexiones: red local (WebSocket) y código manual (WebRTC).
// Requiere Playwright (npm i --no-save playwright). Uso: node tools/e2e-coop.mjs
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const raiz = resolve(fileURLToPath(new URL('..', import.meta.url)));
const salida = resolve(process.env.E2E_OUT || join(raiz, 'e2e-out')); await mkdir(salida, { recursive: true });
const PORT = 19000 + Math.floor(Math.random() * 900);
let pw; try { pw = await import('playwright'); } catch { console.error('Falta Playwright: npm i --no-save playwright'); process.exit(2); }
const { chromium } = pw.default ?? pw;
let srv;
async function arrancaServidor() {
  srv = spawn(process.execPath, ['tools/serve.mjs', String(PORT), '--lan'], { cwd: raiz, stdio: 'pipe' });
  for (let i = 0; i < 50; i++) { try { await fetch(`http://127.0.0.1:${PORT}/coop/info`); return; } catch { await new Promise((r) => setTimeout(r, 100)); } }
  throw new Error('el servidor no arrancó');
}
await arrancaServidor();
const url = `http://127.0.0.1:${PORT}/index.html`;
const problemas = []; let paso = 0; const ok = (t) => console.log(`✔ ${++paso}. ${t}`);
const opciones = { headless: !process.env.E2E_HEADED, args: ['--no-sandbox'] };
const nav = process.env.CHROME_PATH ? await chromium.launch({ ...opciones, executablePath: process.env.CHROME_PATH }) : await chromium.launch(opciones).catch(() => chromium.launch({ ...opciones, channel: 'chrome' }));
async function nueva(nombre) {
  const c = await nav.newContext({ viewport: { width: 1280, height: 760 } }); const p = await c.newPage();
  p.on('pageerror', (e) => problemas.push(`${nombre}: error de JavaScript: ${e.message}`));
  p.on('console', (m) => { if (m.type() === 'error' && !/favicon|Failed to load resource|ERR_CONNECTION_REFUSED/.test(m.text() + m.location().url)) problemas.push(`${nombre}: consola: ${m.text()}`); });
  await p.goto(url); await p.waitForSelector('#t-coop', { timeout: 10000 }); return p;
}
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
try {
  // ---------- 1) red local ----------
  const astro = await nueva('astronauta'); const control = await nueva('control');
  await astro.click('#t-coop'); await astro.click('#c-host'); await astro.waitForSelector('#c-abrir');
  await astro.waitForFunction(() => /http:\/\/.+:\d+/.test(document.getElementById('c-red')?.textContent ?? ''), null, { timeout: 5000 }).catch(() => {});
  const sala = (await astro.textContent('.sala')).trim(); assert.match(sala, /^[A-Z]{4}$/); ok(`el astronauta ve su código de sala (${sala}) y la dirección de red`);
  await astro.click('#c-abrir'); await astro.waitForFunction(() => /Sala abierta/.test(document.getElementById('c-estado').textContent)); ok('la sala se abre en el servidor');
  await control.click('#t-coop'); await control.click('#c-guest'); await control.fill('#c-sala', sala); await control.click('#c-entrar');
  await control.waitForSelector('#mcc', { timeout: 5000 }); ok('Control de Misión entra a la sala');
  await astro.waitForFunction(() => !document.getElementById('c-empezar').disabled); await astro.click('#c-empezar');
  await astro.waitForSelector('#coop-badge:not([hidden])');
  await control.waitForFunction(() => /pausó/.test(document.getElementById('m-estado').textContent), null, { timeout: 8000 }); ok('mientras el astronauta lee la introducción, Control ve “pausó”');
  await astro.click('#ok');
  await control.waitForFunction(() => /en vivo/.test(document.getElementById('m-estado').textContent), null, { timeout: 8000 }); ok('Control recibe la base en vivo');
  await control.waitForFunction(() => document.querySelectorAll('#m-sis .fila-sis').length >= 4); ok('Control ve los 4 sistemas');
  await control.screenshot({ path: join(salida, 'coop-control.png') });
  // una orden: reasignar recursos (la Estación no tiene retraso)
  await control.click('[data-apoyo="energia"]'); await control.waitForFunction(() => /ejecutada/.test(document.getElementById('m-ack').textContent), null, { timeout: 6000 }); ok('la orden “reasignar recursos” llega, se ejecuta y Control recibe la confirmación');
  await control.click('[data-aviso="bien"]'); await espera(300);
  assert.match(await control.textContent('#m-ack'), /Espera|Enviada|ejecutada/); ok('los mensajes prefabricados funcionan');
  // clima espacial real: Control ve la tormenta con su llamarada, sabe si el astronauta ya está a salvo y puede avisarle
  const verClima = await control.evaluate(() => document.getElementById('m-clima').textContent);
  assert.match(verClima, /CLIMA ESPACIAL REAL/); assert.match(verClima, /Próxima tormenta: día 2/); assert.match(verClima, /NASA DONKI/); ok('Control ve la próxima llamarada REAL de NASA y cuándo llega');
  await astro.evaluate(() => { const { s, Sys } = lfr; Object.assign(s.p, { x: 5.5, y: 13.5, inDuct: false, hidden: null }); Sys.startStorm(s); }); // el comedor no es el refugio de la Estación
  await control.waitForFunction(() => /TORMENTA SOLAR 1 de 3/.test(document.getElementById('m-clima')?.textContent ?? ''), null, { timeout: 6000 });
  assert.match(await control.textContent('#m-clima'), /AFUERA/);
  await control.waitForFunction(() => { const b = document.querySelector('#m-clima [data-aviso="refugio"]'); return b && !b.disabled; }, null, { timeout: 9000 });
  await control.click('#m-clima [data-aviso="refugio"]');
  await astro.waitForFunction(() => lfr.s.log.some((l) => /Control de Misión.*Refugio:/.test(l.text)), null, { timeout: 6000 }); ok('con la tormenta en curso, Control avisa “¡al refugio!” y el astronauta recibe el mensaje con el nombre del refugio');
  await astro.evaluate(() => { const { s, Sys } = lfr; const r = s.L.rooms.find((x) => x.id === Sys.shelterOf(s).room); Object.assign(s.p, { x: r.x + r.w / 2, y: r.y + r.h / 2 }); });
  await control.waitForFunction(() => /YA ESTÁ en el refugio/.test(document.getElementById('m-clima')?.textContent ?? '') && !document.querySelector('#m-clima [data-aviso="refugio"]'), null, { timeout: 6000 }); ok('cuando el astronauta llega al refugio, Control lo ve y el botón de aviso desaparece');
  await control.screenshot({ path: join(salida, 'coop-control-tormenta.png') });
  await control.click('[data-tool="marca"]'); await control.click('#m-mapa', { position: { x: 120, y: 90 } });
  await astro.waitForFunction(() => document.getElementById('coop-badge').textContent.includes('CONECTADO')); ok('el astronauta ve “CONTROL: CONECTADO”');
  await astro.screenshot({ path: join(salida, 'coop-astronauta.png') });

  // ---------- 1b) el servidor se cae y vuelve (como un corte de red largo): los dos navegadores reconectan solos ----------
  srv.kill(); await new Promise((r) => srv.once('exit', r));
  await control.waitForFunction(() => /reconectando|no está conectado/.test(document.getElementById('m-estado').textContent), null, { timeout: 8000 }); ok('al caerse el servidor, Control avisa “reconectando”');
  await astro.waitForFunction(() => /RECONECTANDO|ESPERANDO/.test(document.getElementById('coop-badge').textContent), null, { timeout: 8000 }); ok('el astronauta también lo ve en su insignia');
  await espera(1200); await arrancaServidor();
  await control.waitForFunction(() => /en vivo/.test(document.getElementById('m-estado').textContent), null, { timeout: 20000 }); ok('al volver el servidor, Control se reconecta solo y vuelve a verse “en vivo”');
  await astro.waitForFunction(() => document.getElementById('coop-badge').textContent.includes('CONECTADO'), null, { timeout: 5000 }); ok('el astronauta recupera “CONTROL: CONECTADO” sin tocar nada');
  await control.click('[data-aviso="bien"]'); await control.waitForFunction(() => /Enviada|ejecutada/.test(document.getElementById('m-ack').textContent), null, { timeout: 6000 }); ok('las órdenes vuelven a funcionar después de reconectar');

  // ---------- 1c) enlace directo ?sala=XXXX ----------
  const a3 = await nueva('astronauta3'); await a3.click('#t-coop'); await a3.click('#c-host'); await a3.waitForSelector('#c-abrir');
  await a3.waitForFunction(() => /\?sala=[A-Z]{4}/.test(document.getElementById('c-enlace')?.textContent ?? ''), null, { timeout: 5000 });
  const enlace = (await a3.textContent('#c-enlace')).match(/http:\/\/\S+\?sala=([A-Z]{4})/); assert.ok(enlace); ok(`el astronauta ve un enlace directo (${enlace[0]})`);
  await a3.click('#c-abrir'); await a3.waitForFunction(() => /Sala abierta/.test(document.getElementById('c-estado').textContent));
  const c3 = await (await nav.newContext({ viewport: { width: 1280, height: 760 } })).newPage(); c3.on('pageerror', (e) => problemas.push(`control3: ${e.message}`));
  await c3.goto(`${url}?sala=${enlace[1]}`); await c3.waitForSelector('#mcc', { timeout: 10000 }); ok('abrir el enlace mete a Control de Misión a la sala sin teclear nada');

  // ---------- 2) código manual (WebRTC) ----------
  const a2 = await nueva('astronauta2'); const c2 = await nueva('control2');
  await a2.click('#t-coop'); await a2.click('#c-host'); await a2.click('[data-kind="rtc"]'); await a2.click('#c-gen');
  await a2.waitForFunction(() => document.getElementById('c-inv').value.length > 50, null, { timeout: 15000 }); const inv = await a2.inputValue('#c-inv'); ok(`se genera la invitación (${inv.length} caracteres)`);
  await c2.click('#t-coop'); await c2.click('#c-guest'); await c2.click('[data-kind="rtc"]'); await c2.fill('#c-inv', inv); await c2.click('#c-gen');
  await c2.waitForFunction(() => document.getElementById('c-resp').value.length > 50, null, { timeout: 15000 }); const resp = await c2.inputValue('#c-resp'); ok('Control genera su respuesta');
  await a2.fill('#c-resp', resp); await a2.click('#c-conectar');
  await c2.waitForSelector('#mcc', { timeout: 15000 }); ok('el canal directo (WebRTC) se abre y Control entra');
  await a2.waitForFunction(() => !document.getElementById('c-empezar').disabled, null, { timeout: 5000 }); await a2.click('#c-empezar'); await a2.click('#ok');
  await c2.waitForFunction(() => /en vivo/.test(document.getElementById('m-estado').textContent), null, { timeout: 10000 }); ok('Control recibe la base en vivo por WebRTC');
  assert.deepEqual(problemas, [], problemas.join('\n')); ok('sin errores de JavaScript ni de red');
  console.log(`\nTodo bien (${paso} pasos). Capturas en ${salida}`);
} catch (e) { console.error('\n✘ Falló:', e.message, problemas.length ? '\n' + problemas.join('\n') : ''); process.exitCode = 1; }
finally { await nav.close(); srv?.kill(); }

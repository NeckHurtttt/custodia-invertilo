// Pantallas del cooperativo: elegir rol, conectar (red local o código manual) y la vista de CONTROL DE MISIÓN.
// Solo dibuja y conecta; las reglas están en coop.js y los cables en link.js.
import * as G from './core.js';
import { LOCS } from './locs.js';
import { ROOM_TINT } from './arte.js';
import { CMD, AVISOS, DELAY_NOTE, climaView } from './coop.js';
import { newRoom, netInfo, wsLink, rtcHost, rtcGuest } from './link.js';
import { T } from './i18n.js';

const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const SYSC = { vida: '#5fd3ff', energia: '#ffd23d', rad: '#ffb23d', comida: '#5fd35f' };

/** ctx = { $, open, close, beep, setMenu(v), titleScreen, startHost(locId, link, kind), getDif }. */
export function coopScreens(ctx) {
  const { $, open, beep } = ctx;
  let guestView = null;

  function roles() {
    ctx.setMenu('coop');
    open(`<h2>🤝 ${T('COOPERATIVO · dos computadoras', 'CO-OP · two computers')}</h2>
      <p>${T('Como en una misión real: <b>uno está en la base</b> y <b>otro, en Houston</b>, ve todo y ayuda.', 'Like a real mission: <b>one is on the base</b> and <b>the other, in Houston</b>, sees everything and helps.')}</p>
      <div class="coop-roles">
        <button id="c-host"><span class="ico">🧑‍🚀</span>${T('ASTRONAUTA', 'ASTRONAUT')}<small>${T('Juegas normal en la base. Control de Misión te ayuda desde otra computadora.', 'You play normally on the base. Mission Control helps you from another computer.')}</small></button>
        <button id="c-guest"><span class="ico">🛰️</span>${T('SEGUNDO JUGADOR', 'SECOND PLAYER')}<small>${T('Te unes a la sala del astronauta: caminas por la base como un compañero de la tripulación (haces las revisiones de la mañana) o ayudas desde Control de Misión.', "You join the astronaut's room: you walk around the base as a crewmate (doing the morning checks) or help from Mission Control.")}</small></button>
      </div>
      <p style="color:var(--dim)">${T('Se conectan de dos maneras: por la <b>red local</b> (misma WiFi, con el servidor del juego) o con un <b>código</b> que se copian y pegan (sin servidor).', 'You connect in two ways: over the <b>local network</b> (same WiFi, with the game server) or with a <b>code</b> you copy and paste (no server).')}</p>
      <div class="fila"><button id="volver">${T('VOLVER', 'BACK')}</button></div>`);
    $('c-host').onclick = () => hostScreen(); $('c-guest').onclick = () => guestScreen(); $('volver').onclick = ctx.titleScreen;
  }

  // ---------- astronauta ----------
  function hostScreen(st = { loc: 'estacion', kind: 'ws' }) {
    ctx.setMenu('coop');
    const cards = Object.values(LOCS).map((L) => `<button data-loc="${L.id}" class="${L.id === st.loc ? 'on' : ''}">${L.icon} ${L.name.toUpperCase()}<small>${esc(DELAY_NOTE[L.id] ?? '')}</small></button>`).join('');
    open(`<h2>🧑‍🚀 ${T('ASTRONAUTA', 'ASTRONAUT')}</h2>
      <div class="dificultad"><span class="lbl">${T('DESTINO', 'DESTINATION')}</span>${cards}</div>
      <div class="dificultad"><span class="lbl">${T('CONEXIÓN', 'CONNECTION')}</span><button data-kind="ws" class="${st.kind === 'ws' ? 'on' : ''}">${T('RED LOCAL (misma WiFi)', 'LOCAL NETWORK (same WiFi)')}</button><button data-kind="rtc" class="${st.kind === 'rtc' ? 'on' : ''}">${T('CÓDIGO MANUAL', 'MANUAL CODE')}</button></div>
      <div id="c-cuerpo" class="coop-cuerpo"></div>
      <div class="fila"><button id="c-empezar" disabled>▶ ${T('EMPEZAR', 'START')}</button><button id="volver">${T('VOLVER', 'BACK')}</button></div>`);
    let link = null;
    const estado = (txt, ok = false) => { const e = $('c-estado'); if (e) { e.textContent = txt; e.className = ok ? 'ok' : ''; } };
    const listo = (l, ya) => { link = l; l.onpeer = (up) => { estado(up ? T('✔ Control de Misión conectado', '✔ Mission Control connected') : T('Esperando a Control de Misión…', 'Waiting for Mission Control…'), up); if (up || st.kind === 'ws') $('c-empezar').disabled = false; }; if (ya) $('c-empezar').disabled = false; };
    $('ventana').querySelectorAll('[data-loc]').forEach((b) => (b.onclick = () => { link?.close(); hostScreen({ ...st, loc: b.dataset.loc }); }));
    $('ventana').querySelectorAll('[data-kind]').forEach((b) => (b.onclick = () => { link?.close(); hostScreen({ ...st, kind: b.dataset.kind }); }));
    $('volver').onclick = () => { link?.close(); roles(); };
    $('c-empezar').onclick = () => { beep(660, 0.1); ctx.startHost(st.loc, link, st.kind); };
    const cuerpo = $('c-cuerpo');
    if (st.kind === 'ws') {
      const room = newRoom();
      cuerpo.innerHTML = `<p>${T('1. En <b>esta</b> computadora, el juego debe estar abierto con ', '1. On <b>this</b> computer, the game must be open with ')}<code>node tools/serve.mjs 8000 --lan</code>.</p>
        <p id="c-red" style="color:var(--dim)">${T('Buscando la dirección de red…', 'Looking for the network address…')}</p>
        <p>${T('2. El código de sala es', '2. The room code is')} <b class="sala">${room}</b> <button id="c-abrir">${T('ABRIR SALA', 'OPEN ROOM')}</button></p>
        <p id="c-enlace" style="color:var(--dim)" hidden></p>
        <p id="c-estado" style="color:var(--dim)"></p>`;
      netInfo().then((i) => { $('c-red').innerHTML = !i ? T('⚠ Este juego no está abierto con nuestro servidor: usa <code>node tools/serve.mjs 8000 --lan</code> (o la opción CÓDIGO MANUAL).', '⚠ This game is not open with our server: use <code>node tools/serve.mjs 8000 --lan</code> (or the MANUAL CODE option).')
        : !i.lan ? T('⚠ El servidor no está en modo red: ciérralo y ábrelo con <code>node tools/serve.mjs 8000 --lan</code>.', '⚠ The server is not in network mode: close it and open it with <code>node tools/serve.mjs 8000 --lan</code>.')
          : (() => {
            const r = i.redes?.length ? i.redes : i.ips.map((ip) => ({ ip, probable: false }));
            const mejor = r.find((x) => x.probable) ?? r[0];
            if (mejor) { const e = $('c-enlace'); e.hidden = false; e.innerHTML = `${T('Enlace directo para tu compañero (tripulante)', 'Direct link for your crewmate')}: <b>http://${mejor.ip}:${i.port}/?sala=${room}</b> <button id="c-copia-enlace" class="mini">${T('COPIAR', 'COPY')}</button><br><small>${T('Para entrar como Control de Misión, agrega', 'To join as Mission Control, add')} <code>&rol=mcc</code></small>`; $('c-copia-enlace').onclick = () => navigator.clipboard?.writeText(`http://${mejor.ip}:${i.port}/?sala=${room}`); }
            const otras = r.filter((x) => x !== mejor).map((x) => `http://${x.ip}:${i.port}`);
            return mejor ? T(`En la otra computadora abre el enlace de abajo (misma WiFi).${otras.length ? ` Si no abre, prueba: <b>${otras.join('  o  ')}</b> → COOPERATIVO → CONTROL DE MISIÓN.` : ''}`, `On the other computer open the link below (same WiFi).${otras.length ? ` If it does not open, try: <b>${otras.join('  or  ')}</b> → CO-OP → MISSION CONTROL.` : ''}`) : T('No encuentro tu dirección de red: ¿estás conectado al WiFi? Mira la terminal.', 'I cannot find your network address: are you connected to WiFi? Check the terminal.');
          })(); });
      $('c-abrir').onclick = async () => { try { $('c-abrir').disabled = true; listo(await wsLink(room, 'host')); estado(T('Sala abierta. Esperando a Control de Misión… (puedes empezar ya; entrará cuando conecte)', 'Room open. Waiting for Mission Control… (you can start now; they will join when they connect)')); $('c-empezar').disabled = false; } catch (e) { $('c-abrir').disabled = false; estado(`⚠ ${e.message}`); } };
    } else {
      cuerpo.innerHTML = `<p>1. <button id="c-gen">${T('GENERAR INVITACIÓN', 'CREATE INVITATION')}</button> ${T('y mándasela a Control (chat, WhatsApp…).', 'and send it to Control (chat, WhatsApp…).')}</p>
        <textarea id="c-inv" readonly rows="3" placeholder="${T('aquí aparece la invitación', 'the invitation appears here')}"></textarea> <button id="c-copia" class="mini">${T('COPIAR', 'COPY')}</button>
        <p>${T('2. Control te devuelve una <b>respuesta</b>. Pégala aquí:', '2. Control sends you back a <b>reply</b>. Paste it here:')}</p>
        <textarea id="c-resp" rows="3" placeholder="${T('pega la respuesta', 'paste the reply')}"></textarea> <button id="c-conectar">${T('CONECTAR', 'CONNECT')}</button>
        <p id="c-estado" style="color:var(--dim)"></p>`;
      let h = null;
      $('c-gen').onclick = async () => { $('c-gen').disabled = true; estado(T('Generando…', 'Generating…')); try { h = await rtcHost(); $('c-inv').value = h.code; listo(h.link); estado(T('Invitación lista. Esperando la respuesta de Control…', 'Invitation ready. Waiting for Control\'s reply…')); } catch (e) { $('c-gen').disabled = false; estado(`⚠ ${e.message}`); } };
      $('c-copia').onclick = () => navigator.clipboard?.writeText($('c-inv').value);
      $('c-conectar').onclick = async () => { if (!h) return estado(T('Primero genera la invitación.', 'First create the invitation.')); try { await h.accept($('c-resp').value); estado(T('Conectando…', 'Connecting…')); } catch { estado(T('⚠ Esa respuesta no es válida. Pídesela de nuevo a Control.', '⚠ That reply is not valid. Ask Control for it again.')); } };
    }
  }

  // ---------- control de misión ----------
  function guestScreen(st = { kind: 'ws', rol: 'crew' }) {
    const entra = (l) => (st.rol === 'crew' ? ctx.startCrew(l) : entrar(l)); // el mismo cable sirve para los dos roles // st.sala: código que viene del enlace ?sala=XXXX (entra solo)
    ctx.setMenu('coop');
    open(`<h2>🤝 ${T('ENTRAR A LA SALA', 'JOIN THE ROOM')}</h2>
      <div class="dificultad"><span class="lbl">${T('QUIERO SER', 'I WANT TO BE')}</span><button data-rol="crew" class="${st.rol === 'crew' ? 'on' : ''}">🧑‍🚀 ${T('TRIPULANTE', 'CREWMATE')}</button><button data-rol="mcc" class="${st.rol === 'mcc' ? 'on' : ''}">🛰️ ${T('CONTROL DE MISIÓN', 'MISSION CONTROL')}</button></div>
      <div class="dificultad"><span class="lbl">${T('CONEXIÓN', 'CONNECTION')}</span><button data-kind="ws" class="${st.kind === 'ws' ? 'on' : ''}">${T('RED LOCAL (misma WiFi)', 'LOCAL NETWORK (same WiFi)')}</button><button data-kind="rtc" class="${st.kind === 'rtc' ? 'on' : ''}">${T('CÓDIGO MANUAL', 'MANUAL CODE')}</button></div>
      <div id="c-cuerpo" class="coop-cuerpo"></div>
      <div class="fila"><button id="volver">${T('VOLVER', 'BACK')}</button></div>`);
    $('ventana').querySelectorAll('[data-kind]').forEach((b) => (b.onclick = () => guestScreen({ ...st, kind: b.dataset.kind, sala: undefined })));
    $('ventana').querySelectorAll('[data-rol]').forEach((b) => (b.onclick = () => guestScreen({ ...st, rol: b.dataset.rol })));
    $('volver').onclick = roles;
    const estado = (txt) => { const e = $('c-estado'); if (e) e.textContent = txt; };
    if (st.kind === 'ws') {
      $('c-cuerpo').innerHTML = `<p>${T('Abre en esta computadora la dirección que te dé el astronauta y escribe el <b>código de sala</b> (4 letras):', 'Open on this computer the address the astronaut gives you and type the <b>room code</b> (4 letters):')}</p>
        <input id="c-sala" maxlength="12" size="8" style="text-transform:uppercase" autocomplete="off" value="${esc(st.sala ?? '')}"> <button id="c-entrar">${T('ENTRAR', 'JOIN')}</button><p id="c-estado" style="color:var(--dim)"></p>`;
      let yendo = false;
      $('c-entrar').onclick = async () => { if (yendo) return; const room = $('c-sala').value.trim().toUpperCase(); if (!/^[A-Z0-9]{3,12}$/.test(room)) return estado(T('Escribe el código de 3 a 12 letras o números.', 'Type the code, 3 to 12 letters or numbers.')); yendo = true; try { estado(T('Conectando…', 'Connecting…')); entra(await wsLink(room, 'guest')); } catch (e) { yendo = false; estado(`⚠ ${e.message}`); } };
      if (st.sala) $('c-entrar').onclick();
    } else {
      $('c-cuerpo').innerHTML = `<p>${T('1. Pega aquí la <b>invitación</b> del astronauta:', '1. Paste the astronaut\'s <b>invitation</b> here:')}</p><textarea id="c-inv" rows="3"></textarea> <button id="c-gen">${T('GENERAR RESPUESTA', 'CREATE REPLY')}</button>
        <p>${T('2. Mándale este código de vuelta:', '2. Send this code back:')}</p><textarea id="c-resp" readonly rows="3"></textarea> <button id="c-copia" class="mini">COPIAR</button><p id="c-estado" style="color:var(--dim)"></p>`;
      $('c-copia').onclick = () => navigator.clipboard?.writeText($('c-resp').value);
      $('c-gen').onclick = async () => { try { estado(T('Generando…', 'Generating…')); const g = await rtcGuest($('c-inv').value); $('c-resp').value = g.code; estado(T('Listo: mándale la respuesta al astronauta. Cuando la pegue, esta pantalla cambia sola.', 'Done: send the reply to the astronaut. When they paste it, this screen changes by itself.')); g.link.onpeer = (up) => { if (up) entra(g.link); }; } catch { estado(T('⚠ Esa invitación no es válida.', '⚠ That invitation is not valid.')); } };
    }
  }

  // ---------- la vista de Control ----------
  function entrar(link) {
    ctx.close(); ctx.setMenu('mcc'); guestView?.destroy();
    const root = document.createElement('div'); root.id = 'mcc'; document.body.appendChild(root);
    const V = { link, ref: null, snap: null, tool: 'marca', cd: {}, ack: '', note: '', delay: 0, offline: false, rx: performance.now() };
    root.innerHTML = `<header class="mcc-top"><b>🛰️ ${T('CONTROL DE MISIÓN', 'MISSION CONTROL')}</b><span id="m-reloj">—</span><span id="m-bloque"></span><span id="m-estado" class="ok">${T('conectando…', 'connecting…')}</span><button id="m-salir" class="mini">${T('SALIR', 'EXIT')}</button></header>
      <div class="mcc-cuerpo"><div class="mcc-mapa"><div id="m-herr" class="mcc-herr"><span>${T('CLIC EN EL MAPA:', 'CLICK ON THE MAP:')}</span><button data-tool="marca" class="on">📍 ${T('Marcar punto', 'Mark a spot')}</button><button data-tool="abrir">🚪 ${T('Abrir escotilla', 'Open hatch')}</button></div><p id="m-ack" class="mcc-ack"></p><canvas id="m-mapa"></canvas></div>
      <aside class="mcc-lado"><div class="caja" id="m-astro"></div><div class="caja" id="m-sis"></div><div class="caja" id="m-clima"></div><div class="caja" id="m-ordenes"></div><div class="caja" id="m-log"></div></aside></div><div id="m-fin" class="mcc-fin" hidden></div>`;
    const $m = (id) => root.querySelector('#' + id); const cvm = $m('m-mapa'); const g = cvm.getContext('2d'); let K = 12;
    const ord = () => `<h3>${T('ÓRDENES', 'ORDERS')} <small>(${T('retraso de señal', 'signal delay')}: ${V.delay} s)</small></h3>
      <div class="m-fila"><small>${CMD.apoyo.name}: ${CMD.apoyo.help}</small>${['vida', 'energia', 'rad', 'comida'].map((id) => `<button data-apoyo="${id}" style="border-color:${SYSC[id]}">${{ vida: T('Vida', 'Life'), energia: T('Energía', 'Power'), rad: T('Radiación', 'Radiation'), comida: T('Comida', 'Food') }[id]}</button>`).join('')}</div>
      <div class="m-fila"><small>${T('Mensaje al astronauta:', 'Message to the astronaut:')}</small>${Object.entries(AVISOS).map(([id, a]) => `<button data-aviso="${id}">${esc(a[0])}</button>`).join('')}</div>`;
    $m('m-ordenes').innerHTML = ord();
    const mandar = (m) => { const w = Math.ceil(((V.cd[m.k] ?? 0) - performance.now()) / 1000); if (w > 0) { V.ack = T(`Espera ${w} s para repetir esa orden.`, `Wait ${w} s to repeat that order.`); return pinta(); } V.cd[m.k] = performance.now() + CMD[m.k].cd * 1000; link.send({ t: 'cmd', ...m }); V.ack = T('Enviando…', 'Sending…'); pinta(); };
    root.querySelectorAll('[data-apoyo]').forEach((b) => (b.onclick = () => mandar({ k: 'apoyo', sys: b.dataset.apoyo })));
    root.querySelectorAll('[data-aviso]').forEach((b) => (b.onclick = () => mandar({ k: 'aviso', id: b.dataset.aviso })));
    $m('m-clima').onclick = (e) => { const b = e.target.closest('[data-aviso]'); if (b && !b.disabled) mandar({ k: 'aviso', id: b.dataset.aviso }); }; // el botón de la tormenta se vuelve a dibujar a cada rato: se escucha en la caja
    root.querySelectorAll('[data-tool]').forEach((b) => (b.onclick = () => { V.tool = b.dataset.tool; root.querySelectorAll('[data-tool]').forEach((x) => x.classList.toggle('on', x === b)); }));
    cvm.onclick = (e) => {
      if (!V.ref) return; const r = cvm.getBoundingClientRect(); const x = (e.clientX - r.left) / K, y = (e.clientY - r.top) / K;
      if (V.tool === 'marca') return mandar({ k: 'marca', x, y });
      let best = null; V.ref.map.doors.forEach((d, i) => d.tiles.forEach(([tx, ty]) => { const dd = Math.hypot(tx + 0.5 - x, ty + 0.5 - y); if (dd < 1.2 && (!best || dd < best[0])) best = [dd, i]; }));
      if (best) mandar({ k: 'abrir', door: best[1] }); else { V.ack = T('Haz clic cerca de una escotilla (el rectángulo entre dos salas).', 'Click near a hatch (the rectangle between two rooms).'); pinta(); }
    };
    function dibujaMapa() {
      const s = V.ref; if (!s) return; const L = s.L; const sn = V.snap;
      K = Math.max(6, Math.floor(Math.min((innerWidth - 400) / L.W, (innerHeight - 210) / L.H))); cvm.width = L.W * K; cvm.height = L.H * K;
      g.fillStyle = '#05080d'; g.fillRect(0, 0, cvm.width, cvm.height);
      for (let y = 0; y < L.H; y++) for (let x = 0; x < L.W; x++) {
        const v = s.map.grid[y * L.W + x]; if (v === 0) continue; const ri = s.map.room[y * L.W + x]; const r = ri >= 0 ? L.rooms[ri] : null;
        g.fillStyle = v === 2 ? '#3a4658' : r ? (r.restricted ? '#3a1a1c' : ROOM_TINT[r.kind] ?? '#222a36') : '#1b222d'; g.fillRect(x * K, y * K, K, K);
      }
      g.strokeStyle = '#0b0f16'; g.lineWidth = 1; for (const r of L.rooms) g.strokeRect(r.x * K + 0.5, r.y * K + 0.5, r.w * K - 1, r.h * K - 1);
      g.fillStyle = '#9fb3c8'; g.font = `${Math.max(9, K - 3)}px monospace`; g.textAlign = 'left'; for (const r of L.rooms) { g.save(); g.beginPath(); g.rect(r.x * K, r.y * K, r.w * K, K); g.clip(); g.fillText(r.name, r.x * K + 3, r.y * K + K - 3); g.restore(); }
      V.ref.map.doors.forEach((d, i) => { const st = sn?.doors?.[i] ?? (d.open ? 1 : 0); g.fillStyle = st & 2 ? '#ff5d5d' : st & 1 ? '#4dff88' : '#ffb23d'; for (const [tx, ty] of d.tiles) g.fillRect(tx * K + 2, ty * K + 2, K - 4, K - 4); });
      const pend = new Set((sn?.sys?.tasks ?? []).filter((k) => !k.done).map((k) => k.id));
      for (const o of s.objects.filter((o) => o.t === 'mant')) { g.fillStyle = pend.has(o.sys) ? '#ffc23d' : '#4dff88'; g.fillRect(o.x * K + 2, o.y * K + 2, K - 4, K - 4); g.fillStyle = '#05080d'; g.fillText({ vida: 'V', energia: 'E', rad: 'R', comida: 'C' }[o.sys], o.x * K + K / 3, o.y * K + K - 3); }
      if (!sn) return; const t = performance.now();
      for (const h of sn.haz) { g.fillStyle = '#ff3b3b'; g.beginPath(); g.arc(h.x * K, h.y * K, K * 0.7, 0, 7); g.fill(); }
      const em = sn.sys?.emerg; if (em) { g.strokeStyle = `rgba(255,60,60,${0.5 + 0.5 * Math.sin(t / 120)})`; g.lineWidth = 2; g.beginPath(); g.arc(em.x * K, em.y * K, K * (1 + 0.5 * Math.sin(t / 120)), 0, 7); g.stroke(); }
      if (sn.mark) { g.strokeStyle = '#5ff6ff'; g.lineWidth = 2; g.beginPath(); g.arc(sn.mark.x * K, sn.mark.y * K, K * 0.8, 0, 7); g.stroke(); }
      g.fillStyle = '#5ff6ff'; g.beginPath(); g.arc(sn.p.x * K, sn.p.y * K, K * 0.55, 0, 7); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.stroke();
    }
    function pinta() {
      const sn = V.snap; $m('m-ack').textContent = V.ack;
      const reconectando = link.estado === 'reconectando'; const debil = !V.offline && sn && !sn.paused && performance.now() - V.rx > 3000;
      $m('m-estado').textContent = reconectando ? T('⚠ reconectando…', '⚠ reconnecting…') : V.offline ? T('⚠ el astronauta no está conectado', '⚠ the astronaut is not connected') : debil ? T('⚠ señal débil', '⚠ weak signal') : sn ? (sn.paused ? T('⏸ el astronauta pausó', '⏸ the astronaut paused') : T('● en vivo', '● live')) : T('esperando datos del astronauta…', 'waiting for data from the astronaut…'); $m('m-estado').className = reconectando || V.offline || debil ? 'bad' : 'ok';
      for (const b of root.querySelectorAll('[data-apoyo],[data-aviso]')) { const k = b.dataset.apoyo ? 'apoyo' : 'aviso'; b.disabled = (V.cd[k] ?? 0) > performance.now(); }
      if (!sn) return;
      $m('m-reloj').textContent = `${T('DÍA', 'DAY')} ${sn.day} · ${sn.clock}`; $m('m-bloque').textContent = sn.block.name;
      const bar = (v, low = 30) => `<div class="barrita ${v < low ? 'bajo' : ''}"><i style="width:${Math.max(0, Math.min(100, v))}%"></i></div>`;
      $m('m-astro').innerHTML = `<h3>${T('ASTRONAUTA', 'ASTRONAUT')} · ${esc(sn.p.room)}${sn.p.hidden ? T(' · escondido', ' · hiding') : ''}</h3><div class="fila-sis"><span>${T('SALUD', 'HEALTH')}</span>${bar(sn.p.salud)}<span>${sn.p.salud}</span></div><div class="fila-sis"><span>${T('ENERGÍA', 'ENERGY')}</span>${bar(sn.p.energia)}<span>${sn.p.energia}</span></div>
        <div class="fila-sis"><span>${T('INTEGRIDAD', 'INTEGRITY')}</span>${bar(sn.integ)}<span>${sn.integ}</span></div><div class="fila-sis"><span>${T('ALERTA', 'ALERT')} ${esc(V.ref?.L.ai ?? 'IA')}</span>${bar(100 - sn.alert, 0)}<span>${sn.alert}</span></div>`;
      $m('m-sis').innerHTML = !sn.sys ? `<h3>${T('SISTEMAS', 'SYSTEMS')}</h3><small>${T('Este modo no tiene sistemas.', 'This mode has no systems.')}</small>` : `<h3>${T('SISTEMAS DE LA BASE', 'BASE SYSTEMS')}</h3>${sn.sys.events.map((e) => `<p class="evento">⚠ ${esc(e.name)}: ${esc(e.text)}</p>`).join('')}`
        + sn.sys.meters.map((m) => m.id === 'rad' ? `<div class="fila-sis"><span>${m.name}</span>${bar(100 - sn.sys.dosePct, 25)}<span>${m.v}%</span></div><small>${T('dosis', 'dose')} ${sn.sys.dosePct}% ${T('del límite', 'of the limit')}</small>` : `<div class="fila-sis"><span>${m.name}</span>${bar(m.v)}<span>${m.v}%</span></div>`).join('')
        + `<ul class="plan">${sn.sys.tasks.map((k) => `<li class="${k.done ? 'ok' : ''}">${esc(k.short)} <small>→ ${esc(k.room)}</small></li>`).join('')}</ul>`
        + (sn.sys.emerg ? `<p class="mcc-emerg">🚨 ${esc(sn.sys.emerg.name)} ${T('en', 'in')} ${esc(sn.sys.emerg.room)} · ${sn.sys.emerg.t} s</p>` : '');
      const cv = climaView(sn, V.delay); const cl = $m('m-clima'); cl.hidden = !cv;
      if (cv) {
        const espera = (V.cd.aviso ?? 0) > performance.now();
        const html = `<h3>☀️ ${T('CLIMA ESPACIAL REAL', 'REAL SPACE WEATHER')}</h3>${cv.lineas.map((l, i) => `<p class="${i === 0 && cv.modo === 'tormenta' ? 'mcc-storm' : ''}${cv.tarde && i === cv.lineas.length - 1 ? ' mcc-tarde' : ''}">${esc(l)}</p>`).join('')}`
          + (cv.boton ? `<button class="mcc-grande" data-aviso="refugio" ${espera ? 'disabled' : ''}>📡 ${T('AVISAR: ¡AL REFUGIO!', 'WARN: TO THE SHELTER!')}</button>` : '');
        if (html !== V.climaHtml) { V.climaHtml = html; cl.innerHTML = html; }
      }
      $m('m-log').innerHTML = `<h3>${T('AVISOS DE LA BASE', 'BASE ALERTS')}</h3><ul class="log">${V.log.slice(-8).reverse().map((l) => `<li class="${l.kind}">${esc(l.text)}</li>`).join('')}</ul>`;
      const f = $m('m-fin'); f.hidden = !sn.over; if (sn.over) f.innerHTML = `<b>${sn.over.won ? T('🎉 ¡MISIÓN CUMPLIDA!', '🎉 MISSION ACCOMPLISHED!') : T('💀 MISIÓN FALLIDA', '💀 MISSION FAILED')}</b><br>${esc(sn.over.title)}`;
    }
    V.log = [];
    link.onmessage = (m) => {
      V.rx = performance.now();
      if (m.t === 'hi') { V.delay = m.delay ?? 0; V.note = m.note ?? ''; if (LOCS[m.loc]) { V.ref = G.newGame(m.loc, 1, m.dif ?? 'normal', { mode: m.mode ?? 'campana', lay: m.lay ?? undefined }); V.log = []; } $m('m-ordenes').innerHTML = ord(); root.querySelectorAll('[data-apoyo]').forEach((b) => (b.onclick = () => mandar({ k: 'apoyo', sys: b.dataset.apoyo }))); root.querySelectorAll('[data-aviso]').forEach((b) => (b.onclick = () => mandar({ k: 'aviso', id: b.dataset.aviso }))); V.ack = V.note; }
      else if (m.t === 'snap') { if ((!V.ref || JSON.stringify(V.ref.lay ?? null) !== JSON.stringify(m.lay ?? null)) && LOCS[m.loc]) V.ref = G.newGame(m.loc, 1, 'normal', { lay: m.lay ?? undefined }); V.snap = m; V.log.push(...m.log); V.log = V.log.slice(-30); dibujaMapa(); }
      else if (m.t === 'ack') { V.ack = m.text; if (!m.ok) beep(160, 0.15, 'sawtooth'); }
      pinta();
    };
    link.onpeer = (up) => { V.offline = !up; if (up) link.send({ t: 'hello' }); pinta(); }; // al volver el astronauta (o al reconectar yo) se pide el estado completo
    link.onestado = () => pinta();
    link.onclose = () => { V.offline = true; pinta(); };
    const tick = setInterval(() => { if (V.snap) dibujaMapa(); pinta(); }, 250);
    const salir = () => { clearInterval(tick); link.close(); root.remove(); guestView = null; ctx.setMenu(null); ctx.titleScreen(); };
    $m('m-salir').onclick = salir; guestView = { destroy: () => { clearInterval(tick); root.remove(); } };
    link.send({ t: 'hello' }); pinta();
  }

  return { roles, unirse: (sala, rol = 'crew') => guestScreen({ kind: 'ws', rol, sala }), destroyGuest: () => guestView?.destroy() };
}

// Pantallas del cooperativo: elegir rol, conectar (red local o código manual) y la vista de CONTROL DE MISIÓN.
// Solo dibuja y conecta; las reglas están en coop.js y los cables en link.js.
import * as G from './core.js';
import { LOCS } from './locs.js';
import { ROOM_TINT } from './arte.js';
import { CMD, AVISOS, DELAY_NOTE } from './coop.js';
import { newRoom, netInfo, wsLink, rtcHost, rtcGuest } from './link.js';

const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const SYSC = { vida: '#5fd3ff', energia: '#ffd23d', rad: '#ffb23d', comida: '#5fd35f' };

/** ctx = { $, open, close, beep, setMenu(v), titleScreen, startHost(locId, link, kind), getDif }. */
export function coopScreens(ctx) {
  const { $, open, beep } = ctx;
  let guestView = null;

  function roles() {
    ctx.setMenu('coop');
    open(`<h2>🤝 COOPERATIVO · dos computadoras</h2>
      <p>Como en una misión real: <b>uno está en la base</b> y <b>otro, en Houston</b>, ve todo y ayuda.</p>
      <div class="coop-roles">
        <button id="c-host"><span class="ico">🧑‍🚀</span>ASTRONAUTA<small>Juegas normal en la base. Control de Misión te ayuda desde otra computadora.</small></button>
        <button id="c-guest"><span class="ico">🛰️</span>CONTROL DE MISIÓN<small>No caminas: ves los sistemas, el mapa y las alarmas, y mandas ayuda (recursos, escotillas, balizas, mensajes).</small></button>
      </div>
      <p style="color:var(--dim)">Se conectan de dos maneras: por la <b>red local</b> (misma WiFi, con el servidor del juego) o con un <b>código</b> que se copian y pegan (sin servidor).</p>
      <div class="fila"><button id="volver">VOLVER</button></div>`);
    $('c-host').onclick = () => hostScreen(); $('c-guest').onclick = () => guestScreen(); $('volver').onclick = ctx.titleScreen;
  }

  // ---------- astronauta ----------
  function hostScreen(st = { loc: 'estacion', kind: 'ws' }) {
    ctx.setMenu('coop');
    const cards = Object.values(LOCS).map((L) => `<button data-loc="${L.id}" class="${L.id === st.loc ? 'on' : ''}">${L.icon} ${L.name.toUpperCase()}<small>${esc(DELAY_NOTE[L.id] ?? '')}</small></button>`).join('');
    open(`<h2>🧑‍🚀 ASTRONAUTA</h2>
      <div class="dificultad"><span class="lbl">DESTINO</span>${cards}</div>
      <div class="dificultad"><span class="lbl">CONEXIÓN</span><button data-kind="ws" class="${st.kind === 'ws' ? 'on' : ''}">RED LOCAL (misma WiFi)</button><button data-kind="rtc" class="${st.kind === 'rtc' ? 'on' : ''}">CÓDIGO MANUAL</button></div>
      <div id="c-cuerpo" class="coop-cuerpo"></div>
      <div class="fila"><button id="c-empezar" disabled>▶ EMPEZAR</button><button id="volver">VOLVER</button></div>`);
    let link = null;
    const estado = (txt, ok = false) => { const e = $('c-estado'); if (e) { e.textContent = txt; e.className = ok ? 'ok' : ''; } };
    const listo = (l, ya) => { link = l; l.onpeer = (up) => { estado(up ? '✔ Control de Misión conectado' : 'Esperando a Control de Misión…', up); if (up || st.kind === 'ws') $('c-empezar').disabled = false; }; if (ya) $('c-empezar').disabled = false; };
    $('ventana').querySelectorAll('[data-loc]').forEach((b) => (b.onclick = () => { link?.close(); hostScreen({ ...st, loc: b.dataset.loc }); }));
    $('ventana').querySelectorAll('[data-kind]').forEach((b) => (b.onclick = () => { link?.close(); hostScreen({ ...st, kind: b.dataset.kind }); }));
    $('volver').onclick = () => { link?.close(); roles(); };
    $('c-empezar').onclick = () => { beep(660, 0.1); ctx.startHost(st.loc, link, st.kind); };
    const cuerpo = $('c-cuerpo');
    if (st.kind === 'ws') {
      const room = newRoom();
      cuerpo.innerHTML = `<p>1. En <b>esta</b> computadora, el juego debe estar abierto con <code>node tools/serve.mjs 8000 --lan</code>.</p>
        <p id="c-red" style="color:var(--dim)">Buscando la dirección de red…</p>
        <p>2. El código de sala es <b class="sala">${room}</b> <button id="c-abrir">ABRIR SALA</button></p>
        <p id="c-enlace" style="color:var(--dim)" hidden></p>
        <p id="c-estado" style="color:var(--dim)"></p>`;
      netInfo().then((i) => { $('c-red').innerHTML = !i ? '⚠ Este juego no está abierto con nuestro servidor: usa <code>node tools/serve.mjs 8000 --lan</code> (o la opción CÓDIGO MANUAL).'
        : !i.lan ? '⚠ El servidor no está en modo red: ciérralo y ábrelo con <code>node tools/serve.mjs 8000 --lan</code>.'
          : (() => {
            const r = i.redes?.length ? i.redes : i.ips.map((ip) => ({ ip, probable: false }));
            const mejor = r.find((x) => x.probable) ?? r[0];
            if (mejor) { const e = $('c-enlace'); e.hidden = false; e.innerHTML = `Enlace directo para Control: <b>http://${mejor.ip}:${i.port}/?sala=${room}</b> <button id="c-copia-enlace" class="mini">COPIAR</button>`; $('c-copia-enlace').onclick = () => navigator.clipboard?.writeText(`http://${mejor.ip}:${i.port}/?sala=${room}`); }
            const otras = r.filter((x) => x !== mejor).map((x) => `http://${x.ip}:${i.port}`);
            return mejor ? `En la otra computadora abre el enlace de abajo (misma WiFi).${otras.length ? ` Si no abre, prueba: <b>${otras.join('  o  ')}</b> → COOPERATIVO → CONTROL DE MISIÓN.` : ''}` : 'No encuentro tu dirección de red: ¿estás conectado al WiFi? Mira la terminal.';
          })(); });
      $('c-abrir').onclick = async () => { try { $('c-abrir').disabled = true; listo(await wsLink(room, 'host')); estado('Sala abierta. Esperando a Control de Misión… (puedes empezar ya; entrará cuando conecte)'); $('c-empezar').disabled = false; } catch (e) { $('c-abrir').disabled = false; estado(`⚠ ${e.message}`); } };
    } else {
      cuerpo.innerHTML = `<p>1. <button id="c-gen">GENERAR INVITACIÓN</button> y mándasela a Control (chat, WhatsApp…).</p>
        <textarea id="c-inv" readonly rows="3" placeholder="aquí aparece la invitación"></textarea> <button id="c-copia" class="mini">COPIAR</button>
        <p>2. Control te devuelve una <b>respuesta</b>. Pégala aquí:</p>
        <textarea id="c-resp" rows="3" placeholder="pega la respuesta"></textarea> <button id="c-conectar">CONECTAR</button>
        <p id="c-estado" style="color:var(--dim)"></p>`;
      let h = null;
      $('c-gen').onclick = async () => { $('c-gen').disabled = true; estado('Generando…'); try { h = await rtcHost(); $('c-inv').value = h.code; listo(h.link); estado('Invitación lista. Esperando la respuesta de Control…'); } catch (e) { $('c-gen').disabled = false; estado(`⚠ ${e.message}`); } };
      $('c-copia').onclick = () => navigator.clipboard?.writeText($('c-inv').value);
      $('c-conectar').onclick = async () => { if (!h) return estado('Primero genera la invitación.'); try { await h.accept($('c-resp').value); estado('Conectando…'); } catch { estado('⚠ Esa respuesta no es válida. Pídesela de nuevo a Control.'); } };
    }
  }

  // ---------- control de misión ----------
  function guestScreen(st = { kind: 'ws' }) { // st.sala: código que viene del enlace ?sala=XXXX (entra solo)
    ctx.setMenu('coop');
    open(`<h2>🛰️ CONTROL DE MISIÓN</h2>
      <div class="dificultad"><span class="lbl">CONEXIÓN</span><button data-kind="ws" class="${st.kind === 'ws' ? 'on' : ''}">RED LOCAL (misma WiFi)</button><button data-kind="rtc" class="${st.kind === 'rtc' ? 'on' : ''}">CÓDIGO MANUAL</button></div>
      <div id="c-cuerpo" class="coop-cuerpo"></div>
      <div class="fila"><button id="volver">VOLVER</button></div>`);
    $('ventana').querySelectorAll('[data-kind]').forEach((b) => (b.onclick = () => guestScreen({ kind: b.dataset.kind })));
    $('volver').onclick = roles;
    const estado = (txt) => { const e = $('c-estado'); if (e) e.textContent = txt; };
    if (st.kind === 'ws') {
      $('c-cuerpo').innerHTML = `<p>Abre en esta computadora la dirección que te dé el astronauta y escribe el <b>código de sala</b> (4 letras):</p>
        <input id="c-sala" maxlength="12" size="8" style="text-transform:uppercase" autocomplete="off" value="${esc(st.sala ?? '')}"> <button id="c-entrar">ENTRAR</button><p id="c-estado" style="color:var(--dim)"></p>`;
      let yendo = false;
      $('c-entrar').onclick = async () => { if (yendo) return; const room = $('c-sala').value.trim().toUpperCase(); if (!/^[A-Z0-9]{3,12}$/.test(room)) return estado('Escribe el código de 3 a 12 letras o números.'); yendo = true; try { estado('Conectando…'); entrar(await wsLink(room, 'guest')); } catch (e) { yendo = false; estado(`⚠ ${e.message}`); } };
      if (st.sala) $('c-entrar').onclick();
    } else {
      $('c-cuerpo').innerHTML = `<p>1. Pega aquí la <b>invitación</b> del astronauta:</p><textarea id="c-inv" rows="3"></textarea> <button id="c-gen">GENERAR RESPUESTA</button>
        <p>2. Mándale este código de vuelta:</p><textarea id="c-resp" readonly rows="3"></textarea> <button id="c-copia" class="mini">COPIAR</button><p id="c-estado" style="color:var(--dim)"></p>`;
      $('c-copia').onclick = () => navigator.clipboard?.writeText($('c-resp').value);
      $('c-gen').onclick = async () => { try { estado('Generando…'); const g = await rtcGuest($('c-inv').value); $('c-resp').value = g.code; estado('Listo: mándale la respuesta al astronauta. Cuando la pegue, esta pantalla cambia sola.'); g.link.onpeer = (up) => { if (up) entrar(g.link); }; } catch { estado('⚠ Esa invitación no es válida.'); } };
    }
  }

  // ---------- la vista de Control ----------
  function entrar(link) {
    ctx.close(); ctx.setMenu('mcc'); guestView?.destroy();
    const root = document.createElement('div'); root.id = 'mcc'; document.body.appendChild(root);
    const V = { link, ref: null, snap: null, tool: 'marca', cd: {}, ack: '', note: '', delay: 0, offline: false, rx: performance.now() };
    root.innerHTML = `<header class="mcc-top"><b>🛰️ CONTROL DE MISIÓN</b><span id="m-reloj">—</span><span id="m-bloque"></span><span id="m-estado" class="ok">conectando…</span><button id="m-salir" class="mini">SALIR</button></header>
      <div class="mcc-cuerpo"><div class="mcc-mapa"><div id="m-herr" class="mcc-herr"><span>CLIC EN EL MAPA:</span><button data-tool="marca" class="on">📍 Marcar punto</button><button data-tool="abrir">🚪 Abrir escotilla</button></div><p id="m-ack" class="mcc-ack"></p><canvas id="m-mapa"></canvas></div>
      <aside class="mcc-lado"><div class="caja" id="m-astro"></div><div class="caja" id="m-sis"></div><div class="caja" id="m-ordenes"></div><div class="caja" id="m-log"></div></aside></div><div id="m-fin" class="mcc-fin" hidden></div>`;
    const $m = (id) => root.querySelector('#' + id); const cvm = $m('m-mapa'); const g = cvm.getContext('2d'); let K = 12;
    const ord = () => `<h3>ÓRDENES <small>(retraso de señal: ${V.delay} s)</small></h3>
      <div class="m-fila"><small>${CMD.apoyo.name}: ${CMD.apoyo.help}</small>${['vida', 'energia', 'rad', 'comida'].map((id) => `<button data-apoyo="${id}" style="border-color:${SYSC[id]}">${{ vida: 'Vida', energia: 'Energía', rad: 'Radiación', comida: 'Comida' }[id]}</button>`).join('')}</div>
      <div class="m-fila"><small>Mensaje al astronauta:</small>${Object.entries(AVISOS).map(([id, a]) => `<button data-aviso="${id}">${esc(a[0])}</button>`).join('')}</div>`;
    $m('m-ordenes').innerHTML = ord();
    const mandar = (m) => { const w = Math.ceil(((V.cd[m.k] ?? 0) - performance.now()) / 1000); if (w > 0) { V.ack = `Espera ${w} s para repetir esa orden.`; return pinta(); } V.cd[m.k] = performance.now() + CMD[m.k].cd * 1000; link.send({ t: 'cmd', ...m }); V.ack = 'Enviando…'; pinta(); };
    root.querySelectorAll('[data-apoyo]').forEach((b) => (b.onclick = () => mandar({ k: 'apoyo', sys: b.dataset.apoyo })));
    root.querySelectorAll('[data-aviso]').forEach((b) => (b.onclick = () => mandar({ k: 'aviso', id: b.dataset.aviso })));
    root.querySelectorAll('[data-tool]').forEach((b) => (b.onclick = () => { V.tool = b.dataset.tool; root.querySelectorAll('[data-tool]').forEach((x) => x.classList.toggle('on', x === b)); }));
    cvm.onclick = (e) => {
      if (!V.ref) return; const r = cvm.getBoundingClientRect(); const x = (e.clientX - r.left) / K, y = (e.clientY - r.top) / K;
      if (V.tool === 'marca') return mandar({ k: 'marca', x, y });
      let best = null; V.ref.map.doors.forEach((d, i) => d.tiles.forEach(([tx, ty]) => { const dd = Math.hypot(tx + 0.5 - x, ty + 0.5 - y); if (dd < 1.2 && (!best || dd < best[0])) best = [dd, i]; }));
      if (best) mandar({ k: 'abrir', door: best[1] }); else { V.ack = 'Haz clic cerca de una escotilla (el rectángulo entre dos salas).'; pinta(); }
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
      $m('m-estado').textContent = reconectando ? '⚠ reconectando…' : V.offline ? '⚠ el astronauta no está conectado' : debil ? '⚠ señal débil' : sn ? (sn.paused ? '⏸ el astronauta pausó' : '● en vivo') : 'esperando datos del astronauta…'; $m('m-estado').className = reconectando || V.offline || debil ? 'bad' : 'ok';
      for (const b of root.querySelectorAll('[data-apoyo],[data-aviso]')) { const k = b.dataset.apoyo ? 'apoyo' : 'aviso'; b.disabled = (V.cd[k] ?? 0) > performance.now(); }
      if (!sn) return;
      $m('m-reloj').textContent = `DÍA ${sn.day} · ${sn.clock}`; $m('m-bloque').textContent = sn.block.name;
      const bar = (v, low = 30) => `<div class="barrita ${v < low ? 'bajo' : ''}"><i style="width:${Math.max(0, Math.min(100, v))}%"></i></div>`;
      $m('m-astro').innerHTML = `<h3>ASTRONAUTA · ${esc(sn.p.room)}${sn.p.hidden ? ' · escondido' : ''}</h3><div class="fila-sis"><span>SALUD</span>${bar(sn.p.salud)}<span>${sn.p.salud}</span></div><div class="fila-sis"><span>ENERGÍA</span>${bar(sn.p.energia)}<span>${sn.p.energia}</span></div>
        <div class="fila-sis"><span>INTEGRIDAD</span>${bar(sn.integ)}<span>${sn.integ}</span></div><div class="fila-sis"><span>ALERTA ${esc(V.ref?.L.ai ?? 'IA')}</span>${bar(100 - sn.alert, 0)}<span>${sn.alert}</span></div>`;
      $m('m-sis').innerHTML = !sn.sys ? '<h3>SISTEMAS</h3><small>Este modo no tiene sistemas.</small>' : `<h3>SISTEMAS DE LA BASE</h3>${sn.sys.events.map((e) => `<p class="evento">⚠ ${esc(e.name)}: ${esc(e.text)}</p>`).join('')}`
        + sn.sys.meters.map((m) => m.id === 'rad' ? `<div class="fila-sis"><span>${m.name}</span>${bar(100 - sn.sys.dosePct, 25)}<span>${m.v}%</span></div><small>dosis ${sn.sys.dosePct}% del límite</small>` : `<div class="fila-sis"><span>${m.name}</span>${bar(m.v)}<span>${m.v}%</span></div>`).join('')
        + `<ul class="plan">${sn.sys.tasks.map((k) => `<li class="${k.done ? 'ok' : ''}">${esc(k.short)} <small>→ ${esc(k.room)}</small></li>`).join('')}</ul>`
        + (sn.sys.emerg ? `<p class="mcc-emerg">🚨 ${esc(sn.sys.emerg.name)} en ${esc(sn.sys.emerg.room)} · ${sn.sys.emerg.t} s</p>` : '');
      $m('m-log').innerHTML = `<h3>AVISOS DE LA BASE</h3><ul class="log">${V.log.slice(-8).reverse().map((l) => `<li class="${l.kind}">${esc(l.text)}</li>`).join('')}</ul>`;
      const f = $m('m-fin'); f.hidden = !sn.over; if (sn.over) f.innerHTML = `<b>${sn.over.won ? '🎉 ¡MISIÓN CUMPLIDA!' : '💀 MISIÓN FALLIDA'}</b><br>${esc(sn.over.title)}`;
    }
    V.log = [];
    link.onmessage = (m) => {
      V.rx = performance.now();
      if (m.t === 'hi') { V.delay = m.delay ?? 0; V.note = m.note ?? ''; if (LOCS[m.loc]) { V.ref = G.newGame(m.loc, 1, m.dif ?? 'normal', { mode: m.mode ?? 'campana' }); V.log = []; } $m('m-ordenes').innerHTML = ord(); root.querySelectorAll('[data-apoyo]').forEach((b) => (b.onclick = () => mandar({ k: 'apoyo', sys: b.dataset.apoyo }))); root.querySelectorAll('[data-aviso]').forEach((b) => (b.onclick = () => mandar({ k: 'aviso', id: b.dataset.aviso }))); V.ack = V.note; }
      else if (m.t === 'snap') { if (!V.ref && LOCS[m.loc]) V.ref = G.newGame(m.loc, 1); V.snap = m; V.log.push(...m.log); V.log = V.log.slice(-30); dibujaMapa(); }
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

  return { roles, unirse: (sala) => guestScreen({ kind: 'ws', sala }), destroyGuest: () => guestView?.destroy() };
}

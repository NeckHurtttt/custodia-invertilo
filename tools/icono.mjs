// Genera los íconos de la aplicación (icons/*.png) a partir de un SVG con Playwright (npm i --no-save playwright).
// Uso: node tools/icono.mjs   — solo hace falta volver a correrlo si se cambia el diseño del ícono.
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = resolve(fileURLToPath(new URL('..', import.meta.url)));
// Diseño: planeta, órbita, estación (ámbar) y el "ojo" rojo de la IA. Deja margen para que sirva como ícono "maskable".
const svg = (margen) => `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs><radialGradient id="p" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#6fb4ff"/><stop offset="1" stop-color="#16315f"/></radialGradient></defs>
  <rect width="512" height="512" fill="#04101c"/>
  <g transform="translate(256 256) scale(${1 - margen}) translate(-256 -256)">
    <circle cx="256" cy="262" r="132" fill="url(#p)"/>
    <ellipse cx="256" cy="262" rx="208" ry="62" fill="none" stroke="#5ff6ff" stroke-width="12" transform="rotate(-24 256 262)" opacity=".95"/>
    <path d="M44 300a208 62 0 0 1 90-120" fill="none" stroke="#04101c" stroke-width="22" transform="rotate(-24 256 262) translate(0 0)" opacity="0"/>
    <rect x="378" y="148" width="46" height="24" rx="4" fill="#ffc23d" transform="rotate(-24 400 160)"/>
    <rect x="360" y="152" width="14" height="16" fill="#ffd98a" transform="rotate(-24 367 160)"/>
    <circle cx="348" cy="352" r="30" fill="#ff4b4b"/><circle cx="348" cy="352" r="12" fill="#2a0508"/><circle cx="342" cy="345" r="5" fill="#ffd0d0"/>
  </g>
</svg>`;

let pw; try { pw = await import('playwright'); } catch { console.error('Falta Playwright: npm i --no-save playwright'); process.exit(2); }
const { chromium } = pw.default ?? pw;
await mkdir(resolve(raiz, 'icons'), { recursive: true });
const nav = process.env.CHROME_PATH ? await chromium.launch({ executablePath: process.env.CHROME_PATH }) : await chromium.launch().catch(() => chromium.launch({ channel: 'chrome' }));
for (const [archivo, lado, margen] of [['icon-192.png', 192, 0.06], ['icon-512.png', 512, 0.06], ['icon-maskable-512.png', 512, 0.2]]) {
  const pg = await nav.newPage({ viewport: { width: lado, height: lado } });
  await pg.setContent(`<style>html,body{margin:0}svg{width:${lado}px;height:${lado}px;display:block}</style>${svg(margen)}`);
  await pg.screenshot({ path: resolve(raiz, 'icons', archivo) }); await pg.close(); console.log('✔', archivo);
}
await nav.close();

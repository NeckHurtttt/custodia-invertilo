// Elige qué direcciones de red enseñar al jugador para el cooperativo.
// En Windows suele haber adaptadores falsos (WSL, VirtualBox, Docker, VPN…) que no sirven desde otra computadora;
// aquí se descartan o se mandan al final, y se ponen primero las de WiFi/Ethernet de casa (192.168.x, 10.x, 172.16-31.x).
import { networkInterfaces } from 'node:os';

const VIRTUAL = /vethernet|virtualbox|vmware|vmnet|wsl|docker|hyper-v|loopback|bluetooth|tailscale|zerotier|hamachi|vpn|tap-|tun\d|utun|br-|veth|podman|npcap/i;

/** Puntaje de una dirección IPv4: más alto = más probable que sirva desde otra PC de la misma red. */
export function puntua(ip, nombre = '') {
  if (/^169\.254\./.test(ip)) return null; // sin DHCP: no sirve
  let p = /^192\.168\./.test(ip) ? 30 : /^10\./.test(ip) ? 20 : /^172\.(1[6-9]|2\d|3[01])\./.test(ip) ? 10 : 5;
  if (VIRTUAL.test(nombre)) p -= 25; // adaptador virtual
  if (/wi-?fi|wlan|wireless|inal[aá]mbrico|ethernet|en0|en1|eth0|wlp|eno/i.test(nombre) && !VIRTUAL.test(nombre)) p += 8;
  return p;
}

/** Recibe lo mismo que devuelve os.networkInterfaces(). Devuelve [{ nombre, ip, probable }] ordenado de mejor a peor. */
export function ordenaRedes(tabla = networkInterfaces()) {
  const lista = [];
  for (const [nombre, direcciones] of Object.entries(tabla ?? {})) for (const i of direcciones ?? []) {
    if (!i || i.family !== 'IPv4' || i.internal) continue;
    const p = puntua(i.address, nombre); if (p === null) continue;
    lista.push({ nombre, ip: i.address, p });
  }
  lista.sort((a, b) => b.p - a.p);
  const mejor = lista[0]?.p ?? 0;
  return lista.map(({ nombre, ip, p }) => ({ nombre, ip, probable: p === mejor && p > 0 }));
}

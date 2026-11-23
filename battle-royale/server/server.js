// Toon Royale — serveur relais : sert le jeu (fichiers statiques) et relaie les messages des salons privés.
// Le joueur qui crée le salon (« hôte ») fait tourner la partie ; le serveur ne fait que transmettre.
'use strict';
const http = require('http'), fs = require('fs'), path = require('path');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 8080;
const ROOT = path.resolve(__dirname, '..');
const MAX_PLAYERS = 10;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png' };

const server = http.createServer((req, res) => {
  let p = decodeURIComponent((req.url || '/').split('?')[0]); if (p === '/') p = '/index.html';
  const file = path.join(ROOT, path.normalize(p));
  if (!file.startsWith(ROOT) || file.includes(`${path.sep}server${path.sep}`) || file.includes(`${path.sep}app${path.sep}`)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Introuvable'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' }); res.end(data);
  });
});

const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 2 * 1024 * 1024 });
const rooms = new Map(); let nextId = 1;
const code = () => { const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; let c; do { c = Array.from({ length: 4 }, () => A[Math.floor(Math.random() * A.length)]).join(''); } while (rooms.has(c)); return c; };
const send = (ws, o) => { if (ws.readyState === 1) ws.send(typeof o === 'string' ? o : JSON.stringify(o)); };
const roster = room => ({ t: 'room', code: room.code, started: room.started, members: [...room.members.values()].map(m => ({ id: m.id, name: m.name, host: m.id === room.hostId })) });
const broadcastRoster = room => { const r = roster(room); for (const m of room.members.values()) send(m.ws, Object.assign({ me: m.id }, r)); };

wss.on('connection', ws => {
  const me = { id: nextId++, ws, name: 'Joueur', room: null };
  ws.on('message', raw => {
    let m; try { m = JSON.parse(raw); } catch (e) { return; }
    const room = me.room;
    switch (m.t) {
      case 'create': {
        if (room) return; me.name = String(m.name || 'Joueur').slice(0, 14);
        const r = { code: code(), hostId: me.id, members: new Map([[me.id, me]]), started: false }; rooms.set(r.code, r); me.room = r; broadcastRoster(r); break;
      }
      case 'join': {
        if (room) return; const r = rooms.get(String(m.code || '').toUpperCase());
        if (!r) return send(ws, { t: 'error', msg: 'Salon introuvable' });
        if (r.started) return send(ws, { t: 'error', msg: 'La partie a déjà commencé' });
        if (r.members.size >= MAX_PLAYERS) return send(ws, { t: 'error', msg: 'Salon complet' });
        me.name = String(m.name || 'Joueur').slice(0, 14); r.members.set(me.id, me); me.room = r; broadcastRoster(r); break;
      }
      case 'leave': leave(); break;
      default: {
        if (!room) return;
        if (me.id === room.hostId) {
          if (m.t === 'start') room.started = true;
          if (m.t === 'lobby') { room.started = false; broadcastRoster(room); }
          // hôte → un client précis (to) ou tout le monde
          const out = JSON.stringify(m);
          if (m.to) { const dst = room.members.get(m.to); if (dst) send(dst.ws, out); }
          else for (const x of room.members.values()) if (x.id !== me.id) send(x.ws, out);
        } else {
          // client → hôte, avec l'identité de l'expéditeur
          m.from = me.id; const host = room.members.get(room.hostId); if (host) send(host.ws, m);
        }
      }
    }
  });
  const leave = () => {
    const r = me.room; if (!r) return; me.room = null; r.members.delete(me.id);
    if (me.id === r.hostId || r.members.size === 0) { for (const x of r.members.values()) { send(x.ws, { t: 'closed' }); x.room = null; } rooms.delete(r.code); }
    else { broadcastRoster(r); const host = r.members.get(r.hostId); if (host) send(host.ws, { t: 'left', id: me.id }); }
  };
  ws.on('close', leave); ws.on('error', leave);
});

server.listen(PORT, () => console.log(`Toon Royale : http://localhost:${PORT}  (multijoueur sur ws://…/ws)`));

// Toon Royale — service worker : jouer hors ligne après la première visite
const CACHE = 'toonroyale-v3';
const FILES = ['./', 'index.html', 'style.css', 'manifest.webmanifest', 'icon.svg', 'icons/icon-192.png', 'icons/icon-512.png',
  'js/util.js', 'js/data.js', 'js/render.js', 'js/post.js', 'js/world.js', 'js/fighter.js', 'js/bot.js', 'js/effects.js', 'js/gags.js', 'js/events.js', 'js/modes.js', 'js/meta.js',
  'js/input.js', 'js/hud.js', 'js/feel.js', 'js/game.js', 'js/ui.js', 'js/main.js',
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => Promise.all(FILES.map(f => c.add(f).catch(() => null)))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
// réseau d'abord (mises à jour), cache en secours (hors ligne)
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(r => { if (r && r.ok && (r.type === 'basic' || r.type === 'cors')) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); } return r; }).catch(() => caches.match(e.request).then(m => m || caches.match('index.html'))));
});

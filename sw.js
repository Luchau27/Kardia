/* Kardia – service worker. Changer VERSION à chaque mise à jour pour que les téléphones récupèrent les nouveaux fichiers. */
const VERSION = 'kardia-1.6.0';
const SHELL = [
  './', 'index.html', 'manifest.webmanifest', 'style.css',
  'config.js', 'store.js', 'dates.js', 'rules.js', 'ui.js', 'avatar.js',
  'checkin.js', 'echeance.js', 'cards.js', 'collection.js', 'trade.js', 'quiz.js', 'missions.js', 'shop.js', 'firebase-config.js', 'duo.js', 'bonus.js', 'rank.js', 'assistant.js', 'visuels.js',
  'chakra-petch-latin-500-normal.woff2', 'chakra-petch-latin-600-normal.woff2', 'chakra-petch-latin-700-normal.woff2',
  'barlow-latin-500-normal.woff2', 'barlow-latin-600-normal.woff2', 'barlow-latin-700-normal.woff2', 'barlow-latin-800-normal.woff2',
  'instrument-serif-latin-400-normal.woff2', 'instrument-serif-latin-400-italic.woff2', 'ibm-plex-mono-latin-400-normal.woff2', 'ibm-plex-mono-latin-500-normal.woff2', 'world.js', 'settings.js', 'onboarding.js', 'app.js',
  'icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'favicon.svg'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  if (!sameOrigin) return;
  // Réseau d'abord (pour recevoir les mises à jour), cache en secours (hors-ligne).
  e.respondWith(
    fetch(req, { cache: 'no-cache' }).then(res => {
      if (res && (res.ok || res.type === 'opaque')) {
        const copy = res.clone();
        caches.open(VERSION).then(c => c.put(req, copy));
      }
      return res;
    }).catch(() => caches.match(req).then(r => r || (req.mode === 'navigate' ? caches.match('index.html') : undefined)))
  );
});

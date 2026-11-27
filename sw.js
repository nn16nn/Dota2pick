/* Dota 2 Pick — service worker (автожаңарту) */
const V = '7.1';
const C = 'd2pick-' + V;
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './skills.json'];

self.addEventListener('install', e => {
  // жаңа нұсқа бірден кезекке тұрады, бетке хабар келгенде іске қосылады
  e.waitUntil(caches.open(C).then(c => c.addAll(SHELL).catch(() => {})));
});

self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== C && k !== 'd2pick-assets').map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url);
  // герой/зат суреттері мен шрифттер — бір рет жүктеп, телефонда сақтаймыз (cache-first) → қосымша лезде ашылады
  if (/steamstatic\.com$|fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)) {
    e.respondWith(caches.open('d2pick-assets').then(c => c.match(e.request).then(hit => hit || fetch(e.request).then(r => {
      if (r && (r.ok || r.type === 'opaque')) c.put(e.request, r.clone()).catch(() => {});
      return r;
    }).catch(() => hit))));
    return;
  }
  if (u.origin !== location.origin) return;          // API — браузердің өзіне
  if (!u.protocol.startsWith('http')) return;

  // әрқашан алдымен желі: жаңа патч шықса, бірден жаңасы келеді
  e.respondWith(
    fetch(e.request, { cache: 'no-store' })
      .then(r => {
        if (r && r.status === 200) {
          const cp = r.clone();
          caches.open(C).then(c => c.put(e.request, cp)).catch(() => {});
        }
        return r;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});

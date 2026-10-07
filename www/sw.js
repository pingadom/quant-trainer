// Offline support. Network-first so updates show up immediately when online;
// falls back to the cached copy when offline. Bump VERSION when the file list changes.
const VERSION = 'qt-0.20.0'; // keep in step with QT.VERSION in js/core.js
const ASSETS = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/style.css',
  'js/theme.js',
  'js/config.js',
  'js/core.js',
  'js/platform.js',
  'js/gens-interview.js',
  'js/gens-foundations.js',
  'js/gens-extra.js',
  'js/topics.js',
  'js/cases.js',
  'js/bank.js',
  'js/keypad.js',
  'js/review.js',
  'js/coach.js',
  'js/estimate.js',
  'js/mental-tips.js',
  'js/mental.js',
  'js/market.js',
  'js/lab.js',
  'js/chart.js',
  'js/quote.js',
  'js/kelly.js',
  'js/figgie.js',
  'js/daily.js',
  'js/oa.js',
  'js/talk.js',
  'js/demo.js',
  'js/ui.js',
  'js/flair.js',
  'js/views/home.js',
  'js/views/practice.js',
  'js/views/coach.js',
  'js/views/bank.js',
  'js/views/cases.js',
  'js/views/more.js',
  'js/views/roadmap.js',
  'js/views/progress.js',
  'js/views/appearance.js',
  'js/views/tour.js',
  'js/views/search.js',
  'js/views/plan.js',
  'js/tricks.js',
  'js/flashcards.js',
  'js/app.js',
  'privacy.html',
  'fonts/plex-sans.woff2',
  'fonts/plex-mono-400.woff2',
  'fonts/plex-mono-600.woff2',
  'fonts/newsreader.woff2',
  'fonts/newsreader-italic.woff2',
  'fonts/kalam-400.woff2',
  'fonts/kalam-700.woff2',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/maskable-512.png',
  'icons/apple-touch-icon.png',
  'icons/favicon-32.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    // 'no-cache' revalidates with the server (cheap 304s), so a fresh deploy never mixes
    // old and new files from the browser's HTTP cache.
    fetch(req, { cache: 'no-cache' })
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match('index.html')))
  );
});

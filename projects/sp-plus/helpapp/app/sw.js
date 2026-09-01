/* Offline cache for SP+ Help.
 *
 * The moment an advisor most needs the manual is the moment the network is
 * broken, so the whole app and the corpus are cached on first run and served
 * from cache when a fetch fails. Asking Fin is deliberately never cached: a
 * stale answer to a live question is worse than an honest failure.
 */
var CACHE = 'spplus-help-v1';
var SHELL = ['/', '/index.html', '/app.js', '/styles.css', '/help-core.js',
             '/help-data.json', '/manifest.webmanifest', '/icon.svg'];

self.addEventListener('install', function (event) {
  event.waitUntil(caches.open(CACHE).then(function (cache) {
    return cache.addAll(SHELL);
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (event) {
  event.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; })
      .map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (event) {
  var request = event.request;
  if (request.method !== 'GET') return;
  if (request.url.indexOf('/api/') !== -1) return;
  // Network first, so a rebuilt manual is picked up, falling back to the
  // cached copy when there is nothing to reach.
  event.respondWith(
    fetch(request).then(function (response) {
      if (response && response.ok) {
        var copy = response.clone();
        caches.open(CACHE).then(function (c) { c.put(request, copy); });
      }
      return response;
    }).catch(function () {
      return caches.match(request).then(function (hit) {
        return hit || caches.match('/index.html');
      });
    })
  );
});

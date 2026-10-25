/* Escudo Infinity Guard - funciona sem internet depois da primeira visita. */
var CACHE = 'escudo-celular-1.1.0';
var ARQUIVOS = ['./', './index.html', './app.js', './golpe.js', './checagens.js', './manifest.webmanifest',
  './icones/icone-192.png', './icones/icone-512.png', './icones/apple-touch-icon.png'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ARQUIVOS); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (nomes) {
    return Promise.all(nomes.filter(function (n) { return n !== CACHE; }).map(function (n) { return caches.delete(n); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) { return; }
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(function (r) { return r || fetch(e.request); }));
});

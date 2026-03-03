// TailorMeSwiftly Service Worker — PWA Offline Support
var CACHE_NAME = 'tms-cache-v14';
var STATIC_ASSETS = [
    '/', '/index.html',
    '/style.css', '/templates.css',
    '/auth.js', '/components.js', '/error-utils.js', '/brand-config.js',
    '/favicon.svg', '/manifest.json'
];

self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys().then(function (names) {
            return Promise.all(
                names.filter(function (n) { return n !== CACHE_NAME; })
                    .map(function (n) { return caches.delete(n); })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', function (event) {
    var url = new URL(event.request.url);
    // Network-first for HTML pages
    if (event.request.mode === 'navigate' || (event.request.headers.get('accept') && event.request.headers.get('accept').indexOf('text/html') !== -1)) {
        event.respondWith(
            fetch(event.request).then(function (response) {
                var clone = response.clone();
                caches.open(CACHE_NAME).then(function (cache) { cache.put(event.request, clone); });
                return response;
            }).catch(function () {
                return caches.match(event.request).then(function (cached) {
                    return cached || caches.match('/index.html');
                });
            })
        );
        return;
    }
    // Cache-first for static assets
    event.respondWith(
        caches.match(event.request).then(function (cached) {
            if (cached) return cached;
            return fetch(event.request).then(function (response) {
                if (response.ok && url.origin === self.location.origin) {
                    var clone = response.clone();
                    caches.open(CACHE_NAME).then(function (cache) { cache.put(event.request, clone); });
                }
                return response;
            });
        })
    );
});

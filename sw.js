/**
 * Service Worker for TailorMeSwiftly PWA
 *
 * - Caches static assets on install (cache-first strategy)
 * - Caches HTML pages on first visit (network-first strategy)
 * - Shows offline fallback when no network (serve cached pages)
 * - Cleans up old caches on activate
 */

const CACHE_NAME = 'tms-cache-v1';

const STATIC_ASSETS = [
    '/style.css',
    '/auth.js',
    '/app.js',
    '/results.js',
    '/components.js',
    '/brand-config.js',
    '/shared/billing.js',
    '/shared/brand-config.js',
    '/shared/analytics.js',
    '/shared/sticky-header.js',
    '/shared/confetti.js',
    '/shared/onboarding.js',
    '/shared/command-palette.js',
    '/shared/streaks.js',
    '/shared/tone-selector.js',
    '/shared/notifications.js',
    '/shared/progressive-profiling.js'
];

// Install: pre-cache static assets, skip waiting immediately
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Activate: delete old caches, claim clients immediately
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name.startsWith('tms-cache-') && name !== CACHE_NAME)
                        .map((name) => caches.delete(name))
                );
            })
            .then(() => self.clients.claim())
    );
});

// Fetch: cache-first for static assets, network-first for HTML
self.addEventListener('fetch', (event) => {
    const { request } = event;

    // Only handle GET requests
    if (request.method !== 'GET') return;

    // Skip cross-origin requests (CDN scripts, Supabase, ads, etc.)
    if (!request.url.startsWith(self.location.origin)) return;

    const url = new URL(request.url);
    const isHTML = request.headers.get('accept')?.includes('text/html') ||
                   url.pathname.endsWith('.html') ||
                   url.pathname === '/' ||
                   (!url.pathname.includes('.'));

    if (isHTML) {
        // Network-first for HTML pages
        event.respondWith(networkFirstHTML(request));
    } else {
        // Cache-first for static assets (JS, CSS, images)
        event.respondWith(cacheFirstAsset(request));
    }
});

/**
 * Network-first strategy for HTML pages.
 * Tries the network, caches successful responses, falls back to cache.
 * If both fail, returns a minimal offline page.
 */
async function networkFirstHTML(request) {
    const cache = await caches.open(CACHE_NAME);

    try {
        const networkResponse = await fetch(request);

        // Cache a clone of successful responses
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (err) {
        // Network failed, try cache
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        // Nothing cached either -- return an offline fallback page
        return new Response(offlinePage(), {
            status: 503,
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
    }
}

/**
 * Cache-first strategy for static assets.
 * Serves from cache if available, otherwise fetches and caches.
 */
async function cacheFirstAsset(request) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }

    try {
        const cache = await caches.open(CACHE_NAME);
        const networkResponse = await fetch(request);

        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (err) {
        // For non-HTML assets there is no meaningful fallback
        return new Response('', { status: 408, statusText: 'Offline' });
    }
}

/**
 * Minimal offline fallback page styled to match TMS dark theme.
 */
function offlinePage() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Offline | TailorMeSwiftly</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            background: #151821;
            color: rgba(255,255,255,0.9);
            font-family: 'Space Grotesk', -apple-system, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            text-align: center;
            padding: 2rem;
        }
        .offline-box {
            background: #1E222D;
            border: 1px dashed rgba(255,255,255,0.25);
            border-radius: 4px;
            box-shadow: 2px 2px 0 rgba(0,0,0,0.5);
            padding: 3rem 2rem;
            max-width: 420px;
        }
        .offline-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
            opacity: 0.6;
        }
        h1 {
            font-size: 1.4rem;
            margin-bottom: 0.75rem;
            color: #A3C4DC;
        }
        p {
            font-size: 0.9rem;
            color: rgba(255,255,255,0.5);
            line-height: 1.6;
            margin-bottom: 1.5rem;
        }
        button {
            background: rgba(255,255,255,0.9);
            color: #151821;
            border: 1px dashed rgba(255,255,255,0.25);
            border-radius: 4px;
            box-shadow: 2px 2px 0 rgba(0,0,0,0.5);
            padding: 0.75rem 1.5rem;
            font-family: inherit;
            font-size: 0.9rem;
            font-weight: 600;
            cursor: pointer;
        }
        button:hover { transform: translate(-2px,-2px); box-shadow: 4px 4px 0 rgba(0,0,0,0.6); }
    </style>
</head>
<body>
    <div class="offline-box">
        <div class="offline-icon">&#9986;</div>
        <h1>You're Offline</h1>
        <p>It looks like you've lost your internet connection. Any previously visited pages are still available from cache.</p>
        <button onclick="window.location.reload()">Try Again</button>
    </div>
</body>
</html>`;
}

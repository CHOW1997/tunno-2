/// <reference lib="webworker" />

import { build, files, version } from '$service-worker';

const worker = self as unknown as ServiceWorkerGlobalScope;
const ASSETS = `cache${version}`;
const PAGES = `pages${version}`;

// Add necessary static assets
const REQUIRED_FILES = [
    '/',
    '/index.html',
    '/manifest.json',
    '/favicon.png',
    '/apple-touch-icon.png',
    '/pwa-192x192.png',
    '/pwa-512x512.png'
];

const ASSETS_TO_CACHE = [...build, ...files, ...REQUIRED_FILES];

// Pre-cache static assets
worker.addEventListener('install', (event) => {
    event.waitUntil(
        caches
            .open(ASSETS)
            .then((cache) => cache.addAll(ASSETS_TO_CACHE))
            .then(() => worker.skipWaiting())
    );
});

// Clean up old caches
worker.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            caches.keys().then(async (keys) => {
                for (const key of keys) {
                    if (key !== ASSETS && key !== PAGES) {
                        await caches.delete(key);
                    }
                }
            }),
            worker.clients.claim()
        ])
    );
});

// Handle requests
worker.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);
    
    // Ignore non-same-origin requests
    if (url.origin !== self.location.origin) return;

    // Network-first strategy for navigation requests
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .catch(() => {
                    return caches.match(event.request)
                        .then((response) => {
                            if (response) return response;
                            return caches.match('/')
                                .then((response) => response || new Response('Offline Mode', {
                                    status: 503,
                                    statusText: 'Service Unavailable',
                                    headers: new Headers({
                                        'Content-Type': 'text/plain;charset=UTF-8'
                                    })
                                }));
                        });
                })
        );
        return;
    }

    // Cache-first strategy for static assets
    if (ASSETS_TO_CACHE.includes(url.pathname)) {
        event.respondWith(
            caches.match(event.request)
                .then((response) => {
                    if (response) return response;
                    
                    return fetch(event.request).then((response) => {
                        if (!response || response.status !== 200) {
                            return response;
                        }
                        
                        const responseToCache = response.clone();
                        caches.open(ASSETS).then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                        
                        return response;
                    });
                })
        );
    }
});
// Add manifest and icons to the files to cache
const FILES_TO_CACHE = [
    '/manifest.json',
    '/pwa-192x192.png',
    '/pwa-512x512.png',
    '/favicon.png',
    '/apple-touch-icon.png',
    '/index.html',
    '/'
];

// In your install event handler, use try-catch
self.addEventListener('install', (event) => {
    event.waitUntil(
        (async () => {
            try {
                const cache = await caches.open('app-cache-v1');
                await cache.addAll(FILES_TO_CACHE);
            } catch (error) {
                console.error('Failed to cache resources:', error);
            }
        })()
    );
});
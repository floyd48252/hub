// Service Worker for Chrome PWA support
const CACHE_NAME = 'cleaning-solutions-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/Untitled-7.html',
    '/login.html',
    '/forgot-password.html',
    '/register.html',
    '/admin-login.html',
    '/admin-forgot-password.html',
    '/customer-dashboard.html',
    '/admin-dashboard.html',
    '/auth.js',
    '/styles.css',
    '/logo.jpeg',
    '/manifest.json'
];

self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then(function(cache) {
            return cache.addAll(urlsToCache);
        })
    );
});

self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request)
        .then(function(response) {
            if (response) {
                return response;
            }
            return fetch(event.request);
        })
    );
});

self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
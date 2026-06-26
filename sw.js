// ============================================================
// sw.js — Service Worker بۆ کارکردنی ئۆفلاین
// ============================================================

const CACHE_NAME = 'bizhar-v1';
const urlsToCache = [
    './',
    './index.html',
    'https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;600;800;900&family=Poppins:wght@400;600;800;900&family=Orbitron:wght@500;900&family=Fira+Code:wght@400;700',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
    'https://unpkg.com/qr-code-styling@1.5.0/lib/qr-code-styling.js',
    'https://i.postimg.cc/prWJfmG5/06FF3E40-CE7A-42E3-BF00-A58BC5381AE2.png',
    'https://i.postimg.cc/MpC0sPPN/C7E5B155-3D24-4144-B6AF-FCB4EFD4B310.png',
    'https://i.postimg.cc/K8q6XS8b/IMG-1469.jpg',
    'https://i.postimg.cc/zDTYyc0g/IMG-4582.jpg',
    'https://i.postimg.cc/MpNLqhYY/IMG-6220.jpg'
];

// نصب کردن — کاشکردنی فایلەکان
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(urlsToCache);
            })
            .then(() => self.skipWaiting())
    );
});

// چالاک کردن — پاککردنی کاشە کۆنەکان
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// داواکاری — گەڕانەوە لە کاش یان تۆڕ
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                return fetch(event.request).then(
                    response => {
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                        return response;
                    }
                );
            })
    );
});
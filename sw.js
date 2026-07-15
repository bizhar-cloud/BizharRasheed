// ============================================================
// sw.js — Service Worker بۆ کارکردنی ئۆفلاین (Bizhar Rasheed)
// ============================================================

const CACHE_NAME = 'bizhar-v1';
const urlsToCache = [
    './',
    './index.html',
    'https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;600;800;900&family=Poppins:wght@400;600;800;900&family=Orbitron:wght@500;900&family=Fira+Code:wght@400;700&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
    'https://unpkg.com/qr-code-styling@1.5.0/lib/qr-code-styling.js',
    'https://i.postimg.cc/prWJfmG5/06FF3E40-CE7A-42E3-BF00-A58BC5381AE2.png',
    'https://i.postimg.cc/MpC0sPPN/C7E5B155-3D24-4144-B6AF-FCB4EFD4B310.png',
    'https://i.postimg.cc/K8q6XS8b/IMG-1469.jpg',
    'https://i.postimg.cc/zDTYyc0g/IMG-4582.jpg',
    'https://i.postimg.cc/MpNLqhYY/IMG-6220.jpg',
    'https://i.postimg.cc/yx8K2rPb/8072E266-E454-4FD7-B4A4-32A46E5378BF.jpg'
];

// ============================================================
// نصب کردن — کاشکردنی فایلەکان
// ============================================================
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('✅ کاشکردنی فایلەکان دەستی پێکرد...');
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                console.log('✅ هەموو فایلەکان بە سەرکەوتوویی کاش کران');
                return self.skipWaiting();
            })
            .catch(err => {
                console.error('⚠️ هەڵە لە کاشکردنی فایلەکان:', err);
            })
    );
});

// ============================================================
// چالاک کردن — پاککردنی کاشە کۆنەکان
// ============================================================
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ کاشە کۆنەکان دەسڕێنەوە:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('✅ Service Worker چالاک بوو، کاشە کۆنەکان پاک کران');
            return self.clients.claim();
        })
    );
});

// ============================================================
// داواکاری — گەڕانەوە لە کاش یان تۆڕ (Network First بۆ HTML)
// ============================================================
self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);

    // بۆ پەڕگەکانی HTML — ستراتیژی Network First
    if (request.mode === 'navigate' || request.destination === 'document') {
        event.respondWith(
            fetch(request)
                .then(response => {
                    // گەڕانەوە لە تۆڕ و نوێکردنی کاش
                    if (response && response.status === 200) {
                        const clonedResponse = response.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(request, clonedResponse);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    // گەڕانەوە لە کاش ئەگەر تۆڕ شکست بخوات
                    return caches.match(request)
                        .then(cachedResponse => {
                            if (cachedResponse) {
                                return cachedResponse;
                            }
                            // ئەگەر هیچ کاشێک نەبوو، پەڕگەیێکی دیفۆڵت
                            return caches.match('./index.html');
                        });
                })
        );
        return;
    }

    // بۆ هەموو داواکارییەکانی تر — Cache First
    event.respondWith(
        caches.match(request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                // ئەگەر لە کاش نەبوو، لە تۆڕ بگەڕێ
                return fetch(request).then(response => {
                    // تەنها داواکارییە سەرکەوتووەکان کاش بکە
                    if (response && response.status === 200) {
                        const clonedResponse = response.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(request, clonedResponse);
                        });
                    }
                    return response;
                }).catch(() => {
                    // ئەگەر تۆڕ و کاش هەردوو شکست بخوین
                    if (request.destination === 'image') {
                        return new Response('⚠️ وێنە بارنەبوو', {
                            status: 404,
                            statusText: 'Not Found',
                            headers: { 'Content-Type': 'text/plain' }
                        });
                    }
                    return new Response('⚠️ ئۆفلاین — پەڕگە دەستنەکەوێت', {
                        status: 503,
                        statusText: 'Service Unavailable',
                        headers: { 'Content-Type': 'text/plain' }
                    });
                });
            })
    );
});

// ============================================================
// پەیام — بۆ نۆژەنکردنەوەی کاش لەلایەن کلاینتەوە
// ============================================================
self.addEventListener('message', event => {
    if (event.data && event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
    if (event.data && event.data.action === 'clearCache') {
        caches.delete(CACHE_NAME).then(() => {
            console.log('🗑️ کاش بە دەست پاک کرایەوە');
            event.ports[0].postMessage({ status: 'cleared' });
        });
    }
});

console.log('🚀 Service Worker (Bizhar) بارکرا!');
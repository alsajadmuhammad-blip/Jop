const CACHE_NAME = 'markazi-v1';

// الملفات الأساسية التي تُخزَّن فوراً عند التثبيت
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
];

// ===== التثبيت: خزّن الملفات الأساسية =====
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// ===== التفعيل: احذف الكاشات القديمة =====
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ===== الطلبات =====
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // تجاهل الطلبات غير HTTP وطلبات المصادقة
  if (!request.url.startsWith('http')) return;
  if (url.pathname.startsWith('/api/')) return;

  // الملفات الثابتة (_next/static): Cache First — سريع جداً
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // الصور: Cache First مع شبكة احتياطية
  if (request.destination === 'image') {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request)
          .then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          })
          .catch(() => cached || new Response('', { status: 404 }));
      })
    );
    return;
  }

  // الصفحات HTML: Network First — دائماً أحدث نسخة، والكاش احتياطي عند انقطاع الشبكة
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() =>
          caches.match(request).then(
            (cached) => cached || caches.match('/')
          )
        )
    );
    return;
  }

  // بقية الطلبات: Network First
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

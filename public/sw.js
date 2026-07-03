const CACHE_NAME = 'markazi-v2';
const OFFLINE_URL = '/offline.html';

const PRECACHE_URLS = ['/', '/offline.html', '/manifest.json'];

// ===== التثبيت =====
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// ===== التفعيل =====
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ===== استراتيجية الكاش =====
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (!request.url.startsWith('http')) return;
  if (url.pathname.startsWith('/api/')) return;

  // ملفات ثابتة: Cache First
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((res) => {
          if (res.ok) caches.open(CACHE_NAME).then((c) => c.put(request, res.clone()));
          return res;
        });
      })
    );
    return;
  }

  // صور: Cache First
  if (request.destination === 'image') {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request)
          .then((res) => {
            if (res.ok) caches.open(CACHE_NAME).then((c) => c.put(request, res.clone()));
            return res;
          })
          .catch(() => cached || new Response('', { status: 404 }));
      })
    );
    return;
  }

  // صفحات HTML: Network First مع fallback للـ offline
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) caches.open(CACHE_NAME).then((c) => c.put(request, res.clone()));
          return res;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match(OFFLINE_URL))
        )
    );
    return;
  }

  // باقي الطلبات
  event.respondWith(fetch(request).catch(() => caches.match(request)));
});

// ===== الإشعارات Push =====
self.addEventListener('push', (event) => {
  let data = { title: 'مركزي', body: 'لديك إشعار جديد', url: '/', icon: '/icon-192.png', badge: '/icon-192.png' };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    data: { url: data.url || '/' },
    dir: 'rtl',
    lang: 'ar',
    vibrate: [100, 50, 100],
    actions: data.actions || [],
    tag: data.tag || 'markazi-notification',
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// ===== النقر على الإشعار =====
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

// ===== إغلاق الإشعار =====
self.addEventListener('notificationclose', () => {
  // يمكن تتبع الإغلاق هنا لأغراض التحليل
});

// ===== Background Sync: إعادة إرسال الطلبات الفاشلة =====
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pending-orders') {
    event.waitUntil(syncPendingOrders());
  }
  if (event.tag === 'sync-cart') {
    event.waitUntil(syncCart());
  }
});

async function syncPendingOrders() {
  try {
    const db = await openDB();
    const items = await getAllPendingOrders(db);
    for (const item of items) {
      try {
        const res = await fetch(item.url, {
          method: item.method || 'POST',
          body: item.body,
          headers: item.headers || { 'Content-Type': 'application/json' },
        });
        if (res.ok) {
          await deletePendingOrder(db, item.id);
        }
      } catch { /* سيُعاد المحاولة في الـ sync التالية */ }
    }
  } catch { /* IndexedDB غير متاح */ }
}

async function syncCart() {
  // إعادة إرسال تعديلات سلة التسوق المؤجلة
  try {
    const db = await openDB();
    const items = await getAllPendingOrders(db);
    const cartItems = items.filter((i) => i.type === 'cart');
    for (const item of cartItems) {
      try {
        const res = await fetch(item.url, {
          method: item.method || 'POST',
          body: item.body,
          headers: item.headers || { 'Content-Type': 'application/json' },
        });
        if (res.ok) await deletePendingOrder(db, item.id);
      } catch { /* سيُعاد المحاولة لاحقاً */ }
    }
  } catch { /* IndexedDB غير متاح */ }
}

// ===== Periodic Sync: تحديث البيانات بشكل دوري =====
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'refresh-stores') {
    event.waitUntil(refreshStoresCache());
  }
  if (event.tag === 'check-notifications') {
    event.waitUntil(checkForNewNotifications());
  }
});

async function refreshStoresCache() {
  try {
    const response = await fetch('/stores');
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put('/stores', response);
    }
  } catch { /* شبكة غير متاحة */ }
}

// ===== Message: تحديث SW بطلب من الواجهة =====
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data?.type === 'CACHE_URLS') {
    caches.open(CACHE_NAME).then((cache) => cache.addAll(event.data.urls));
  }
});

// ===== مساعدات IndexedDB =====
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('markazi-sw-db', 1);
    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore('pending-orders', { keyPath: 'id', autoIncrement: true });
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = reject;
  });
}

function getAllPendingOrders(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pending-orders', 'readonly');
    const req = tx.objectStore('pending-orders').getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = reject;
  });
}

function deletePendingOrder(db, id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pending-orders', 'readwrite');
    tx.objectStore('pending-orders').delete(id);
    tx.oncomplete = resolve;
    tx.onerror = reject;
  });
}

async function checkForNewNotifications() {
  // يُستخدم في Periodic Sync — يمكن استدعاء Supabase هنا لفحص الإشعارات الجديدة
  try {
    const clientList = await self.clients.matchAll({ type: 'window' });
    // إرسال رسالة للصفحة المفتوحة لتحدّث الإشعارات
    for (const client of clientList) {
      client.postMessage({ type: 'CHECK_NOTIFICATIONS' });
    }
  } catch { /* نتجاهل */ }
}

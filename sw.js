/* Sev Digital — Service Worker: تشغيل التطبيق بدون إنترنت */

const CACHE_NAME = "sev-digital-v1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./products.html",
  "./product.html",
  "./cart.html",
  "./checkout.html",
  "./success.html",
  "./about.html",
  "./contact.html",
  "./terms.html",
  "./privacy.html",
  "./css/style.css",
  "./js/data.js",
  "./js/app.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // لا نسترجع طلبات الموارد الخارجية (خطوط، وغيرها) من الكاش
  if (url.origin !== location.origin) {
    event.respondWith(
      fetch(request).catch(() => caches.match(request).then((r) => r || caches.match("./index.html")))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match("./index.html"));
    })
  );
});
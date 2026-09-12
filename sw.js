/* Sev Digital — Service Worker: تشغيل التطبيق بدون إنترنت */

const CACHE_NAME = "sev-digital-v12";
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
  "./images/morocco-chefchaouen.jpg",
  "./images/morocco-casablanca.jpg",
  "./images/morocco-sahara.jpg",
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

  // الموارد الخارجية (خطوط وغيرها): شبكة أولاً ثم كاش
  if (url.origin !== location.origin) {
    event.respondWith(
      fetch(request).catch(() => caches.match(request).then((r) => r || caches.match("./index.html")))
    );
    return;
  }

  // الشبكة أولاً ثم الكاش: ضمان وصول آخر التحديثات دائماً، وتشغيل دون اتصال عند فشل الشبكة
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && (response.ok || response.type === "opaque")) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request).then((r) => r || caches.match("./index.html")))
  );
});
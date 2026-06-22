const CACHE_NAME = "listening-training-pwa-v14";
const AUDIO_CACHE_NAME = "listening-training-audio-v1";
const PERSISTENT_CACHES = new Set([CACHE_NAME, AUDIO_CACHE_NAME]);
const APP_SHELL = [
  "./",
  "./index.html",
  "./index.html?v=14",
  "./styles.css?v=14",
  "./training-core.js?v=14",
  "./voice-core.js?v=14",
  "./app.js?v=14",
  "./data/scenarios.json",
  "./manifest.webmanifest",
  "./icons/icon.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => !PERSISTENT_CACHES.has(key)).map((key) => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
      if (response.ok && new URL(event.request.url).origin === self.location.origin) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
      }
      return response;
    }).catch(() => caches.match("./index.html")))
  );
});

const CACHE_NAME = "listening-training-pwa-v18";
const AUDIO_CACHE_NAME = "listening-training-audio-v2";
const PERSISTENT_CACHES = new Set([CACHE_NAME, AUDIO_CACHE_NAME]);
const LOCAL_AUDIO_ASSETS = [
  "./audio/scenarios/lin_xiao/baseline-brief-1.mp3",
  "./audio/scenarios/lin_xiao/baseline-progress-2.mp3",
  "./audio/scenarios/lin_xiao/baseline-problem-3.mp3",
  "./audio/scenarios/lin_xiao/baseline-meeting-4.mp3",
  "./audio/scenarios/lin_xiao/task-handoff-1.mp3",
  "./audio/scenarios/lin_xiao/feedback-1.mp3",
  "./audio/scenarios/lin_xiao/progress-1.mp3",
  "./audio/scenarios/lin_xiao/meeting-1.mp3",
  "./audio/scenarios/lin_xiao/problem-2.mp3",
  "./audio/scenarios/lin_xiao/task-handoff-3.mp3",
  "./audio/scenarios/lin_xiao/meeting-3.mp3",
  "./audio/scenarios/lin_xiao/feedback-3.mp3",
  "./audio/scenarios/lin_xiao/chunk-brief-2.mp3",
  "./audio/scenarios/lin_xiao/speed-update-2.mp3",
  "./audio/scenarios/lin_xiao/response-risk-2.mp3",
  "./audio/scenarios/lin_xiao/response-change-3.mp3",
  "./audio/scenarios/chen_yu/baseline-brief-1.mp3",
  "./audio/scenarios/chen_yu/baseline-progress-2.mp3",
  "./audio/scenarios/chen_yu/baseline-problem-3.mp3",
  "./audio/scenarios/chen_yu/baseline-meeting-4.mp3",
  "./audio/scenarios/chen_yu/task-handoff-1.mp3",
  "./audio/scenarios/chen_yu/feedback-1.mp3",
  "./audio/scenarios/chen_yu/progress-1.mp3",
  "./audio/scenarios/chen_yu/meeting-1.mp3",
  "./audio/scenarios/chen_yu/problem-2.mp3",
  "./audio/scenarios/chen_yu/task-handoff-3.mp3",
  "./audio/scenarios/chen_yu/meeting-3.mp3",
  "./audio/scenarios/chen_yu/feedback-3.mp3",
  "./audio/scenarios/chen_yu/chunk-brief-2.mp3",
  "./audio/scenarios/chen_yu/speed-update-2.mp3",
  "./audio/scenarios/chen_yu/response-risk-2.mp3",
  "./audio/scenarios/chen_yu/response-change-3.mp3",
  "./audio/scenarios/su_ning/baseline-brief-1.mp3",
  "./audio/scenarios/su_ning/baseline-progress-2.mp3",
  "./audio/scenarios/su_ning/baseline-problem-3.mp3",
  "./audio/scenarios/su_ning/baseline-meeting-4.mp3",
  "./audio/scenarios/su_ning/task-handoff-1.mp3",
  "./audio/scenarios/su_ning/feedback-1.mp3",
  "./audio/scenarios/su_ning/progress-1.mp3",
  "./audio/scenarios/su_ning/meeting-1.mp3",
  "./audio/scenarios/su_ning/problem-2.mp3",
  "./audio/scenarios/su_ning/task-handoff-3.mp3",
  "./audio/scenarios/su_ning/meeting-3.mp3",
  "./audio/scenarios/su_ning/feedback-3.mp3",
  "./audio/scenarios/su_ning/chunk-brief-2.mp3",
  "./audio/scenarios/su_ning/speed-update-2.mp3",
  "./audio/scenarios/su_ning/response-risk-2.mp3",
  "./audio/scenarios/su_ning/response-change-3.mp3"
];
const APP_SHELL = [
  "./",
  "./index.html",
  "./index.html?v=18",
  "./styles.css?v=18",
  "./training-core.js?v=18",
  "./voice-core.js?v=18",
  "./app.js?v=18",
  "./data/scenarios.json",
  "./data/voices.json",
  "./data/audio-manifest.json",
  "./manifest.webmanifest?v=18",
  "./icons/icon.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
  ...LOCAL_AUDIO_ASSETS
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

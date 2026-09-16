const CACHE_NAME = "twis-holo-workshop-v7-loopforge";
const APP_SHELL = [
  "./",
  "./index.html",
  "./loop-deck.html",
  "./loop-deck.webmanifest",
  "./manifest.webmanifest",
  "./assets/style.css",
  "./assets/app.js",
  "./assets/twis-loop-deck.css",
  "./assets/twis-loop-deck-v2.js",
  "./assets/twis-loop-deck-modules.js",
  "./assets/twis-loop-calibration.js",
  "./assets/twis-loop-forge.js",
  "./assets/loop-recorder-worklet.js",
  "./assets/ghost-ring-worklet.js",
  "./assets/road-signal-machine.js",
  "./assets/install-workshop.js",
  "./assets/icons/twis-holo-icon.svg",
  "./assets/icons/twis-loop-deck-icon.svg",
  "./assets/icons/twis-loop-deck-icon-192.png",
  "./assets/icons/twis-loop-deck-icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    const copy = response.clone();
    caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy)).catch(() => {});
    return response;
  }).catch(() => caches.match("./index.html"))));
});

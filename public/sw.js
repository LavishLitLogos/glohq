const CACHE_NAME = "glohq-app-v1";
const SHELL = [
  "/",
  "/index.html",
  "/styles.css",
  "/app.js",
  "/manifest.webmanifest",
  "/assets/favicon.svg",
  "/assets/dc52-hq-hero.png",
  "/assets/icons/vaultlogo.png",
  "/assets/icons/home.png",
  "/assets/icons/discover.png",
  "/assets/icons/famz.png",
  "/assets/icons/glotapeicon.png",
  "/assets/icons/mixkeyicon.png",
  "/assets/icons/clubtag.png",
  "/assets/icons/profile.png",
  "/assets/icons/glofirereact.png",
  "/assets/icons/rocketreaction.png",
  "/assets/icons/ripkanos.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/media/")) return;

  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request).catch(() => caches.match("/index.html")));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fresh = fetch(event.request)
        .then((response) => {
          if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response.clone()));
          return response;
        })
        .catch(() => cached);
      return cached || fresh;
    })
  );
});

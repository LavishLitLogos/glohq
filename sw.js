const CACHE_NAME = "glohq-premium-pwa-v2";
const PRECACHE_ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./script.js",
  "./manifest.webmanifest",
  "./assets/favicon.svg",
  "./assets/dc52-hq-hero.png",
  "./assets/icons/battledeck.png",
  "./assets/icons/clubtag.png",
  "./assets/icons/collection.png",
  "./assets/icons/discover.png",
  "./assets/icons/dropkey.png",
  "./assets/icons/famz.png",
  "./assets/icons/glofirereact.png",
  "./assets/icons/gloradio.png",
  "./assets/icons/glotapeicon.png",
  "./assets/icons/home.png",
  "./assets/icons/messages.png",
  "./assets/icons/mixkey.png",
  "./assets/icons/notis.png",
  "./assets/icons/profile.png",
  "./assets/icons/ripkanos.svg",
  "./assets/icons/rocketreaction.png",
  "./assets/icons/settings.png",
  "./assets/icons/shop.png",
  "./assets/icons/stats.png",
  "./assets/icons/trophy.png",
  "./assets/icons/vaultlogo.png",
  "./assets/icons/vip.png",
  "./assets/icons/xp.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
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
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put("./index.html", copy));
          return response;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});

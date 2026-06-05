const CACHE = "restoos-v1"
const STATIC_ASSETS = ["/manifest.json", "/offline.html"]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  )
})

self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  if (request.method !== "GET") return

  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(request))
  } else if (STATIC_ASSETS.includes(url.pathname) || /\.(js|css|png|jpg|svg|ico)$/.test(url.pathname)) {
    event.respondWith(cacheFirst(request))
  } else {
    event.respondWith(networkFirst(request))
  }
})

async function cacheFirst(request) {
  const cached = await caches.match(request)
  return cached || fetchAndCache(request)
}

async function networkFirst(request) {
  try {
    return await fetchAndCache(request)
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached
    return caches.match("/offline.html")
  }
}

async function fetchAndCache(request) {
  const response = await fetch(request)
  if (response.ok) {
    const clone = response.clone()
    caches.open(CACHE).then((cache) => cache.put(request, clone))
  }
  return response
}

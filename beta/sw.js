// Mon GPS Camion — copie hors ligne de l'application et des cartes
const APP = 'gps-app-v2';
const MAP = 'gps-map-v1';

self.addEventListener('install', e => {
  e.waitUntil(caches.open(APP).then(c => c.addAll(['./', './index.html'])).catch(() => {}));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('gps-app-') && k !== APP) await caches.delete(k);
    await self.clients.claim();
  })());
});

async function cacheFirst(req, name){
  const c = await caches.open(name);
  const hit = await c.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok) c.put(req, res.clone());
  return res;
}
async function networkFirst(req, name){
  const c = await caches.open(name);
  try {
    const res = await fetch(req);
    if (res.ok) c.put(req, res.clone());
    return res;
  } catch (e) {
    const hit = await c.match(req, { ignoreSearch: true });
    if (hit) return hit;
    throw e;
  }
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);
  if (u.hostname === 'tiles.openfreemap.org') {
    // style et description des tuiles : la version la plus récente quand il y a du réseau
    const fresh = u.pathname.startsWith('/styles/') || /^\/planet\/?$/.test(u.pathname);
    e.respondWith(fresh ? networkFirst(req, MAP) : cacheFirst(req, MAP));
    return;
  }
  if (u.hostname === 'unpkg.com') { e.respondWith(cacheFirst(req, APP)); return; }
  if (u.origin === self.location.origin) { e.respondWith(networkFirst(req, APP)); return; }
});

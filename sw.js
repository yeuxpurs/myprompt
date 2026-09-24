const CACHE_NAME = 'jke-ai-toolkit-v2026.09.24-byok-1';
const PRECACHE = [
  "./",
  "./index.html",
  "./config.js",
  "./manifest.webmanifest",
  "./offline.html",
  "./robots.txt",
  "./assets/runtime.js",
  "./assets/ai-client.js",
  "./assets/favicon.svg",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./app/ai-inspection-agent.html",
  "./app/azure_openai_guide.html",
  "./app/copilot-guide.html",
  "./app/cot-prompt-generator-rag-train.html",
  "./app/cot-prompt-generator.html",
  "./app/prompt-refinement-agent.html",
  "./app/prompt-template-generator.html",
  "./app/prompt_lib.html",
  "./app/vendor/jszip.min.js"
];
const OFFLINE_URL = new URL('./offline.html', self.registration.scope).href;

self.addEventListener('install', event => {
  // Cache files one by one so a single missing file cannot break installation.
  event.waitUntil(caches.open(CACHE_NAME).then(cache => Promise.allSettled(PRECACHE.map(u => cache.add(u)))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).then(res => {
      const copy=res.clone(); caches.open(CACHE_NAME).then(c=>c.put(req,copy)); return res;
    }).catch(async () => (await caches.match(req, {ignoreSearch:true})) || (await caches.match(OFFLINE_URL))));
    return;
  }
  // Network-first: always pick up new deployments, fall back to cache offline.
  event.respondWith(fetch(req).then(res => {
    if (res.ok) { const copy=res.clone(); caches.open(CACHE_NAME).then(c=>c.put(req,copy)); }
    return res;
  }).catch(() => caches.match(req, {ignoreSearch:true})));
});

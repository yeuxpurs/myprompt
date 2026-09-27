/* Cache only this application's public files, within this registration's scope. */
const SCOPE_URL = new URL(self.registration.scope);
const CACHE_PREFIX = `myprompt:${SCOPE_URL.pathname}:`;
const CACHE_NAME = `${CACHE_PREFIX}2026-09-27-v2-layout`;
const PRECACHE = [
  './', './index.html', './offline.html', './manifest.webmanifest',
  './assets/core.js', './assets/formats.js', './assets/i18n.js', './assets/prompts.js', './assets/app.js',
  './assets/app.css', './assets/favicon.svg',
  './app/prompt-template-generator.html', './app/prompt_lib.html',
  './app/azure_openai_guide.html', './app/copilot-guide.html',
  './app/cot-prompt-generator.html', './app/cot-prompt-generator-rag-train.html',
  './app/prompt-refinement-agent.html', './app/ai-inspection-agent.html'
].map(path => new URL(path, SCOPE_URL).href);
const CACHEABLE_URLS = new Set(PRECACHE);
const OFFLINE_URL = new URL('./offline.html', SCOPE_URL).href;

self.addEventListener('install', event => {
  // Fail installation if a release is incomplete; the prior worker remains usable.
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map(key => caches.delete(key))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== SCOPE_URL.origin || !url.pathname.startsWith(SCOPE_URL.pathname)) return;
  url.search = '';
  url.hash = '';
  const cacheKey = url.href;
  const knownFile = CACHEABLE_URLS.has(cacheKey);
  if (!knownFile && request.mode !== 'navigate') return;

  // Network first picks up deployments; only successful, known static files are cached.
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      const response = await fetch(request);
      if (knownFile && response.ok && response.type !== 'opaque' && !response.redirected) {
        try { await cache.put(cacheKey, response.clone()); } catch (_) { /* Storage pressure must not break an online request. */ }
      }
      return response;
    } catch (_) {
      const cached = await cache.match(cacheKey);
      if (cached) return cached;
      if (request.mode === 'navigate') {
        const offline = await cache.match(OFFLINE_URL);
        if (offline) return offline;
      }
      return new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    }
  })());
});

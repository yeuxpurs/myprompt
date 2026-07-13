/**
 * JKE AI Toolkit gateway and optional local static server.
 * Node.js 18+, no external packages.
 *
 * API routes:
 *   GET  /health
 *   POST /api/prompt-refine
 *   POST /api/prompt-run
 *   POST /api/inspect
 *
 * Optional local all-in-one mode:
 *   SERVE_STATIC=1 node server/ai-gateway.mjs
 *   -> opens the toolkit at http://127.0.0.1:8787/
 *
 * Browser JSON body:
 *   { provider: "nvidia" | "openai" | "azure", endpoint, payload }
 */
import http from 'node:http';
import path from 'node:path';
import {readFile, stat} from 'node:fs/promises';
import {timingSafeEqual} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HOST = String(process.env.HOST || '127.0.0.1');
const PORT = Number(process.env.PORT || 8787);
const SERVE_STATIC = /^(1|true|yes)$/i.test(String(process.env.SERVE_STATIC || ''));
const MAX_BODY_BYTES = Number(process.env.MAX_BODY_BYTES || 25_000_000);
const UPSTREAM_TIMEOUT_MS = Number(process.env.UPSTREAM_TIMEOUT_MS || 180_000);
const GATEWAY_TOKEN = String(process.env.GATEWAY_TOKEN || '');
const ROUTES = new Set(['/api/prompt-refine', '/api/prompt-run', '/api/inspect']);
const DEFAULTS = {
  nvidia: 'https://integrate.api.nvidia.com/v1/chat/completions',
  openai: 'https://api.openai.com/v1/chat/completions'
};

function splitOrigins(value) {
  return String(value || '').split(',').map(x => x.trim()).filter(Boolean);
}

const ALLOWED_ORIGINS = splitOrigins(
  process.env.ALLOWED_ORIGINS || process.env.ALLOWED_ORIGIN || [
    'http://127.0.0.1:8787',
    'http://localhost:8787',
    'http://127.0.0.1:8000',
    'http://localhost:8000',
    'null'
  ].join(',')
);

function corsFor(req) {
  const origin = String(req.headers.origin || '');
  const allowAll = ALLOWED_ORIGINS.includes('*');
  const permitted = !origin || allowAll || ALLOWED_ORIGINS.includes(origin);
  return {
    permitted,
    origin: origin && permitted ? origin : (allowAll ? '*' : 'null')
  };
}

function setCommonHeaders(res, cors) {
  res.setHeader('Access-Control-Allow-Origin', cors.origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Gateway-Token');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, POST, OPTIONS');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
}

function json(res, statusCode, body, cors) {
  if (cors) setCommonHeaders(res, cors);
  res.writeHead(statusCode, {'Content-Type': 'application/json; charset=utf-8'});
  res.end(JSON.stringify(body));
}

function tokenMatches(received) {
  if (!GATEWAY_TOKEN) return true;
  const a = Buffer.from(String(received || ''));
  const b = Buffer.from(GATEWAY_TOKEN);
  return a.length === b.length && timingSafeEqual(a, b);
}

function normalizeProvider(value) {
  const provider = String(value || 'nvidia').toLowerCase();
  if (!['nvidia', 'openai', 'azure'].includes(provider)) {
    throw new Error(`Unsupported provider: ${provider}`);
  }
  return provider;
}

function validateEndpoint(provider, endpoint) {
  let url;
  try {
    url = new URL(endpoint);
  } catch {
    throw new Error('Invalid endpoint URL');
  }
  if (url.protocol !== 'https:') throw new Error('Only HTTPS upstream endpoints are allowed');
  const host = url.hostname.toLowerCase();
  const allowed = provider === 'nvidia'
    ? host === 'integrate.api.nvidia.com'
    : provider === 'openai'
      ? host === 'api.openai.com'
      : host.endsWith('.openai.azure.com');
  if (!allowed) throw new Error(`Endpoint host is not allowed for provider ${provider}`);
  return url.toString();
}

function authFor(provider) {
  if (provider === 'nvidia') {
    const key = process.env.NVIDIA_API_KEY;
    if (!key) throw new Error('NVIDIA_API_KEY is not set on the gateway');
    return {Authorization: `Bearer ${key}`};
  }
  if (provider === 'openai') {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error('OPENAI_API_KEY is not set on the gateway');
    return {Authorization: `Bearer ${key}`};
  }
  const key = process.env.AZURE_OPENAI_API_KEY;
  if (!key) throw new Error('AZURE_OPENAI_API_KEY is not set on the gateway');
  return {'api-key': key};
}

async function readJsonBody(req) {
  const chunks = [];
  let bytes = 0;
  for await (const chunk of req) {
    bytes += chunk.length;
    if (bytes > MAX_BODY_BYTES) {
      const error = new Error(`Request exceeds ${MAX_BODY_BYTES} bytes`);
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
  } catch {
    const error = new Error('Request body is not valid JSON');
    error.statusCode = 400;
    throw error;
  }
}

async function forwardChat(body) {
  const provider = normalizeProvider(body.provider);
  const endpoint = validateEndpoint(provider, String(body.endpoint || DEFAULTS[provider] || ''));
  const payload = body.payload;
  if (!payload || !Array.isArray(payload.messages) || payload.messages.length === 0) {
    throw new Error('Invalid chat-completions payload');
  }
  if (provider !== 'azure' && !payload.model) throw new Error('payload.model is required');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
  try {
    const upstream = await fetch(endpoint, {
      method: 'POST',
      headers: {'Content-Type': 'application/json', ...authFor(provider)},
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    const text = await upstream.text();
    return {
      status: upstream.status,
      contentType: upstream.headers.get('content-type') || 'application/json; charset=utf-8',
      text
    };
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error(`Upstream request timed out after ${UPSTREAM_TIMEOUT_MS} ms`);
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

const MIME = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.webmanifest', 'application/manifest+json; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.webp', 'image/webp'],
  ['.ico', 'image/x-icon'],
  ['.txt', 'text/plain; charset=utf-8']
]);

function staticPathFor(pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  if (decoded === '/') decoded = '/index.html';
  const allowed = decoded === '/index.html' || decoded === '/runtime-config.js' || decoded.startsWith('/app/');
  if (!allowed || decoded.includes('\0')) return null;
  const target = path.resolve(ROOT, `.${decoded}`);
  if (target !== path.resolve(ROOT, 'index.html') && target !== path.resolve(ROOT, 'runtime-config.js') && !target.startsWith(path.resolve(ROOT, 'app') + path.sep)) {
    return null;
  }
  return target;
}

async function serveStatic(req, res, requestUrl) {
  if (!SERVE_STATIC || !['GET', 'HEAD'].includes(req.method || '')) return false;
  const target = staticPathFor(requestUrl.pathname);
  if (!target) return false;
  try {
    const info = await stat(target);
    if (!info.isFile()) return false;
    const data = await readFile(target);
    const type = MIME.get(path.extname(target).toLowerCase()) || 'application/octet-stream';
    const isHtmlOrConfig = type.startsWith('text/html') || target.endsWith('runtime-config.js');
    res.writeHead(200, {
      'Content-Type': type,
      'Content-Length': data.length,
      'Cache-Control': isHtmlOrConfig ? 'no-cache' : 'public, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer'
    });
    if (req.method === 'HEAD') res.end(); else res.end(data);
    return true;
  } catch {
    return false;
  }
}

const server = http.createServer(async (req, res) => {
  const cors = corsFor(req);
  const requestUrl = new URL(req.url || '/', `http://${req.headers.host || `${HOST}:${PORT}`}`);
  const isApiRequest = requestUrl.pathname === '/health' || ROUTES.has(requestUrl.pathname) || req.method === 'OPTIONS';

  if (isApiRequest) {
    setCommonHeaders(res, cors);
    if (!cors.permitted) return json(res, 403, {error: 'Origin not allowed'}, cors);
    if (req.method === 'OPTIONS') return res.end();
    if (!tokenMatches(req.headers['x-gateway-token'])) {
      return json(res, 401, {error: 'Invalid or missing gateway access token'}, cors);
    }

    if (req.method === 'GET' && requestUrl.pathname === '/health') {
      return json(res, 200, {
        ok: true,
        service: 'JKE AI Gateway',
        static_site: SERVE_STATIC,
        providers: {
          nvidia: Boolean(process.env.NVIDIA_API_KEY),
          openai: Boolean(process.env.OPENAI_API_KEY),
          azure: Boolean(process.env.AZURE_OPENAI_API_KEY)
        }
      }, cors);
    }

    if (req.method !== 'POST' || !ROUTES.has(requestUrl.pathname)) {
      return json(res, 404, {error: 'Not found'}, cors);
    }

    try {
      const body = await readJsonBody(req);
      const upstream = await forwardChat(body);
      setCommonHeaders(res, cors);
      res.writeHead(upstream.status, {'Content-Type': upstream.contentType});
      return res.end(upstream.text);
    } catch (error) {
      const message = error?.message || String(error);
      const statusCode = Number(error?.statusCode || (/API_KEY is not set/.test(message) ? 503 : 400));
      return json(res, statusCode, {error: message}, cors);
    }
  }

  if (await serveStatic(req, res, requestUrl)) return;
  json(res, 404, {error: 'Not found'});
});

server.listen(PORT, HOST, () => {
  console.log(`JKE AI gateway: http://${HOST}:${PORT}`);
  console.log(`Static site: ${SERVE_STATIC ? `http://${HOST}:${PORT}/` : 'disabled'}`);
  console.log(`Allowed origins: ${ALLOWED_ORIGINS.join(', ')}`);
  console.log(`Gateway token: ${GATEWAY_TOKEN ? 'required' : 'not set'}`);
  console.log(`Routes: GET /health, ${[...ROUTES].join(', ')}`);
});

#!/usr/bin/env node
import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { realpath, stat } from 'node:fs/promises';
import { extname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = await realpath(fileURLToPath(new URL('../', import.meta.url)));
for (const required of ['index.html', 'assets/core.js']) {
  if (!(await stat(resolve(projectRoot, required))).isFile()) throw new Error(`Invalid site root: missing ${required}`);
}
const args = process.argv.slice(2);
if (args.length && !(args.length === 2 && args[0] === '--port')) throw new Error('Usage: node server/serve.mjs [--port 8787]');
const portText = args[1] ?? process.env.MYPROMPT_PORT ?? '8787';
if (!/^\d+$/.test(portText) || Number(portText) < 1 || Number(portText) > 65535) throw new Error('Port must be between 1 and 65535.');
const port = Number(portText);
const mimeTypes = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.pdf': 'application/pdf'
};
function insideRoot(path) {
  const difference = relative(projectRoot, path);
  return difference !== '..' && !difference.startsWith(`..${sep}`) && !isAbsolute(difference);
}
function respond(response, status, message, headers = {}) {
  response.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', ...headers });
  response.end(message);
}

const server = createServer(async (request, response) => {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  if (request.method !== 'GET' && request.method !== 'HEAD') return respond(response, 405, 'Method not allowed', { Allow: 'GET, HEAD' });
  let pathname;
  try { pathname = decodeURIComponent((request.url || '/').split('?')[0]); }
  catch (_) { return respond(response, 400, 'Invalid URL encoding'); }
  if (!pathname.startsWith('/') || pathname.includes('\\') || /[\u0000-\u001f\u007f]/.test(pathname)) return respond(response, 400, 'Invalid path');
  if (pathname.split('/').some(part => part === '..' || part.startsWith('.'))) return respond(response, 403, 'Forbidden');
  try {
    let path = resolve(projectRoot, pathname.replace(/^\/+/, ''));
    if (!insideRoot(path)) return respond(response, 403, 'Forbidden');
    let info = await stat(path);
    if (info.isDirectory()) { path = resolve(path, 'index.html'); info = await stat(path); }
    const actualPath = await realpath(path);
    if (!insideRoot(actualPath)) return respond(response, 403, 'Forbidden');
    if (!info.isFile()) return respond(response, 404, 'Not found');
    response.writeHead(200, {
      'Content-Type': mimeTypes[extname(actualPath).toLowerCase()] || 'application/octet-stream',
      'Content-Length': info.size, 'Cache-Control': 'no-cache'
    });
    if (request.method === 'HEAD') return response.end();
    const stream = createReadStream(actualPath);
    stream.on('error', () => response.destroy());
    stream.pipe(response);
  } catch (error) {
    const status = error.code === 'EACCES' ? 403 : error.code === 'ENOENT' || error.code === 'ENOTDIR' ? 404 : 500;
    respond(response, status, status === 403 ? 'Forbidden' : status === 404 ? 'Not found' : 'Unable to read file');
  }
});
server.on('error', error => {
  console.error(error.code === 'EADDRINUSE' ? `Port ${port} is already in use. Choose another with --port.` : error.message);
  process.exitCode = 1;
});
server.listen(port, '127.0.0.1', () => console.log(`myprompt: http://127.0.0.1:${port}/\nStatic files only. Press Ctrl+C to stop.`));

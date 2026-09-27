/* Structural/data checks, not a simulated browser. No packages or network access. */
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const core = createRequire(import.meta.url)(join(root, 'assets/core.js'));
const read = name => readFileSync(join(root, name), 'utf8');
const languageCodes = ['ja', 'zh', 'en', 'vi', 'fr', 'es', 'ko'];
const categoryCodes = ['writing', 'research', 'work', 'coding', 'engineering', 'creative'];
const routes = new Set(['home', 'library', 'studio', 'workflows', 'guide', 'favorites', 'my', 'main-content']);
const context = vm.createContext({});
context.window = context;
for (const name of ['assets/i18n.js', 'assets/prompts.js']) vm.runInContext(read(name), context, { filename: name, timeout: 1000 });
// Clone data into this realm before passing it to the deliberately strict validator.
const locales = JSON.parse(JSON.stringify(context.MYPROMPT_I18N));
const catalog = JSON.parse(JSON.stringify(context.MYPROMPT_PROMPTS));
assert.deepEqual(core.languages.map(item => item.code), languageCodes, 'language selector order');
assert.deepEqual(Object.keys(locales), languageCodes, 'all seven locales in selector order');
assert.ok(Array.isArray(catalog) && catalog.length > 0, 'catalog is populated');
const ids = new Set();
for (const item of catalog) {
  assert.ok(!ids.has(item.id), `duplicate catalog id: ${item.id}`);
  ids.add(item.id);
  assert.ok(categoryCodes.includes(item.category), `${item.id}: unknown category`);
  assert.deepEqual(Object.keys(item.translations), languageCodes, `${item.id}: translation order/completeness`);
  for (const language of languageCodes) {
    const localized = item.translations[language];
    for (const key of ['title', 'description', 'body']) assert.ok(typeof localized[key] === 'string' && localized[key].trim(), `${item.id}/${language}: missing ${key}`);
    assert.ok(Array.isArray(localized.tags), `${item.id}/${language}: localized tags`);
    assert.equal(localized.tags.length, item.tags.length, `${item.id}/${language}: tag count`);
    assert.deepEqual(core.normalizeTags(localized.tags), localized.tags, `${item.id}/${language}: valid distinct tags`);
    core.validatePrompt({ ...localized, id: item.id, category: item.category });
    const variables = core.extractVariables(localized.body);
    assert.ok(variables.length > 0, `${item.id}/${language}: usable variables`);
    assert.equal(core.fillVariables(localized.body, {}), localized.body, `${item.id}/${language}: missing variables remain visible`);
  }
}
// A translated tag must refer to one stable filter identity, including on personal copies.
const aliases = new Map();
for (const item of catalog) for (const translated of Object.values(item.translations)) {
  translated.tags.forEach((label, index) => {
    const alias = core.tagIdentity(label), key = core.tagIdentity(item.tags[index]);
    assert.ok(!aliases.has(alias) || aliases.get(alias) === key, `ambiguous translated tag: ${label}`);
    aliases.set(alias, key);
  });
}
for (const category of categoryCodes) assert.ok(catalog.some(item => item.category === category), `empty category: ${category}`);

function placeholders(value) { return [...value.matchAll(/(?<!\{)\{([a-zA-Z][a-zA-Z0-9_]*)\}(?!\})/g)].map(match => match[1]).sort(); }
function checkTranslationShape(reference, candidate, path) {
  assert.equal(Array.isArray(candidate), Array.isArray(reference), `${path}: array shape`);
  assert.equal(typeof candidate, typeof reference, `${path}: value type`);
  if (typeof reference === 'string') {
    assert.ok(candidate.trim(), `${path}: empty translation`);
    assert.deepEqual(placeholders(candidate), placeholders(reference), `${path}: formatting placeholders`);
    return;
  }
  assert.ok(candidate !== null && reference !== null, `${path}: null data`);
  assert.deepEqual(Object.keys(candidate).sort(), Object.keys(reference).sort(), `${path}: missing or unexpected translation keys`);
  for (const key of Object.keys(reference)) checkTranslationShape(reference[key], candidate[key], `${path}.${key}`);
}
for (const language of languageCodes) {
  checkTranslationShape(locales.ja, locales[language], language);
  for (const category of categoryCodes) assert.ok(locales[language][category], `${language}: missing category label`);
  for (const workflow of locales[language].workflowCards) {
    assert.ok(ids.has(workflow.promptId), `${language}/${workflow.id}: missing linked template`);
    assert.ok(workflow.steps.length > 0, `${language}/${workflow.id}: missing workflow steps`);
  }
}
const appSource = read('assets/app.js');
for (const match of appSource.matchAll(/\bt\(\s*['"]([^'"]+)['"]/g)) assert.ok(Object.hasOwn(locales.ja, match[1]), `unknown UI translation key: ${match[1]}`);
for (const match of appSource.matchAll(/\bhref=["']#([^"']+)["']/g)) {
  if (!match[1].includes('${')) assert.ok(routes.has(match[1].split('?')[0]), `unknown application route: ${match[1]}`);
}
assert.match(appSource, /location\.protocol\s*!==?\s*['"]file:/, 'service worker must be disabled on file://');

let references = 0;
function checkReference(source, raw) {
  if (!raw || raw.includes('${') || /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(raw)) return;
  const base = new URL(source, 'https://example.invalid/myprompt/');
  const url = new URL(raw.replaceAll('&amp;', '&'), base);
  assert.ok(url.pathname.startsWith('/myprompt/'), `${source}: path must stay relative to the Pages subdirectory (${raw})`);
  const path = resolve(root, decodeURIComponent(url.pathname.slice('/myprompt/'.length)));
  const difference = relative(root, path);
  assert.ok(!isAbsolute(difference) && difference !== '..' && !difference.startsWith(`..${sep}`), `${source}: escaped project root`);
  assert.ok(existsSync(path), `${source}: missing local reference ${raw}`);
  if (path.endsWith('index.html') && url.hash) assert.ok(routes.has(url.hash.slice(1).split('?')[0]), `${source}: unknown route ${url.hash}`);
  references++;
}
const htmlFiles = ['index.html', 'offline.html', ...readdirSync(join(root, 'app')).filter(name => name.endsWith('.html')).map(name => `app/${name}`)];
for (const file of htmlFiles) {
  const html = read(file);
  for (const match of html.matchAll(/\b(?:href|src)\s*=\s*["']([^"']+)["']/gi)) checkReference(file, match[1]);
  if (file.startsWith('app/')) {
    const redirect = html.match(/location\.replace\(['"]([^'"]+)['"]\)/);
    assert.ok(redirect, `${file}: old URL needs a redirect`);
    checkReference(file, redirect[1]);
    assert.match(redirect[1], /^\.\.\/index\.html#(?:library|studio|guide|workflows)(?:\?category=research)?$/, `${file}: redirect must target a current tool`);
    assert.ok(html.includes(`href="${redirect[1]}"`), `${file}: no-script fallback must match redirect`);
  }
}
const scripts = [...read('index.html').matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/gi)].map(match => match[1]);
assert.deepEqual(scripts, ['assets/core.js', 'assets/formats.js', 'assets/i18n.js', 'assets/prompts.js', 'assets/app.js'], 'application dependency load order');
const manifest = JSON.parse(read('manifest.webmanifest'));
for (const reference of [manifest.start_url, manifest.scope, ...manifest.icons.map(icon => icon.src)]) checkReference('manifest.webmanifest', reference);
assert.ok(manifest.icons.some(icon => icon.src.endsWith('.svg') && icon.type === 'image/svg+xml'), 'manifest references actual SVG icon');
assert.ok(existsSync(join(root, '.nojekyll')), 'Pages static marker exists');

// Exercise the worker's cache ownership and fallback with in-memory API doubles.
const listeners = new Map();
const deletedCaches = [];
const cachedResponses = new Map();
let precached = [];
let network = async () => new Response('online', { status: 200 });
const scope = 'https://example.invalid/myprompt/';
const workerCache = {
  addAll: async urls => { precached = Array.from(urls); },
  put: async (key, response) => cachedResponses.set(key, response),
  match: async key => cachedResponses.get(key)?.clone()
};
const worker = vm.createContext({
  URL, Response, Set,
  self: { registration: { scope }, addEventListener: (name, handler) => listeners.set(name, handler), skipWaiting: async () => {}, clients: { claim: async () => {} } },
  caches: { open: async () => workerCache, keys: async () => ['myprompt:/myprompt/:old', 'myprompt:/another/:old', 'another-app'], delete: async key => deletedCaches.push(key) },
  fetch: request => network(request)
});
vm.runInContext(read('sw.js'), worker, { filename: 'sw.js', timeout: 1000 });
async function lifecycle(name) { let pending; listeners.get(name)({ waitUntil: value => { pending = value; } }); await pending; }
await lifecycle('install');
await lifecycle('activate');
assert.deepEqual(deletedCaches, ['myprompt:/myprompt/:old'], 'worker must preserve other apps and scopes');
for (const url of precached) checkReference('sw.js', './' + new URL(url).pathname.slice('/myprompt/'.length));
for (const file of [...scripts, 'assets/app.css', 'assets/favicon.svg', ...htmlFiles]) assert.ok(precached.includes(new URL(file, scope).href), `worker missing ${file}`);
async function workerFetch(url, method = 'GET', mode = 'same-origin') {
  let response;
  listeners.get('fetch')({ request: { url, method, mode }, respondWith: pending => { response = pending; } });
  return response;
}
assert.equal(await workerFetch(scope + 'index.html', 'POST'), undefined, 'never intercept writes');
assert.equal(await workerFetch('https://other.invalid/index.html'), undefined, 'never intercept another origin');
assert.equal(await workerFetch('https://example.invalid/another/index.html'), undefined, 'never intercept another app scope');
const online = await workerFetch(scope + 'index.html');
assert.equal(await online.text(), 'online');
network = async () => { throw new Error('Offline'); };
assert.equal(await (await workerFetch(scope + 'index.html')).text(), 'online', 'known files remain available offline');
network = async () => new Response('Not found', { status: 404 });
assert.equal((await workerFetch(scope + 'assets/app.css')).status, 404);
assert.equal(cachedResponses.has(scope + 'assets/app.css'), false, 'failed responses are not cached');
console.log(`Workspace checks: ${languageCodes.length} languages, ${catalog.length} templates, ${references} paths, translation/workflow integrity, scoped offline cache: PASS`);

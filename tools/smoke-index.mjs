import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname, join, relative} from 'node:path';
import vm from 'node:vm';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const configSource = readFileSync(join(root, 'config.js'), 'utf8');
const runtimeSource = readFileSync(join(root, 'assets', 'runtime.js'), 'utf8');
const indexHtml = readFileSync(join(root, 'index.html'), 'utf8');
const inlineScripts = [...indexHtml.matchAll(/<script\b(?![^>]*\bsrc\s*=)[^>]*>([\s\S]*?)<\/script>/gi)]
  .map(match => match[1])
  .filter(source => source.trim());
const indexSource = inlineScripts.find(source => source.includes("const APP_PREFIX='app/'"));
if (!indexSource) throw new Error('Index application script was not found.');

class FakeElement {
  constructor(id = '') {
    this.id = id;
    this.value = '';
    this.textContent = '';
    this.innerHTML = '';
    this.placeholder = '';
    this.dataset = {};
    this.style = {};
    this.listeners = new Map();
    this.tagName = id === 'search' ? 'INPUT' : 'DIV';
    this.isContentEditable = false;
  }
  addEventListener(type, handler) { this.listeners.set(type, handler); }
  focus() { this.focused = true; }
  appendChild() {}
  remove() {}
  select() {}
  setSelectionRange() {}
}

function createStorage() {
  const data = new Map();
  return {
    getItem(key) { return data.has(String(key)) ? data.get(String(key)) : null; },
    setItem(key, value) { data.set(String(key), String(value)); },
    removeItem(key) { data.delete(String(key)); }
  };
}

function runCase(name, locationValues, expectedLabel, expectedGateway) {
  const ids = ['lang', 'theme', 'eyebrow', 'title', 'lead', 'search', 'toolCountLabel', 'privacy', 'count', 'grid', 'runtimePill'];
  const elements = Object.fromEntries(ids.map(id => [id, new FakeElement(id)]));
  const documentElement = new FakeElement('html');
  documentElement.lang = 'ko';
  const document = {
    documentElement,
    title: '',
    activeElement: new FakeElement('body'),
    body: new FakeElement('body'),
    getElementById(id) { return elements[id] || null; },
    addEventListener() {},
    createElement(tag) { return new FakeElement(tag); },
    execCommand() { return true; }
  };
  const location = {...locationValues};
  const localStorage = createStorage();
  const window = {
    location,
    localStorage,
    document,
    navigator: {},
    isSecureContext: location.protocol === 'https:',
    matchMedia() { return {matches: false}; },
    addEventListener() {}
  };
  window.window = window;
  const context = vm.createContext({
    window,
    document,
    location,
    localStorage,
    navigator: window.navigator,
    matchMedia: window.matchMedia,
    URL,
    URLSearchParams,
    console,
    setTimeout,
    clearTimeout,
    Object,
    String,
    Number,
    Array,
    Map,
    Set,
    Math,
    Date,
    RegExp,
    JSON
  });

  vm.runInContext(configSource, context, {filename: 'config.js'});
  vm.runInContext(runtimeSource, context, {filename: 'assets/runtime.js'});
  vm.runInContext(indexSource, context, {filename: 'index.html#app'});

  const cardCount = (elements.grid.innerHTML.match(/<a class="card"/g) || []).length;
  if (cardCount !== 8) throw new Error(`${name}: expected 8 cards, found ${cardCount}`);
  for (const file of [
    'prompt-template-generator.html', 'prompt_lib.html', 'azure_openai_guide.html',
    'copilot-guide.html', 'cot-prompt-generator.html', 'cot-prompt-generator-rag-train.html',
    'prompt-refinement-agent.html', 'ai-inspection-agent.html'
  ]) {
    if (!elements.grid.innerHTML.includes(`href="app/${file}"`)) {
      throw new Error(`${name}: missing relative app link for ${file}`);
    }
  }
  if (elements.runtimePill.textContent !== expectedLabel) {
    throw new Error(`${name}: runtime label ${elements.runtimePill.textContent} != ${expectedLabel}`);
  }
  if (!window.JKE_STORAGE || !window.JKE_RUNTIME?.storage) {
    throw new Error(`${name}: runtime storage compatibility contract is missing`);
  }
  const gateway = window.JKE_RUNTIME.getGatewayBase();
  if (gateway !== expectedGateway) {
    throw new Error(`${name}: gateway ${gateway} != ${expectedGateway}`);
  }
  if (!elements.title.innerHTML.includes('gradient')) {
    throw new Error(`${name}: title was not rendered`);
  }
  console.log(`${name}: 8 cards · ${expectedLabel} · gateway ${expectedGateway || 'unset'} · relative links OK`);
}

runCase('GitHub Pages subpath', {
  protocol: 'https:',
  hostname: 'yeuxpurs.github.io',
  pathname: '/myprompt/index.html',
  search: '',
  href: 'https://yeuxpurs.github.io/myprompt/index.html'
}, 'GITHUB PAGES', '');

runCase('Local file', {
  protocol: 'file:',
  hostname: '',
  pathname: '/C:/myprompt/index.html',
  search: '',
  href: 'file:///C:/myprompt/index.html'
}, 'LOCAL FILE', 'http://127.0.0.1:8787');


runCase('Local integrated server', {
  protocol: 'http:',
  hostname: '127.0.0.1',
  port: '8787',
  origin: 'http://127.0.0.1:8787',
  pathname: '/index.html',
  search: '',
  href: 'http://127.0.0.1:8787/index.html'
}, 'LOCAL HTTP', 'http://127.0.0.1:8787');

console.log('Index smoke test: PASS');

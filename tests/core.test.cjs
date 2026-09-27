'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../assets/core.js');
const instant = '2026-09-27T00:00:00.000Z';
const prompt = (overrides = {}) => ({ id: 'p-test', title: 'Review', description: '', body: 'Review {{ source }} for {{audience}}.', category: 'Writing', tags: ['review'], createdAt: instant, updatedAt: instant, ...overrides });
const state = (overrides = {}) => ({ version: 2, prompts: [], favorites: [], language: 'ja', ...overrides });
const legacy = { cats: [{ id: 'cat', name: '仕事', tasks: [{ id: 'task', name: 'レビュー', prompts: ['First {{資料}}', 'Second prompt'] }] }] };
function storage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return { values, getItem: key => values.has(key) ? values.get(key) : null, setItem: (key, value) => values.set(key, String(value)) };
}
function hash(text) {
  let value = 2166136261;
  for (let i = 0; i < text.length; i++) { value ^= text.charCodeAt(i); value = Math.imul(value, 16777619); }
  return (value >>> 0).toString(36);
}

test('language selector has the requested order', () => {
  assert.deepEqual(core.languages.map(item => item.code), ['ja', 'zh', 'en', 'vi', 'fr', 'es', 'ko']);
});

test('variables are unique, multilingual, and unfilled values remain visible', () => {
  const text = '{{ 資料 }} {{audience}} {{資料}} {{missing}} {{blank}}';
  assert.deepEqual(core.extractVariables(text), ['資料', 'audience', 'missing', 'blank']);
  assert.equal(core.fillVariables(text, { 資料: '$& <input>', audience: 'Everyone', blank: '  ' }), '$& <input> Everyone $& <input> {{missing}} {{blank}}');
  assert.equal(core.fillVariables('{{number}} {{flag}}', { number: 0, flag: false }), '0 false');
});

test('variables never read inherited properties or invoke getters', () => {
  const values = Object.create({ inherited: 'do not use' });
  Object.defineProperty(values, 'getter', { get() { throw new Error('must not run'); } });
  assert.equal(core.fillVariables('{{inherited}} {{getter}} {{constructor}}', values), '{{inherited}} {{getter}} {{constructor}}');
});

test('prompt validation retains literal content and produces stable ids and dates', () => {
  const normalized = core.validatePrompt(prompt({ title: '  Review  ', body: '<script>literal example</script>\r\nnext', tags: ['review', 'review'] }));
  assert.equal(normalized.title, 'Review');
  assert.equal(normalized.body, '<script>literal example</script>\nnext');
  assert.deepEqual(normalized.tags, ['review']);
  assert.deepEqual(core.validatePrompt(normalized), normalized);
  const generated = core.validatePrompt({ title: 'New', body: 'Content' });
  assert.match(generated.id, /^p-/);
  assert.equal(core.validatePrompt(generated).id, generated.id);
  assert.notEqual(core.validatePrompt({ title: 'New', body: 'Content' }).id, generated.id);
});

test('invalid prompts fail before any caller can persist partial data', () => {
  for (const override of [{ title: '' }, { body: null }, { body: '\0' }, { title: 'x'.repeat(161) }, { tags: ['x'.repeat(51)] }, { id: '__proto__' }, { updatedAt: 'tomorrow' }]) {
    assert.throws(() => core.validatePrompt(prompt(override)));
  }
  assert.throws(() => core.validatePrompt(Object.create({ title: 'Inherited', body: 'No' })));
});

test('all three legacy backup shapes preserve every prompt and have stable ids', () => {
  const raw = core.parseImport(JSON.stringify(legacy));
  for (const wrapper of [{ data: legacy }, { promptUIData: legacy, version: '2.0' }]) {
    const converted = core.parseImport(JSON.stringify(wrapper));
    assert.deepEqual(converted.map(item => item.id), raw.map(item => item.id));
    assert.deepEqual(converted.map(item => item.body), ['First {{資料}}', 'Second prompt']);
    assert.equal(converted[0].category, '仕事');
    assert.equal(converted[1].title, 'レビュー · 2');
  }
});

test('imports reject malformed, unsupported, and dangerous JSON atomically', () => {
  for (const text of ['not JSON', 'null', '[]', '{}', '{"version":3,"prompts":[]}', '{"version":2,"prompts":[{"title":"Valid","body":"OK"},{}]}', '{"cats":[{"name":"bad"}]}', '{"__proto__":{"polluted":true},"version":2,"prompts":[]}', '{"version":2,"prompts":[],"extra":{"constructor":{"prototype":{"polluted":true}}}}']) {
    assert.throws(() => core.parseImport(text), undefined, text);
  }
  assert.equal({}.polluted, undefined);
});

test('duplicate imported ids are repaired without dropping distinct prompts', () => {
  const source = JSON.stringify({ version: 2, prompts: [prompt(), prompt({ body: 'Second version' }), prompt({ body: 'Third version' })] });
  const result = core.parseImport(source);
  assert.equal(result.length, 3);
  assert.equal(new Set(result.map(item => item.id)).size, 3);
  assert.deepEqual(core.parseImport(source), result);
});

test('merge preserves existing records and retains changed versions without mutating inputs', () => {
  const original = [prompt(), prompt({ id: 'p-other', body: 'Keep this' })];
  const before = JSON.stringify(original);
  const changed = prompt({ body: 'New version', updatedAt: '2026-09-28T00:00:00.000Z' });
  const result = core.mergePrompts(original, [prompt({ id: 'duplicate', updatedAt: '2026-09-29T00:00:00.000Z' }), changed]);
  assert.deepEqual(result.slice(0, 2), original);
  assert.equal(result.length, 3);
  assert.notEqual(result[2].id, 'p-test');
  assert.equal(result[2].body, 'New version');
  assert.equal(JSON.stringify(original), before);
  assert.equal(changed.id, 'p-test');
  assert.deepEqual(core.mergePrompts(result, [changed]), result);
});

test('merge does not delete preexisting duplicate content', () => {
  const original = [prompt(), prompt({ id: 'p-second' })];
  assert.deepEqual(core.mergePrompts(original, []), original);
});

test('import maps a colliding favorite to its renamed incoming prompt', () => {
  const existing = prompt({ title: 'Existing', body: 'Keep this version' });
  const incoming = prompt({ title: 'Imported', body: 'Favorite this version' });
  const before = JSON.stringify([existing, incoming]);
  const result = core.mergeImport([existing], [incoming]);
  const favorites = [incoming.id].map(id => result.idMap[id]);
  assert.equal(result.prompts.length, 2);
  assert.notEqual(favorites[0], existing.id);
  assert.equal(result.prompts.find(item => item.id === favorites[0]).body, incoming.body);
  assert.deepEqual(result.prompts[0], existing);
  assert.deepEqual(result.prompts, core.mergePrompts([existing], [incoming]));
  assert.equal(JSON.stringify([existing, incoming]), before);
  assert.equal(Object.getPrototypeOf(result.idMap), null);
  const repeated = core.mergeImport(result.prompts, [incoming]);
  assert.deepEqual(repeated.prompts, result.prompts);
  assert.equal(repeated.idMap[incoming.id], favorites[0]);
});

test('import maps a deduplicated favorite to the existing matching content', () => {
  const existing = prompt();
  const incoming = prompt({ id: 'another-device-id', updatedAt: '2026-09-28T00:00:00.000Z' });
  const result = core.mergeImport([existing], [incoming]);
  const favorites = [incoming.id].map(id => result.idMap[id]);
  assert.deepEqual(result.prompts, [existing]);
  assert.deepEqual(favorites, [existing.id]);
  assert.equal(result.prompts.find(item => item.id === favorites[0]).body, incoming.body);
});

test('import maps repeated incoming content to the first retained record', () => {
  const first = prompt({ id: 'first-import' });
  const second = prompt({ id: 'second-import' });
  const result = core.mergeImport([], [first, second]);
  assert.deepEqual(result.prompts, [first]);
  assert.equal(result.idMap[first.id], first.id);
  assert.equal(result.idMap[second.id], first.id);
});

test('legacy migration preserves original storage, prompts, language, and favorites', () => {
  const original = JSON.stringify(legacy);
  const saved = storage({ promptUIData: original, ui_lang: 'ko', promptFavorites: JSON.stringify(['cat|task|' + hash('Second prompt')]) });
  const store = core.createStore(saved);
  const result = store.load();
  assert.equal(result.language, 'ko');
  assert.equal(result.prompts.length, 2);
  assert.deepEqual(result.favorites, [result.prompts[1].id]);
  assert.equal(saved.getItem('promptUIData'), original);
  assert.deepEqual(JSON.parse(saved.getItem('myprompt.v2')), result);
  assert.equal(store.error, null);
  assert.deepEqual(core.createStore(saved).load(), result);
});

test('current state is authoritative and does not reimport intentionally removed legacy items', () => {
  const saved = storage({ 'myprompt.v2': JSON.stringify(state({ language: 'vi', favorites: ['starter-brief'] })), promptUIData: JSON.stringify(legacy) });
  const result = core.createStore(saved).load();
  assert.deepEqual(result.prompts, []);
  assert.equal(result.language, 'vi');
  assert.deepEqual(result.favorites, ['starter-brief']);
});

test('malformed current storage is visible and backed up before a later explicit save', () => {
  const bad = '{unfinished';
  const saved = storage({ 'myprompt.v2': bad });
  const store = core.createStore(saved);
  assert.deepEqual(store.load(), state());
  assert.equal(store.error.code, 'CORRUPT_STORAGE');
  assert.equal(saved.getItem('myprompt.v2'), bad);
  assert.equal(store.save(state({ prompts: [prompt()] })), true);
  assert.equal(saved.getItem(store.recoveryKey), bad);
  assert.equal(JSON.parse(saved.getItem('myprompt.v2')).prompts[0].body, prompt().body);
  assert.equal(store.error, null);
});

test('corrupt recovery must succeed before existing corrupt bytes may be replaced', () => {
  const saved = storage({ 'myprompt.v2': '{broken' });
  const originalSet = saved.setItem;
  saved.setItem = (key, value) => {
    if (key.includes('.recovery.')) throw Object.assign(new Error('No space'), { name: 'QuotaExceededError' });
    originalSet(key, value);
  };
  const store = core.createStore(saved);
  assert.equal(store.save(state({ prompts: [prompt()] })), false);
  assert.equal(store.error.code, 'STORAGE_FULL');
  assert.equal(saved.getItem('myprompt.v2'), '{broken');
});

test('denied storage is graceful and unsaved work stays available in this session', () => {
  const store = core.createStore({ getItem() { throw new Error('Access denied'); }, setItem() { throw new Error('Access denied'); } });
  assert.deepEqual(store.load(), state());
  assert.equal(store.error.code, 'STORAGE_UNAVAILABLE');
  const next = state({ prompts: [prompt()] });
  assert.equal(store.save(next), false);
  assert.deepEqual(store.load(), next);
  const returned = store.load();
  returned.prompts[0].body = 'External mutation';
  assert.equal(store.load().prompts[0].body, prompt().body);
});

test('quota failures keep the persisted library and legacy source intact', () => {
  const saved = storage({ promptUIData: JSON.stringify(legacy) });
  saved.setItem = () => { throw Object.assign(new Error('Quota exceeded'), { name: 'QuotaExceededError' }); };
  const store = core.createStore(saved);
  assert.equal(store.load().prompts.length, 2);
  assert.equal(store.error.code, 'STORAGE_FULL');
  assert.equal(saved.getItem('promptUIData'), JSON.stringify(legacy));
  assert.equal(saved.getItem('myprompt.v2'), null);
});

test('invalid saves preserve both the last usable state and persisted library', () => {
  const initial = state({ prompts: [prompt()] });
  const saved = storage({ 'myprompt.v2': JSON.stringify(initial) });
  const store = core.createStore(saved);
  store.load();
  assert.equal(store.save(state({ prompts: [prompt({ body: '' })] })), false);
  assert.deepEqual(store.load(), initial);
  assert.deepEqual(JSON.parse(saved.getItem('myprompt.v2')), initial);
});

test('malformed legacy data cannot crash initialization or replace its original', () => {
  const saved = storage({ promptUIData: '{bad' });
  const store = core.createStore(saved);
  assert.deepEqual(store.load(), state());
  assert.equal(store.error.code, 'CORRUPT_LEGACY_STORAGE');
  assert.equal(saved.getItem('promptUIData'), '{bad');
  assert.equal(saved.getItem('myprompt.v2'), null);
});

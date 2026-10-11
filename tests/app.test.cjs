'use strict';

// Integration tests execute the real application and data modules. Small DOM
// doubles cover state/form interactions; these are not browser/layout tests.
const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');
const root = join(__dirname, '..');
const instant = '2026-09-27T00:00:00.000Z';
const prompt = (overrides = {}) => ({ id: 'p-one', title: 'Personal prompt', description: '', body: 'Unique personal content', category: 'writing', tags: [], createdAt: instant, updatedAt: instant, ...overrides });
const state = (overrides = {}) => ({ version: 2, prompts: [], favorites: [], hiddenBuiltIns: [], language: 'en', layout: { categoryOrder: [], tagOrder: [], promptOrder: [] }, ...overrides });
const clone = value => JSON.parse(JSON.stringify(value));

function storage(initial) {
  const values = new Map(initial ? [['myprompt.v2', JSON.stringify(initial)]] : []);
  const failures = new Set();
  return {
    values, failures,
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem(key, value) {
      if (failures.has(key)) throw Object.assign(new Error('Storage full'), { name: 'QuotaExceededError' });
      values.set(key, String(value));
    },
    removeItem: key => values.delete(key)
  };
}

function application(saved = storage(state())) {
  const nodes = new Map(), windowEvents = new Map();
  function node(id) {
    if (!nodes.has(id)) nodes.set(id, {
      id, innerHTML: '', textContent: '', value: '', hidden: true, open: false,
      classList: { add() {}, remove() {}, toggle() {} },
      focus() {}, addEventListener() {},
      showModal() { this.open = true; }, close() { this.open = false; },
      querySelector: selector => node(selector), querySelectorAll: () => []
    });
    return nodes.get(id);
  }
  const sandbox = {
    localStorage: saved, URL, URLSearchParams, TextEncoder,
    location: { hash: '#my', protocol: 'file:', hostname: 'localhost' },
    navigator: {},
    document: { getElementById: node, addEventListener() {}, querySelector: node, querySelectorAll: () => [], documentElement: {}, body: node('body') },
    matchMedia: () => ({ matches: false, addEventListener() {} }),
    addEventListener: (name, handler) => windowEvents.set(name, handler),
    setTimeout: () => 1, clearTimeout() {}, scrollTo() {},
    FormData: class { constructor(form) { this.form = form; } get(name) { return this.form[name] ?? null; } }
  };
  sandbox.window = sandbox;
  const context = vm.createContext(sandbox);
  for (const name of ['core.js', 'formats.js', 'i18n.js', 'prompts.js']) {
    vm.runInContext(readFileSync(join(root, 'assets', name), 'utf8'), context, { filename: name });
  }
  const source = readFileSync(join(root, 'assets/app.js'), 'utf8');
  const entry = '\n  render();\n  if (';
  const offset = source.lastIndexOf(entry);
  if (offset === -1) throw new Error('Cannot locate application startup for integration harness.');
  const instrumented = source.slice(0, offset) + `
  render = function () {};
  window.applicationTest = {
    items, itemById, openEditor, saveEditor, requestDelete, deletePending,
    undoDeletion, openDuplicates, t,
    state: function () { return JSON.stringify(state); }
  };
  if (` + source.slice(offset + entry.length);
  vm.runInContext(instrumented, context, { filename: 'app.js' });
  return {
    app: context.applicationTest, node, saved,
    current: () => JSON.parse(context.applicationTest.state()),
    items: () => clone(context.applicationTest.items()),
    dispatchStorage(next) { windowEvents.get('storage')({ key: 'myprompt.v2', newValue: JSON.stringify(next) }); }
  };
}

function fields(overrides = {}) {
  return { title: 'Edited prompt', description: '', category: 'writing', section: '', body: 'New unique content', ...overrides };
}

test('editing and updating a built-in replaces its visible card with the same ID', () => {
  const ui = application();
  const source = ui.app.items()[0], count = ui.items().length;
  ui.app.openEditor(source);
  assert.ok(ui.node('prompt-dialog').innerHTML.includes('editor-form'));
  ui.app.saveEditor(fields({ body: 'My first replacement' }));
  assert.equal(ui.current().prompts.length, 1);
  assert.equal(ui.current().prompts[0].id, source.id);
  assert.equal(ui.items().length, count);
  assert.equal(ui.items().filter(item => item.id === source.id).length, 1);
  ui.app.openEditor(ui.app.itemById(source.id));
  ui.app.saveEditor(fields({ body: 'My second replacement' }));
  assert.equal(ui.current().prompts.length, 1);
  assert.equal(ui.app.itemById(source.id).body, 'My second replacement');
  const reload = application(ui.saved);
  assert.equal(reload.items().filter(item => item.id === source.id).length, 1);
  assert.equal(reload.app.itemById(source.id).body, 'My second replacement');
});

test('adding duplicate content requires an explicit save-anyway action', () => {
  const ui = application(storage(state({ prompts: [prompt()] })));
  ui.app.openEditor();
  const form = fields({ title: 'Renamed duplicate', body: prompt().body });
  ui.app.saveEditor(form);
  assert.equal(ui.current().prompts.length, 1);
  assert.equal(ui.node('prompt-dialog').open, true);
  assert.equal(ui.node('save-warning').hidden, false);
  assert.ok(ui.node('save-warning').innerHTML.includes('Personal prompt'));
  ui.app.saveEditor(form, true);
  assert.equal(ui.current().prompts.length, 2);
  assert.equal(ui.current().prompts.filter(item => item.body === prompt().body).length, 2);
  assert.equal(ui.node('prompt-dialog').open, false);
});

test('deleting a built-in survives reload and its persisted Undo restores it', () => {
  const ui = application();
  const source = ui.app.items()[0];
  ui.app.requestDelete([source.id]);
  assert.equal(ui.node('prompt-dialog').open, true);
  assert.ok(ui.node('prompt-dialog').innerHTML.includes(source.title));
  ui.app.deletePending();
  assert.equal(ui.app.itemById(source.id), undefined);
  assert.deepEqual(ui.current().hiddenBuiltIns, [source.id]);
  const reload = application(ui.saved);
  assert.equal(reload.app.itemById(source.id), undefined);
  reload.app.undoDeletion();
  assert.equal(reload.app.itemById(source.id).title, source.title);
  assert.deepEqual(reload.current().hiddenBuiltIns, []);
  assert.equal(ui.saved.getItem('myprompt.delete-backup'), null);
});

test('duplicate review, selective deletion and Undo retain exact duplicate records and favorites', () => {
  const original = state({ prompts: [prompt(), prompt({ id: 'p-two' }), prompt({ id: 'p-three', body: 'Different content' })], favorites: ['p-two'], layout: { categoryOrder: [], tagOrder: [], promptOrder: ['p-three', 'p-two', 'p-one'] } });
  const ui = application(storage(original));
  ui.app.openDuplicates();
  assert.ok(ui.node('prompt-dialog').innerHTML.includes('data-duplicate-id="p-one"'));
  assert.ok(ui.node('prompt-dialog').innerHTML.includes('data-duplicate-id="p-two"'));
  assert.equal(ui.node('prompt-dialog').innerHTML.includes('data-duplicate-id="p-three"'), false);
  ui.app.requestDelete(['p-two']);
  ui.app.deletePending();
  assert.deepEqual(ui.current().prompts.map(item => item.id), ['p-one', 'p-three']);
  assert.deepEqual(ui.current().favorites, []);
  const reload = application(ui.saved);
  reload.app.undoDeletion();
  assert.deepEqual(reload.current(), original);
});

test('a failed editor save preserves the current library and leaves the form open', () => {
  const initial = state({ prompts: [prompt()] });
  const ui = application(storage(initial));
  ui.app.openEditor(ui.app.itemById('p-one'));
  const form = fields({ body: 'Unsaved new content' });
  ui.saved.failures.add('myprompt.v2');
  ui.app.saveEditor(form);
  assert.deepEqual(ui.current(), initial);
  assert.deepEqual(JSON.parse(ui.saved.getItem('myprompt.v2')), initial);
  assert.equal(ui.node('prompt-dialog').open, true);
  assert.equal(form.body, 'Unsaved new content');
  assert.equal(ui.node('editor-error').textContent, ui.app.t('storageError'));
});

test('deletion cannot proceed if either the undo backup or library write fails', () => {
  for (const key of ['myprompt.delete-backup', 'myprompt.v2']) {
    const initial = state({ prompts: [prompt()] });
    const ui = application(storage(initial));
    ui.app.requestDelete(['p-one']);
    ui.saved.failures.add(key);
    ui.app.deletePending();
    assert.deepEqual(ui.current(), initial, key);
    assert.deepEqual(JSON.parse(ui.saved.getItem('myprompt.v2')), initial, key);
    assert.equal(ui.node('prompt-dialog').open, true, key);
  }
});

test('an editor opened before a cross-tab update cannot overwrite newer prompt content', () => {
  const ui = application(storage(state({ prompts: [prompt()] })));
  ui.app.openEditor(ui.app.itemById('p-one'));
  const newer = state({ prompts: [prompt({ body: 'Newer content from another tab' })] });
  ui.dispatchStorage(newer);
  ui.app.saveEditor(fields({ body: 'Stale edit' }));
  assert.deepEqual(ui.current().prompts, newer.prompts);
  assert.equal(ui.node('prompt-dialog').open, true);
  assert.equal(ui.node('editor-error').textContent, ui.app.t('staleEditor'));
});

test('a deletion confirmation is refreshed when another tab updates its selected prompt', () => {
  const ui = application(storage(state({ prompts: [prompt()] })));
  ui.app.requestDelete(['p-one']);
  const newer = state({ prompts: [prompt({ title: 'Updated title from another tab', body: 'Updated content' })] });
  ui.dispatchStorage(newer);
  ui.app.deletePending();
  assert.deepEqual(ui.current().prompts, newer.prompts);
  assert.equal(ui.node('prompt-dialog').open, true);
  assert.ok(ui.node('prompt-dialog').innerHTML.includes('Updated title from another tab'));
  assert.equal(ui.node('deletion-error').textContent, ui.app.t('staleEditor'));
  assert.equal(ui.saved.getItem('myprompt.delete-backup'), null);
});

test('a failed later deletion and a failed Undo retain the previous restorable backup', () => {
  const original = state({ prompts: [prompt(), prompt({ id: 'p-two', body: 'Another prompt' })] });
  const ui = application(storage(original));
  ui.app.requestDelete(['p-one']);
  ui.app.deletePending();
  const afterDeletion = ui.current(), backup = ui.saved.getItem('myprompt.delete-backup');
  ui.app.requestDelete(['p-two']);
  ui.saved.failures.add('myprompt.v2');
  ui.app.deletePending();
  assert.deepEqual(ui.current(), afterDeletion);
  assert.equal(ui.saved.getItem('myprompt.delete-backup'), backup);
  ui.app.undoDeletion();
  assert.deepEqual(ui.current(), afterDeletion);
  assert.equal(ui.saved.getItem('myprompt.delete-backup'), backup);
  ui.saved.failures.clear();
  ui.app.undoDeletion();
  assert.deepEqual(ui.current(), original);
});

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
const state = (overrides = {}) => ({ version: 2, prompts: [], favorites: [], hiddenBuiltIns: [], language: 'en', ...overrides, layout: { categoryOrder: [], tagOrder: [], promptOrder: [], catalogMetadata: [], ...overrides.layout } });
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
    undoDeletion, openDuplicates, t, catalogItems, promptTagEntries,
    categoryOptions, subtagOptions, openClassification, saveClassification,
    mergeCatalogMetadata,
    setLanguage: function (value) { language = value; },
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

function classify(ui, kind, key, group, name) {
  ui.app.openClassification(kind, key, group, name === null ? 'delete' : 'rename');
  assert.equal(ui.node('prompt-dialog').open, true, 'classification editor opens');
  ui.app.saveClassification(name);
  assert.equal(ui.node('prompt-dialog').open, false, ui.node('classification-error').textContent);
}
const subtagKeys = (ui, group = '') => clone(ui.app.subtagOptions(group)).map(([key]) => key);
const bodies = ui => ui.items().map(({ id, body }) => ({ id, body }));

test('category rename and merge update assignments and ordering without copying or modifying prompt content', () => {
  const original = state({
    prompts: [prompt(), prompt({ id: 'p-pool', category: 'Review pool', body: 'Another body' }), prompt({ id: 'p-work', category: 'work', body: 'Unrelated body' })],
    favorites: ['source-led-article', 'p-one'],
    layout: { categoryOrder: ['writing', 'Review pool', 'work'], tagOrder: [{ category: 'writing', tags: ['First'] }, { category: 'Review pool', tags: ['Second'] }] }
  });
  const ui = application(storage(original));
  const originalBodies = bodies(ui), count = ui.items().length;
  const builtinIds = ui.items().filter(item => item.builtIn && item.category === 'writing').map(item => item.id);
  classify(ui, 'category', 'writing', '', 'Notes');
  assert.equal(ui.app.itemById('p-one').category, 'Notes');
  assert.ok(builtinIds.every(id => ui.app.itemById(id).category === 'Notes'));
  assert.equal(ui.app.categoryOptions().includes('writing'), false);
  classify(ui, 'category', 'Notes', '', 'Review pool');
  assert.deepEqual(ui.current().layout.categoryOrder, ['Review pool', 'work']);
  assert.deepEqual(ui.current().layout.tagOrder.find(row => row.category === 'Review pool').tags, ['First', 'Second']);
  assert.equal(ui.app.itemById('p-one').category, 'Review pool');
  assert.equal(ui.app.itemById('p-pool').category, 'Review pool');
  assert.equal(ui.app.itemById('p-work').category, 'work');
  assert.equal(ui.app.categoryOptions().includes('Notes'), false);
  assert.equal(ui.current().prompts.length, original.prompts.length);
  assert.equal(ui.items().length, count);
  assert.deepEqual(bodies(ui), originalBodies);
  assert.deepEqual(ui.current().favorites, original.favorites);
  assert.ok(builtinIds.every(id => ui.current().layout.catalogMetadata.find(row => row.id === id).category === 'Review pool'));
});

test('category deletion leaves prompts uncategorized and removes category ghosts after reload', () => {
  const original = state({
    prompts: [prompt(), prompt({ id: 'p-keep', category: 'Keep' })], favorites: ['p-one', 'source-led-article'],
    layout: { categoryOrder: ['writing', 'Keep'], tagOrder: [{ category: 'writing', tags: ['Empty section'] }] }
  });
  const ui = application(storage(original)), originalBodies = bodies(ui);
  const affected = ui.items().filter(item => item.category === 'writing').map(item => item.id);
  classify(ui, 'category', 'writing', '', null);
  for (const id of affected) assert.equal(ui.app.itemById(id).category, '');
  assert.equal(ui.app.categoryOptions().includes('writing'), false);
  assert.equal(ui.current().layout.categoryOrder.includes('writing'), false);
  assert.equal(ui.current().layout.tagOrder.some(row => row.category === 'writing'), false);
  const reload = application(ui.saved);
  assert.equal(reload.app.categoryOptions().includes('writing'), false);
  assert.equal(reload.app.itemById('p-keep').category, 'Keep');
  assert.deepEqual(bodies(reload), originalBodies);
  assert.deepEqual(reload.current().favorites, original.favorites);
  assert.equal(reload.current().prompts.length, 2);
});

test('scoped tag rename can be repeated and deleted while the original tag remains in other categories', () => {
  const ui = application(storage(state({
    prompts: [prompt({ category: 'Dept A', tags: ['TopicA'] }), prompt({ id: 'p-other', category: 'Dept B', tags: ['TopicA'] })],
    layout: { tagOrder: [{ category: '', tags: ['tag:topica'] }, { category: 'Dept A', tags: ['tag:topica'] }, { category: 'Dept B', tags: ['tag:topica'] }] }
  })));
  classify(ui, 'subtag', 'tag:topica', 'Dept A', 'TopicX');
  assert.deepEqual(clone(ui.app.itemById('p-one').tags), ['TopicX']);
  assert.deepEqual(clone(ui.app.itemById('p-other').tags), ['TopicA']);
  assert.ok(subtagKeys(ui).includes('tag:topica'));
  assert.ok(subtagKeys(ui).includes('tag:topicx'));
  assert.equal(subtagKeys(ui, 'Dept A').includes('tag:topica'), false);
  classify(ui, 'subtag', 'tag:topicx', 'Dept A', 'TopicY');
  assert.deepEqual(clone(ui.app.itemById('p-one').tags), ['TopicY']);
  assert.equal(subtagKeys(ui).includes('tag:topicx'), false);
  classify(ui, 'subtag', 'tag:topicy', 'Dept A', null);
  assert.deepEqual(clone(ui.app.itemById('p-one').tags), []);
  assert.deepEqual(clone(ui.app.itemById('p-other').tags), ['TopicA']);
  assert.ok(subtagKeys(ui).includes('tag:topica'));
  assert.equal(subtagKeys(ui).includes('tag:topicy'), false);
  const reload = application(ui.saved);
  assert.deepEqual(clone(reload.app.itemById('p-one').tags), []);
  assert.ok(subtagKeys(reload, 'Dept B').includes('tag:topica'));
});

test('merged built-in tags appear once and deleting the effective tag removes every original contributor', () => {
  const ui = application(), source = ui.app.itemById('source-led-article');
  const originalBody = source.body;
  classify(ui, 'subtag', 'tag:article', 'writing', 'brief');
  assert.deepEqual(clone(ui.app.promptTagEntries(ui.app.itemById(source.id))).map(([key]) => key), ['tag:brief', 'tag:sources']);
  assert.deepEqual(clone(ui.app.itemById(source.id).tags), ['brief', 'sources']);
  assert.equal(ui.current().prompts.length, 0);
  classify(ui, 'subtag', 'tag:brief', 'writing', null);
  assert.deepEqual(clone(ui.app.promptTagEntries(ui.app.itemById(source.id))).map(([key]) => key), ['tag:sources']);
  assert.deepEqual(ui.current().layout.catalogMetadata.find(row => row.id === source.id).tagEdits, [{ key: 'article', value: '' }, { key: 'brief', value: '' }]);
  assert.equal(ui.app.itemById(source.id).body, originalBody);
  const reload = application(ui.saved);
  assert.deepEqual(clone(reload.app.itemById(source.id).tags), ['sources']);
});

test('scoped and global section edits clean saved empty-section entries without removing other sections', () => {
  const ui = application(storage(state({
    prompts: [prompt({ category: 'Dept A', section: 'Old section' }), prompt({ id: 'p-other', category: 'Dept B', section: 'Old section' })],
    layout: { categoryOrder: ['Dept A', 'Dept B', 'Empty'], tagOrder: [{ category: '', tags: ['Old section', 'Vacant'] }, { category: 'Dept A', tags: ['Old section', 'Vacant'] }, { category: 'Dept B', tags: ['Old section'] }, { category: 'Empty', tags: ['Vacant'] }] }
  })));
  classify(ui, 'subtag', 'Old section', 'Dept A', 'Renamed section');
  assert.equal(ui.app.itemById('p-one').section, 'Renamed section');
  assert.equal(ui.app.itemById('p-other').section, 'Old section');
  assert.ok(subtagKeys(ui).includes('Old section'));
  classify(ui, 'subtag', 'Old section', '', 'Renamed section');
  assert.equal(ui.app.itemById('p-other').section, 'Renamed section');
  assert.equal(subtagKeys(ui).includes('Old section'), false);
  classify(ui, 'subtag', 'Renamed section', '', null);
  assert.equal(ui.app.itemById('p-one').section, '');
  assert.equal(ui.app.itemById('p-other').section, '');
  assert.equal(subtagKeys(ui).includes('Renamed section'), false);
  classify(ui, 'subtag', 'Vacant', 'Dept A', null);
  assert.equal(subtagKeys(ui, 'Dept A').includes('Vacant'), false);
  assert.ok(subtagKeys(ui).includes('Vacant'));
  classify(ui, 'subtag', 'Vacant', '', null);
  assert.equal(ui.current().layout.tagOrder.some(row => row.tags.includes('Vacant')), false);
  const reload = application(ui.saved);
  assert.equal(subtagKeys(reload).some(key => ['Old section', 'Renamed section', 'Vacant'].includes(key)), false);
  assert.equal(reload.current().prompts.length, 2);
});

test('classification storage failures and stale snapshots preserve existing assignments', () => {
  const original = state({ prompts: [prompt({ category: 'Dept A', tags: ['TopicA'] })] });
  const ui = application(storage(original));
  ui.app.openClassification('category', 'Dept A');
  ui.saved.failures.add('myprompt.v2');
  ui.app.saveClassification('Renamed');
  assert.deepEqual(ui.current(), original);
  assert.deepEqual(JSON.parse(ui.saved.getItem('myprompt.v2')), original);
  assert.equal(ui.node('classification-error').textContent, ui.app.t('storageError'));
  assert.equal(ui.node('prompt-dialog').open, true);
  ui.saved.failures.clear();
  const newer = state({ prompts: [prompt({ category: 'Dept A', tags: ['TopicA'], body: 'Newer body' })] });
  ui.dispatchStorage(newer);
  ui.app.saveClassification('Renamed');
  assert.deepEqual(ui.current().prompts, newer.prompts);
  assert.equal(ui.node('classification-error').textContent, ui.app.t('classificationStale'));
  assert.equal(ui.node('prompt-dialog').open, true);
});

test('imported catalog metadata merges independent fields and updates tags by original key', () => {
  const ui = application();
  const existing = [{ id: 'source-led-article', category: 'Notes', tagEdits: [{ key: 'article', value: 'Draft' }, { key: 'brief', value: 'Outline' }] }, { id: 'localization-editor', category: 'Languages' }];
  const incoming = [{ id: 'source-led-article', tagEdits: [{ key: 'article', value: '' }, { key: 'sources', value: 'References' }] }, { id: 'localization-editor', category: '' }];
  const before = JSON.stringify([existing, incoming]);
  const merged = clone(ui.app.mergeCatalogMetadata(existing, incoming));
  assert.deepEqual(merged, [{ id: 'source-led-article', category: 'Notes', tagEdits: [{ key: 'article', value: '' }, { key: 'brief', value: 'Outline' }, { key: 'sources', value: 'References' }] }, { id: 'localization-editor', category: '' }]);
  assert.equal(JSON.stringify([existing, incoming]), before);
});

test('built-in category and tag edits keep all translated bodies and untouched translated tag labels', () => {
  const ui = application(), source = ui.app.itemById('source-led-article');
  classify(ui, 'category', 'writing', '', 'My notes');
  classify(ui, 'subtag', 'tag:article', 'My notes', 'My drafts');
  ui.app.setLanguage('ko');
  const korean = ui.app.itemById(source.id);
  assert.equal(korean.body, source.translations.ko.body);
  assert.equal(korean.title, source.translations.ko.title);
  assert.equal(korean.category, 'My notes');
  assert.deepEqual(clone(korean.tags), ['My drafts', ...clone(source.translations.ko.tags).slice(1)]);
  assert.notEqual(korean.body, source.body);
  assert.equal(ui.current().prompts.length, 0);
  ui.app.setLanguage('ja');
  assert.equal(ui.app.itemById(source.id).body, source.translations.ja.body);
  assert.equal(ui.app.itemById(source.id).category, 'My notes');
});

test('saving an unchanged localized built-in classification leaves its translation dynamic', () => {
  const ui = application(), original = ui.current();
  ui.app.setLanguage('ko');
  const source = ui.app.itemById('source-led-article');
  classify(ui, 'subtag', 'tag:article', 'writing', source.tags[0]);
  classify(ui, 'category', 'writing', '', ui.app.t('writing'));
  assert.deepEqual(ui.current(), original);
  assert.deepEqual(ui.current().layout.catalogMetadata, []);
  ui.app.setLanguage('ja');
  assert.deepEqual(clone(ui.app.itemById(source.id).tags), clone(source.translations.ja.tags));
  assert.equal(ui.app.itemById(source.id).body, source.translations.ja.body);
});

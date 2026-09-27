/* Shared, dependency-free data operations. Render all returned text as text, never HTML. */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MYPROMPT_CORE = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var KEY = 'myprompt.v2';
  var LEGACY_KEY = 'promptUIData';
  var LIMITS = Object.freeze({ prompts: 5000, importBytes: 10 * 1024 * 1024, title: 160, description: 2000, body: 100000, category: 100, tags: 20, tag: 50, section: 160, variables: 100, variable: 100 });
  var languages = Object.freeze([
    { code: 'ja', name: '日本語' }, { code: 'zh', name: '中文' },
    { code: 'en', name: 'English' }, { code: 'vi', name: 'Tiếng Việt' },
    { code: 'fr', name: 'Français' }, { code: 'es', name: 'Español' },
    { code: 'ko', name: '한국어' }
  ].map(function (entry) { return Object.freeze(entry); }));
  var FORBIDDEN = new Set(['__proto__', 'prototype', 'constructor']);
  var idCounter = 0;

  function fail(message, code) {
    var error = new Error(message);
    error.code = code || 'INVALID_DATA';
    return error;
  }
  function own(object, name) { return Object.prototype.hasOwnProperty.call(object, name); }
  function record(value, name) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw fail(name + ' must be an object.');
    var prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) throw fail(name + ' must be a plain object.');
    Object.keys(value).forEach(function (key) {
      if (FORBIDDEN.has(key)) throw fail('Unsafe object key: ' + key);
      if (!own(Object.getOwnPropertyDescriptor(value, key), 'value')) throw fail('Accessors are not accepted.');
    });
    return value;
  }
  function field(object, name) { return own(object, name) ? object[name] : undefined; }
  function string(value, name, maximum, required) {
    if (value === undefined && !required) return '';
    if (typeof value !== 'string') throw fail(name + ' must be text.');
    var result = value.replace(/\r\n?/g, '\n').trim();
    if (required && !result) throw fail(name + ' is required.');
    if (result.length > maximum) throw fail(name + ' exceeds ' + maximum + ' characters.');
    if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(result)) throw fail(name + ' contains unsupported control characters.');
    return result;
  }
  function validId(value) {
    return typeof value === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(value) && !FORBIDDEN.has(value);
  }
  function newId() {
    if (typeof globalThis !== 'undefined' && globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
      return 'p-' + globalThis.crypto.randomUUID();
    }
    idCounter += 1;
    return 'p-' + Date.now().toString(36) + '-' + idCounter.toString(36) + '-' + Math.random().toString(36).slice(2, 12);
  }
  function date(value, fallback, name) {
    if (value === undefined || value === '') return fallback;
    if (typeof value !== 'string' || value.length > 40 || !/^\d{4}-\d\d-\d\dT/.test(value) || !Number.isFinite(Date.parse(value))) throw fail(name + ' must be an ISO date.');
    return new Date(value).toISOString();
  }
  function tagIdentity(tag) {
    if (typeof tag !== 'string') throw fail('Tags must contain text.', 'INVALID_TAGS');
    // Locale-independent matching keeps stored tags consistent across UI languages.
    return tag.trim().normalize('NFKC').toLowerCase();
  }
  function normalizeTags(input) {
    var pieces;
    if (typeof input === 'string') pieces = input.split(/[,\uFF0C\u3001\r\n]+/);
    else if (Array.isArray(input)) pieces = input;
    else throw fail('Tags must be text or an array of strings.', 'INVALID_TAGS');
    var result = [];
    var seen = new Set();
    for (var i = 0; i < pieces.length; i += 1) {
      var piece = pieces[i];
      if (typeof piece !== 'string') throw fail('Tags must contain text.', 'INVALID_TAGS');
      if (/[\u0000-\u001f\u007f-\u009f]/.test(piece)) throw fail('Tags contain unsupported control characters.', 'INVALID_TAGS');
      var tag = piece.trim();
      if (!tag) continue;
      if (tag.length > LIMITS.tag) throw fail('Tags cannot exceed ' + LIMITS.tag + ' characters.', 'INVALID_TAGS');
      var identity = tagIdentity(tag);
      if (!seen.has(identity)) {
        seen.add(identity);
        result.push(tag);
        if (result.length > LIMITS.tags) throw fail('Use up to ' + LIMITS.tags + ' tags.', 'INVALID_TAGS');
      }
    }
    return result;
  }
  function renameTag(tags, index, newName) {
    if (!Array.isArray(tags) || !Number.isInteger(index) || index < 0 || index >= tags.length) throw fail('Choose a valid tag to rename.', 'INVALID_TAGS');
    if (typeof newName !== 'string' || !newName.trim()) throw fail('Tag name is required.', 'INVALID_TAGS');
    var replacement = normalizeTags([newName]);
    var result = tags.slice();
    result[index] = replacement[0];
    return normalizeTags(result);
  }
  function textList(input, name, maximum, count) {
    if (!Array.isArray(input) || input.length > count) throw fail(name + ' must contain up to ' + count + ' text items.');
    var result = [];
    var seen = new Set();
    for (var i = 0; i < input.length; i += 1) {
      var item = string(input[i], name + ' item', maximum, true);
      if (!seen.has(item)) { seen.add(item); result.push(item); }
    }
    return result;
  }
  function normalizeLayout(input) {
    if (input === undefined) input = {};
    var value = record(input, 'Layout');
    var categories = field(value, 'categoryOrder');
    if (categories === undefined) categories = [];
    if (!Array.isArray(categories) || categories.length > LIMITS.prompts) throw fail('Category order must contain up to ' + LIMITS.prompts + ' categories.');
    var categoryOrder = [];
    var categoryNames = new Set();
    for (var i = 0; i < categories.length; i += 1) {
      if (typeof categories[i] !== 'string') throw fail('Category order must contain text.');
      var name = string(categories[i], 'Category name', LIMITS.category, false);
      if (!categoryNames.has(name)) { categoryNames.add(name); categoryOrder.push(name); }
    }
    var rows = field(value, 'tagOrder');
    if (rows === undefined) rows = [];
    if (!Array.isArray(rows) || rows.length > LIMITS.prompts) throw fail('Tag order must contain up to ' + LIMITS.prompts + ' categories.');
    var tagOrder = [];
    var categoryRows = new Map();
    for (var rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
      var row = record(rows[rowIndex], 'Tag order');
      if (typeof field(row, 'category') !== 'string') throw fail('Tag order category must contain text.');
      var category = string(row.category, 'Category name', LIMITS.category, false);
      var tags = textList(field(row, 'tags'), 'Tag order', LIMITS.section, LIMITS.prompts);
      if (!categoryRows.has(category)) {
        var next = { category: category, tags: tags };
        categoryRows.set(category, next);
        tagOrder.push(next);
      } else {
        var existing = categoryRows.get(category);
        existing.tags = textList(existing.tags.concat(tags), 'Tag order', LIMITS.section, LIMITS.prompts);
      }
    }
    var ids = field(value, 'promptOrder');
    if (ids === undefined) ids = [];
    if (!Array.isArray(ids) || ids.length > LIMITS.prompts) throw fail('Prompt order must contain prompt ids.');
    for (var idIndex = 0; idIndex < ids.length; idIndex += 1) {
      if (!validId(ids[idIndex])) throw fail('Prompt order must contain prompt ids.');
    }
    return { categoryOrder: categoryOrder, tagOrder: tagOrder, promptOrder: Array.from(new Set(ids)) };
  }
  function reorder(list, fromIndex, toIndex) {
    if (!Array.isArray(list) || !Number.isInteger(fromIndex) || !Number.isInteger(toIndex) || fromIndex < 0 || toIndex < 0 || fromIndex >= list.length || toIndex >= list.length) throw fail('Choose valid items to reorder.', 'INVALID_ORDER');
    var result = list.slice();
    result.splice(toIndex, 0, result.splice(fromIndex, 1)[0]);
    return result;
  }
  function validatePrompt(input) {
    var value = record(input, 'Prompt');
    var id = field(value, 'id');
    if (id === undefined || id === '') id = newId();
    if (!validId(id)) throw fail('Prompt id is invalid.');
    var tagInput = field(value, 'tags');
    if (tagInput === undefined) tagInput = [];
    if (!Array.isArray(tagInput)) throw fail('Tags must be an array of strings.', 'INVALID_TAGS');
    var tags = normalizeTags(tagInput);
    var createdAt = date(field(value, 'createdAt'), new Date().toISOString(), 'createdAt');
    var updatedAt = date(field(value, 'updatedAt'), createdAt, 'updatedAt');
    var result = {
      id: id,
      title: string(field(value, 'title'), 'Title', LIMITS.title, true),
      description: string(field(value, 'description'), 'Description', LIMITS.description, false),
      body: string(field(value, 'body'), 'Prompt body', LIMITS.body, true),
      category: string(field(value, 'category'), 'Category', LIMITS.category, false),
      tags: tags,
      createdAt: createdAt,
      updatedAt: updatedAt
    };
    if (own(value, 'section')) result.section = string(value.section, 'Section', LIMITS.section, false);
    ['variables', 'variableOrder'].forEach(function (name) {
      if (own(value, name)) result[name] = textList(value[name], name, LIMITS.variable, LIMITS.variables);
    });
    return result;
  }

  // Each substitution uses a callback: user values such as "$&" stay literal.
  function variablePattern() { return /\{\{\s*([^{}\r\n]+?)\s*\}\}/g; }
  function extractVariables(text) {
    if (typeof text !== 'string') return [];
    var result = [];
    var seen = new Set();
    text.replace(variablePattern(), function (_, name) {
      name = name.trim();
      if (name && !seen.has(name)) { seen.add(name); result.push(name); }
      return _;
    });
    return result;
  }
  function fillVariables(text, values) {
    if (typeof text !== 'string') return '';
    if (!values || typeof values !== 'object') return text;
    return text.replace(variablePattern(), function (token, name) {
      name = name.trim();
      if (!name || !own(values, name)) return token;
      var descriptor = Object.getOwnPropertyDescriptor(values, name);
      if (!descriptor || !own(descriptor, 'value')) return token;
      var value = descriptor.value;
      if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') return token;
      if (typeof value === 'number' && !Number.isFinite(value)) return token;
      return String(value).trim() ? String(value) : token;
    });
  }
  function hash(text) {
    var h = 2166136261;
    for (var i = 0; i < text.length; i += 1) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0).toString(36);
  }
  function signature(prompt) {
    return JSON.stringify([prompt.title, prompt.description, prompt.body, prompt.category, prompt.section || '', prompt.tags, prompt.variables || [], prompt.variableOrder || []]);
  }
  function uniqueId(prompt, ids) {
    if (!ids.has(prompt.id)) { ids.add(prompt.id); return prompt; }
    var base = prompt.id.slice(0, 100) + '-' + hash(signature(prompt));
    var id = base;
    var suffix = 2;
    while (ids.has(id)) { id = base + '-' + suffix; suffix += 1; }
    prompt.id = id;
    ids.add(id);
    return prompt;
  }
  function promptArray(value, name) {
    if (!Array.isArray(value) || value.length > LIMITS.prompts) throw fail(name + ' must be an array of up to ' + LIMITS.prompts + ' prompts.');
    return value;
  }
  function normalizePrompts(value) {
    var ids = new Set();
    return promptArray(value, 'Prompts').map(function (prompt) { return uniqueId(validatePrompt(prompt), ids); });
  }
  function parseJSON(text) {
    if (typeof text !== 'string') throw fail('Import must contain JSON text.');
    // UTF-16 length is bounded before parsing; the caller can additionally inspect File.size.
    if (text.length > LIMITS.importBytes) throw fail('Import is too large.', 'IMPORT_TOO_LARGE');
    try {
      return JSON.parse(text, function (key, value) {
        if (FORBIDDEN.has(key)) throw fail('Unsafe object key: ' + key);
        return value;
      });
    } catch (error) {
      if (error.code) throw error;
      throw fail('The file does not contain valid JSON.', 'INVALID_JSON');
    }
  }
  function legacyDocument(input) {
    var root = record(input, 'Legacy library');
    var outer = root;
    if (own(root, 'promptUIData')) root = record(root.promptUIData, 'promptUIData');
    else if (own(root, 'data')) root = record(root.data, 'data');
    if (!Array.isArray(root.cats) || root.cats.length > LIMITS.prompts) throw fail('Legacy library must contain categories.');
    var entries = [];
    var ids = new Set();
    var layout = { categoryOrder: [], tagOrder: [], promptOrder: [] };
    root.cats.forEach(function (rawCategory, categoryIndex) {
      var category = record(rawCategory, 'Category');
      if (typeof field(category, 'name') !== 'string') throw fail('Category name must be text.');
      var categoryName = string(category.name, 'Category name', LIMITS.category, false);
      if (!Array.isArray(category.tasks) || category.tasks.length > LIMITS.prompts) throw fail('Legacy category must contain up to ' + LIMITS.prompts + ' tasks.');
      layout.categoryOrder.push(categoryName);
      var categoryTags = { category: categoryName, tags: [] };
      layout.tagOrder.push(categoryTags);
      category.tasks.forEach(function (rawTask, taskIndex) {
        var task = record(rawTask, 'Task');
        if (typeof field(task, 'name') !== 'string') throw fail('Task name must be text.');
        var taskName = string(task.name, 'Task name', LIMITS.section, false);
        if (taskName) categoryTags.tags.push(taskName);
        if (!Array.isArray(task.prompts) || task.prompts.length > LIMITS.prompts) throw fail('Legacy task must contain up to ' + LIMITS.prompts + ' prompts.');
        var metadata = field(task, 'promptMeta');
        if (metadata !== undefined && (!Array.isArray(metadata) || metadata.length > LIMITS.prompts)) throw fail('Prompt metadata must be an array.');
        task.prompts.forEach(function (body, promptIndex) {
          if (entries.length >= LIMITS.prompts) throw fail('Too many prompts.');
          var categoryId = field(category, 'id');
          var taskId = field(task, 'id');
          var titleSuffix = task.prompts.length > 1 ? ' · ' + (promptIndex + 1) : '';
          var meta = metadata && metadata[promptIndex] !== undefined ? record(metadata[promptIndex], 'Prompt metadata') : {};
          var title = taskName.slice(0, LIMITS.title - titleSuffix.length) + titleSuffix;
          if (own(meta, 'title') && (!taskName || field(meta, 'section') === taskName)) title = meta.title;
          if (!title) title = 'Prompt ' + (promptIndex + 1);
          var source = {
            id: field(meta, 'id') === undefined ? 'legacy-' + hash(JSON.stringify([categoryId === undefined ? categoryIndex : categoryId, taskId === undefined ? taskIndex : taskId, promptIndex, body])) : meta.id,
            title: title,
            category: categoryName,
            body: body,
            description: own(meta, 'description') ? meta.description : field(task, 'description')
          };
          if (taskName || own(meta, 'section')) source.section = taskName;
          ['tags', 'variables', 'variableOrder'].forEach(function (name) {
            if (own(meta, name)) source[name] = meta[name];
            else if (own(task, name)) source[name] = task[name];
          });
          ['createdAt', 'updatedAt'].forEach(function (name) { if (own(meta, name)) source[name] = meta[name]; });
          var prompt = validatePrompt(source);
          entries.push({ prompt: uniqueId(prompt, ids), oldKey: String(categoryId) + '|' + String(taskId) + '|' + hash(body) });
          layout.promptOrder.push(prompt.id);
        });
      });
    });
    var declaredLayout = own(outer, 'layout') ? outer.layout : own(root, 'layout') ? root.layout : layout;
    return { entries: entries, layout: normalizeLayout(declaredLayout), root: root };
  }
  function parseDocument(text) {
    var value = record(parseJSON(text), 'Import');
    if (own(value, 'prompts')) {
      if (value.version !== 2) throw fail('Unsupported library version.');
      var normalized = normalizeState(value);
      return { prompts: normalized.prompts, layout: normalized.layout, favorites: normalized.favorites, language: normalized.language, format: 'v2' };
    }
    var legacy = legacyDocument(value);
    var legacyFavorites = field(value, 'favorites');
    if (legacyFavorites === undefined) legacyFavorites = field(legacy.root, 'favorites');
    if (legacyFavorites === undefined) legacyFavorites = [];
    if (!Array.isArray(legacyFavorites) || legacyFavorites.length > LIMITS.prompts || legacyFavorites.some(function (key) { return typeof key !== 'string'; })) throw fail('Favorites must contain prompt ids.');
    var oldKeys = new Map(legacy.entries.map(function (entry) { return [entry.oldKey, entry.prompt.id]; }));
    var favorites = legacyFavorites.map(function (key) { return oldKeys.get(key) || key; }).filter(validId);
    var language = field(value, 'language');
    if (language === undefined) language = field(legacy.root, 'language');
    if (!languages.some(function (entry) { return entry.code === language; })) language = 'ja';
    return { prompts: legacy.entries.map(function (entry) { return entry.prompt; }), layout: legacy.layout, favorites: Array.from(new Set(favorites)), language: language, format: 'legacy' };
  }
  function parseImport(text) { return parseDocument(text).prompts; }
  function mergeImport(existing, incoming) {
    var result = normalizePrompts(existing);
    var incomingNormalized = normalizePrompts(incoming);
    var ids = new Set(result.map(function (prompt) { return prompt.id; }));
    var signatures = new Map();
    var idMap = Object.create(null);
    result.forEach(function (prompt) {
      var key = signature(prompt);
      if (!signatures.has(key)) signatures.set(key, prompt.id);
    });
    incomingNormalized.forEach(function (prompt) {
      var incomingId = prompt.id;
      var key = signature(prompt);
      if (signatures.has(key)) {
        idMap[incomingId] = signatures.get(key);
        return;
      }
      if (result.length >= LIMITS.prompts) throw fail('Too many prompts.');
      result.push(uniqueId(prompt, ids));
      signatures.set(key, prompt.id);
      idMap[incomingId] = prompt.id;
    });
    return { prompts: result, idMap: idMap };
  }
  function mergePrompts(existing, incoming) {
    return mergeImport(existing, incoming).prompts;
  }
  function emptyState() { return { version: 2, prompts: [], favorites: [], language: 'ja', layout: normalizeLayout() }; }
  function normalizeState(input) {
    var value = record(input, 'Library');
    if (value.version !== 2) throw fail('Unsupported library version.');
    var prompts = normalizePrompts(value.prompts);
    var favorites = field(value, 'favorites');
    if (favorites === undefined) favorites = [];
    if (!Array.isArray(favorites) || favorites.length > LIMITS.prompts || favorites.some(function (id) { return !validId(id); })) throw fail('Favorites must contain prompt ids.');
    // Favorites may point at the built-in catalog, which is not persisted in prompts.
    var language = field(value, 'language');
    if (!languages.some(function (entry) { return entry.code === language; })) language = 'ja';
    return { version: 2, prompts: prompts, favorites: Array.from(new Set(favorites)), language: language, layout: normalizeLayout(field(value, 'layout')) };
  }
  function clone(state) { return JSON.parse(JSON.stringify(state)); }
  function storageError(error, code) {
    var result = fail(error && error.message ? error.message : 'Browser storage is unavailable.', code || 'STORAGE_UNAVAILABLE');
    return result;
  }
  function createStore(storage) {
    var memory = emptyState();
    var loaded = false;
    var recoveryRaw = null;
    var resolveDefaultStorage = arguments.length === 0;
    var store = { error: null, recoveryKey: null, load: load, save: save };
    function getStorage() {
      if (resolveDefaultStorage) {
        storage = typeof globalThis !== 'undefined' ? globalThis.localStorage : undefined;
        resolveDefaultStorage = false;
      }
      if (!storage || typeof storage.getItem !== 'function' || typeof storage.setItem !== 'function') throw fail('Browser storage is unavailable.');
      return storage;
    }
    function persist() {
      try {
        var target = getStorage();
        // A corrupt original is preserved before a deliberate later save can replace it.
        if (recoveryRaw !== null) {
          var recoveryKey = KEY + '.recovery.' + Date.now().toString(36) + '-' + (++idCounter).toString(36);
          target.setItem(recoveryKey, recoveryRaw);
          store.recoveryKey = recoveryKey;
        }
        target.setItem(KEY, JSON.stringify(memory));
        recoveryRaw = null;
        store.error = null;
        return true;
      } catch (error) {
        store.error = storageError(error, error && error.name === 'QuotaExceededError' ? 'STORAGE_FULL' : 'STORAGE_UNAVAILABLE');
        return false;
      }
    }
    function load() {
      if (loaded) return clone(memory);
      loaded = true;
      var target;
      var current;
      try { target = getStorage(); current = target.getItem(KEY); }
      catch (error) { store.error = storageError(error); return clone(memory); }
      if (current !== null) {
        try { memory = normalizeState(parseJSON(current)); }
        catch (error) { recoveryRaw = current; store.error = storageError(error, 'CORRUPT_STORAGE'); }
        return clone(memory);
      }
      try {
        var legacy = target.getItem(LEGACY_KEY);
        var oldLanguage = target.getItem('ui_lang');
        if (languages.some(function (entry) { return entry.code === oldLanguage; })) memory.language = oldLanguage;
        if (legacy === null) return clone(memory);
        var migrated = legacyDocument(parseJSON(legacy));
        var entries = migrated.entries;
        memory.prompts = entries.map(function (entry) { return entry.prompt; });
        memory.layout = migrated.layout;
        var favoriteError = null;
        try {
          var oldFavorites = target.getItem('promptFavorites');
          var favorites = oldFavorites === null ? [] : parseJSON(oldFavorites);
          if (!Array.isArray(favorites)) throw fail('Legacy favorites are invalid.');
          var oldKeys = new Set(favorites.filter(function (key) { return typeof key === 'string'; }));
          memory.favorites = entries.filter(function (entry) { return oldKeys.has(entry.oldKey); }).map(function (entry) { return entry.prompt.id; });
        } catch (error) { favoriteError = storageError(error, 'LEGACY_FAVORITES_INVALID'); }
        // Never remove or modify the original legacy library or preferences.
        if (persist() && favoriteError) store.error = favoriteError;
      } catch (error) {
        store.error = storageError(error, error && error.code === 'INVALID_JSON' ? 'CORRUPT_LEGACY_STORAGE' : 'MIGRATION_FAILED');
      }
      return clone(memory);
    }
    function save(state) {
      // Load first so even a caller that saves before loading cannot overwrite corrupt data.
      if (!loaded) load();
      try { memory = normalizeState(state); }
      catch (error) { store.error = error; return false; }
      return persist();
    }
    return store;
  }

  return Object.freeze({
    languages: languages, limits: LIMITS, storageKey: KEY,
    extractVariables: extractVariables, fillVariables: fillVariables,
    tagIdentity: tagIdentity, normalizeTags: normalizeTags, renameTag: renameTag,
    validatePrompt: validatePrompt, parseImport: parseImport, parseDocument: parseDocument,
    normalizeLayout: normalizeLayout, reorder: reorder,
    mergePrompts: mergePrompts, mergeImport: mergeImport, createStore: createStore
  });
});

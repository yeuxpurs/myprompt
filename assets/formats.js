/* Editable workspace formats. Markdown is data, never rendered as HTML.
 * # Category / ## Task / ```prompt bodies; JSON comments retain optional metadata.
 * A quoted JSON heading (for example # "") supports empty or multiline names.
 */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./core.js'));
  else root.MYPROMPT_FORMATS = factory(root.MYPROMPT_CORE);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (core) {
  'use strict';

  var unsafeKeys = new Set(['__proto__', 'prototype', 'constructor']);
  function fail(message, code) {
    var error = new Error(message);
    error.code = code || 'INVALID_DOCUMENT';
    return error;
  }
  function own(value, key) { return Object.prototype.hasOwnProperty.call(value, key); }
  function formatName(format) {
    if (format === undefined) return 'json';
    if (format !== 'json' && format !== 'md') throw fail('Choose JSON or Markdown.', 'INVALID_FORMAT');
    return format;
  }
  function checkSize(text) {
    if (typeof text !== 'string') throw fail('The document must contain text.');
    if (text.length > core.limits.importBytes || new TextEncoder().encode(text).length > core.limits.importBytes) {
      throw fail('The document exceeds 10 MiB.', 'IMPORT_TOO_LARGE');
    }
  }
  function readJSON(text, context) {
    try {
      return JSON.parse(text, function (key, value) {
        if (unsafeKeys.has(key)) throw fail('Unsafe object key: ' + key);
        return value;
      });
    } catch (error) {
      if (error.code) throw error;
      throw fail((context ? context + ': ' : '') + 'Invalid JSON. ' + error.message, 'INVALID_JSON');
    }
  }
  function object(value, label) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw fail(label + ' must be an object.');
    return value;
  }
  function restoreSequence(document, source) {
    if (!own(source, 'promptSequence')) return document;
    var sequence = source.promptSequence;
    if (!Array.isArray(sequence) || sequence.length > core.limits.prompts || sequence.some(function (id) {
      return typeof id !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(id) || unsafeKeys.has(id);
    }) || new Set(sequence).size !== sequence.length) throw fail('promptSequence must contain unique prompt ids.');
    var rank = new Map(sequence.map(function (id, index) { return [id, index]; }));
    document.prompts.sort(function (a, b) {
      return (rank.has(a.id) ? rank.get(a.id) : sequence.length) - (rank.has(b.id) ? rank.get(b.id) : sequence.length);
    });
    return document;
  }
  function hierarchyLayout(document, source) {
    var tree = own(source, 'promptUIData') ? source.promptUIData : own(source, 'data') ? source.data : source;
    if (!tree || !Array.isArray(tree.cats)) return document;
    var categories = [], sections = new Map();
    tree.cats.forEach(function (category) {
      var name = category.name.replace(/\r\n?/g, '\n').trim();
      if (name && !categories.includes(name)) categories.push(name);
      if (!sections.has(name)) sections.set(name, []);
      category.tasks.forEach(function (task) {
        var section = task.name.replace(/\r\n?/g, '\n').trim();
        if (section && !sections.get(name).includes(section)) sections.get(name).push(section);
      });
    });
    var layout = document.layout;
    var allIndex = layout.categoryOrder.indexOf('');
    if (allIndex !== -1) categories.splice(Math.min(allIndex, categories.length), 0, '');
    var rows = layout.tagOrder.filter(function (row) { return row.category === '' || sections.has(row.category); });
    var allSections = new Set();
    sections.forEach(function (names) { names.forEach(function (name) { allSections.add(name); }); });
    rows.forEach(function (row) {
      if (row.category === '') row.tags = row.tags.filter(function (name) { return name.indexOf('tag:') === 0 || allSections.has(name); });
    });
    function arrange(row, names) {
      var next = 0, tags = [];
      row.tags.forEach(function (name) {
        if (name.indexOf('tag:') === 0 && !names.includes(name)) tags.push(name);
        else if (next < names.length) { tags.push(names[next]); next += 1; }
      });
      row.tags = tags.concat(names.slice(next));
    }
    sections.forEach(function (names, category) {
      // The global All row can combine sections from many categories.
      if (!category) return;
      var row = rows.find(function (entry) { return entry.category === category; });
      if (row) arrange(row, names);
      else if (names.length) rows.push({ category: category, tags: names });
    });
    document.layout = core.normalizeLayout({ categoryOrder: categories, tagOrder: rows, promptOrder: layout.promptOrder });
    return document;
  }
  function parseJSON(text) {
    var source = object(readJSON(text), 'Document');
    return restoreSequence(hierarchyLayout(core.parseDocument(text), source), source);
  }
  function lineError(line, message) { return fail('Line ' + line + ': ' + message, 'INVALID_MARKDOWN'); }
  function headingName(text, line) {
    var result = text.trim();
    if (result.charAt(0) === '"') {
      try { result = readJSON(result); }
      catch (error) { throw lineError(line, 'The quoted heading must be a valid JSON string.'); }
      if (typeof result !== 'string') throw lineError(line, 'The heading must contain text.');
    }
    return result;
  }
  function metadata(text, label, line) {
    try { return object(readJSON(text), label); }
    catch (error) { throw lineError(line, error.message); }
  }
  function parseMarkdown(text) {
    var lines = text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').split('\n');
    var cats = [], category = null, task = null, envelope = {}, hasEnvelope = false;
    var taskHasMetadata = false, promptCount = 0;
    for (var i = 0; i < lines.length; i += 1) {
      var line = lines[i], match;
      if (!line.trim()) continue;
      match = /^<!--\s*myprompt:\s*(.*?)\s*-->\s*$/.exec(line);
      if (match) {
        if (hasEnvelope || cats.length) throw lineError(i + 1, 'Use one myprompt metadata comment before the first category.');
        envelope = metadata(match[1], 'Workspace metadata', i + 1);
        if (own(envelope, 'prompts') || own(envelope, 'promptUIData') || own(envelope, 'cats') || own(envelope, 'data')) {
          throw lineError(i + 1, 'Workspace metadata cannot replace the categories or prompt bodies.');
        }
        hasEnvelope = true;
        continue;
      }
      match = /^# (.*)$/.exec(line);
      if (match) {
        if (cats.length >= core.limits.prompts) throw lineError(i + 1, 'Too many categories.');
        category = { name: headingName(match[1], i + 1), tasks: [] };
        cats.push(category);
        task = null;
        continue;
      }
      match = /^## (.*)$/.exec(line);
      if (match) {
        if (!category) throw lineError(i + 1, 'Add a # Category heading before a ## Task heading.');
        if (category.tasks.length >= core.limits.prompts) throw lineError(i + 1, 'Too many tasks.');
        task = { name: headingName(match[1], i + 1), prompts: [] };
        category.tasks.push(task);
        taskHasMetadata = false;
        continue;
      }
      match = /^<!--\s*task:\s*(.*?)\s*-->\s*$/.exec(line);
      if (match) {
        if (!task || taskHasMetadata || task.prompts.length) throw lineError(i + 1, 'Place one task metadata comment immediately after its ## Task heading.');
        var details = metadata(match[1], 'Task metadata', i + 1);
        if (own(details, 'name') || own(details, 'prompts')) throw lineError(i + 1, 'Edit the task heading and prompt fences directly.');
        Object.keys(details).forEach(function (key) { task[key] = details[key]; });
        taskHasMetadata = true;
        continue;
      }
      match = /^(`{3,})prompt[ \t]*$/.exec(line);
      if (match) {
        if (!task) throw lineError(i + 1, 'Add # Category and ## Task headings before a prompt fence.');
        var openingLine = i + 1;
        var closing = new RegExp('^`{' + match[1].length + ',}[ \\t]*$');
        var body = [];
        i += 1;
        while (i < lines.length && !closing.test(lines[i])) { body.push(lines[i]); i += 1; }
        if (i === lines.length) throw lineError(openingLine, 'The prompt fence has no closing fence of at least ' + match[1].length + ' backticks.');
        promptCount += 1;
        if (promptCount > core.limits.prompts) throw lineError(openingLine, 'Use up to ' + core.limits.prompts + ' prompts.');
        task.prompts.push(body.join('\n'));
        continue;
      }
      throw lineError(i + 1, 'Expected # Category, ## Task, a metadata comment, or a ```prompt fence.');
    }
    if (!cats.length && !hasEnvelope) throw lineError(1, 'Add a # Category heading or workspace metadata.');
    var source = Object.assign({}, envelope, { promptUIData: { cats: cats } });
    var result = hierarchyLayout(core.parseDocument(JSON.stringify(source)), source);
    return restoreSequence(result, source);
  }
  function parse(text, format) {
    format = formatName(format);
    checkSize(text);
    var result = format === 'md' ? parseMarkdown(text) : parseJSON(text);
    result.format = format;
    return result;
  }
  function hash(text) {
    var h = 2166136261;
    for (var i = 0; i < text.length; i += 1) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0).toString(36);
  }
  function normalizeState(state) {
    object(state, 'Workspace');
    if (!Array.isArray(state.prompts)) throw fail('Workspace prompts must be an array.');
    return core.parseDocument(JSON.stringify({
      version: 2,
      prompts: state.prompts.filter(function (prompt) { return !prompt || prompt.builtIn !== true; }),
      layout: state.layout,
      favorites: state.favorites,
      language: state.language
    }));
  }
  function hierarchy(state) {
    var cats = [], categories = new Map();
    function addCategory(name) {
      if (!categories.has(name)) {
        var next = { id: 'category-' + hash(name), name: name, tasks: [] };
        categories.set(name, next);
        cats.push(next);
      }
      return categories.get(name);
    }
    state.layout.categoryOrder.forEach(function (name) {
      // The empty categoryOrder entry is the UI's All filter.
      if (name) addCategory(name);
    });
    state.layout.tagOrder.forEach(function (row) { if (row.category) addCategory(row.category); });
    state.prompts.forEach(function (prompt) {
      var category = addCategory(prompt.category);
      var name = prompt.section || '';
      var task = category.tasks.find(function (entry) { return entry.name === name; });
      if (!task) {
        task = { id: 'task-' + hash(JSON.stringify([prompt.category, name])), name: name, prompts: [], promptMeta: [] };
        category.tasks.push(task);
      }
      task.prompts.push(prompt.body);
      var meta = Object.assign({}, prompt);
      delete meta.body;
      delete meta.category;
      task.promptMeta.push(meta);
    });
    state.layout.tagOrder.forEach(function (row) {
      if (!row.category || !categories.has(row.category)) return;
      var category = categories.get(row.category);
      row.tags.forEach(function (name) {
        if (name.indexOf('tag:') === 0 || category.tasks.some(function (task) { return task.name === name; })) return;
        category.tasks.push({ id: 'task-' + hash(JSON.stringify([row.category, name])), name: name, prompts: [], promptMeta: [] });
      });
      var rank = new Map(row.tags.map(function (name, index) { return [name, index]; }));
      category.tasks.sort(function (a, b) {
        return (rank.has(a.name) ? rank.get(a.name) : row.tags.length) - (rank.has(b.name) ? rank.get(b.name) : row.tags.length);
      });
    });
    return cats;
  }
  function heading(value) { return !value || /[\r\n]/.test(value) || value.charAt(0) === '"' ? JSON.stringify(value) : value; }
  function comment(label, value) {
    return '<!-- ' + label + ': ' + JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e') + ' -->';
  }
  function promptFence(body) {
    var fenceLength = 3;
    (body.match(/`+/g) || []).forEach(function (run) { fenceLength = Math.max(fenceLength, run.length + 1); });
    var fence = '`'.repeat(fenceLength);
    return fence + 'prompt\n' + body + '\n' + fence;
  }
  function serialize(state, format) {
    format = formatName(format);
    var normalized = normalizeState(state);
    var source = {
      version: 2,
      language: normalized.language,
      favorites: normalized.favorites,
      layout: normalized.layout,
      promptSequence: normalized.prompts.map(function (prompt) { return prompt.id; }),
      promptUIData: { cats: hierarchy(normalized) }
    };
    var output;
    if (format === 'json') output = JSON.stringify(source, null, 2) + '\n';
    else {
      var envelope = Object.assign({}, source);
      delete envelope.promptUIData;
      var lines = [comment('myprompt', envelope)];
      source.promptUIData.cats.forEach(function (category) {
        lines.push('', '# ' + heading(category.name));
        category.tasks.forEach(function (task) {
          lines.push('', '## ' + heading(task.name));
          lines.push(comment('task', { id: task.id, promptMeta: task.promptMeta }));
          task.prompts.forEach(function (body) { lines.push('', promptFence(body)); });
        });
      });
      output = lines.join('\n') + '\n';
    }
    checkSize(output);
    return output;
  }

  return Object.freeze({ parse: parse, serialize: serialize });
});

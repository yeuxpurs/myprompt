'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../assets/core.js');
const formats = require('../assets/formats.js');
const instant = '2026-09-27T00:00:00.000Z';
const prompt = (overrides = {}) => ({ id: 'p-one', title: 'A title', description: 'A description', body: 'A body', category: 'Writing', tags: ['second', 'first'], createdAt: instant, updatedAt: instant, ...overrides });
const state = (overrides = {}) => ({ version: 2, prompts: [], favorites: [], language: 'ko', layout: { categoryOrder: [], tagOrder: [], promptOrder: [] }, ...overrides });
const content = document => ({ prompts: document.prompts, layout: document.layout, favorites: document.favorites, language: document.language });

test('all original JSON wrappers accept legacy string prompts and preserve empty categories/tasks', () => {
  const legacy = { cats: [
    { id: 'work', name: '글쓰기', tasks: [{ id: 'email', name: '이메일', prompts: ['One {{독자}}', 'Two'] }, { name: '나중에', prompts: [] }] },
    { name: '빈 분류', tasks: [] }
  ] };
  for (const source of [legacy, { data: legacy }, { promptUIData: legacy }]) {
    const result = formats.parse(JSON.stringify(source));
    assert.deepEqual(result.prompts.map(item => item.body), ['One {{독자}}', 'Two']);
    assert.equal(result.prompts[0].section, '이메일');
    assert.deepEqual(result.layout.categoryOrder, ['글쓰기', '빈 분류']);
    assert.deepEqual(result.layout.tagOrder[0].tags, ['이메일', '나중에']);
    assert.equal(result.format, 'json');
  }
});

test('current v2 backup remains accepted without losing personal fields or layout', () => {
  const input = state({ prompts: [prompt()], favorites: ['p-one', 'starter-brief'], layout: { categoryOrder: ['Writing', '', 'Code'], tagOrder: [{ category: 'Writing', tags: ['tag:second', 'tag:first'] }], promptOrder: ['p-one'] } });
  assert.deepEqual(content(formats.parse(JSON.stringify(input))), content(core.parseDocument(JSON.stringify(input))));
});

test('JSON and Markdown retain all fields, order, original task sections, and literal code bodies', () => {
  const input = state({
    prompts: [
      prompt({ id: 'p-two', category: 'Code', title: 'Another title', section: 'Tools', body: '# not a category\n## not a task\n```js\nconst example = `literal`;\n```\n`````\n<script>alert("literal")</script>\n<!-- myprompt: {} -->', variables: ['b', 'a'], variableOrder: ['a', 'b'] }),
      prompt({ id: 'p-one', section: 'Review', title: 'My edited title' }),
      prompt({ id: 'p-three', section: 'Review', title: 'Different title', description: 'A --> comment < boundary', body: 'Other version', tags: ['c', 'b'] }),
      prompt({ id: 'p-flat', body: 'No section field', tags: [] })
    ],
    favorites: ['p-three', 'starter-brief', 'p-two'],
    layout: { categoryOrder: ['Writing', '', 'Code', 'Empty'], tagOrder: [{ category: 'Writing', tags: ['tag:first', 'Review', 'tag:second', 'Later'] }, { category: 'Code', tags: ['Tools'] }], promptOrder: ['p-three', 'p-one', 'p-two', 'p-flat'] }
  });
  for (const format of ['json', 'md']) {
    const output = formats.serialize(input, format);
    const parsed = formats.parse(output, format);
    assert.deepEqual(content(parsed), content(core.parseDocument(JSON.stringify(input))), format);
    assert.equal(parsed.format, format);
    assert.deepEqual(content(formats.parse(formats.serialize(parsed, format), format)), content(parsed));
    if (format === 'md') assert.match(output, /``````prompt/);
    else assert.equal(JSON.parse(output).promptUIData.cats[0].tasks[0].name, 'Review');
  }
});

test('simple Markdown supports several bodies per task and headings inside fences stay literal', () => {
  const source = '# 글쓰기\n## 메일\n```prompt\n본문 {{독자}}\n# literal heading\n## literal task\n```\n\n```prompt\n두 번째 본문\n```\n## 나중에\n# 빈 분류\n';
  const parsed = formats.parse(source, 'md');
  assert.deepEqual(parsed.prompts.map(item => item.title), ['메일 · 1', '메일 · 2']);
  assert.equal(parsed.prompts[0].body, '본문 {{독자}}\n# literal heading\n## literal task');
  assert.deepEqual(parsed.layout.categoryOrder, ['글쓰기', '빈 분류']);
  assert.deepEqual(parsed.layout.tagOrder[0].tags, ['메일', '나중에']);
});

test('dragged category and task order becomes editable hierarchy order in both formats', () => {
  const input = state({ prompts: [prompt({ section: 'First' }), prompt({ id: 'p-two', section: 'Second' }), prompt({ id: 'p-three', category: 'Code', section: 'Tools' })], layout: { categoryOrder: ['Code', '', 'Writing'], tagOrder: [{ category: 'Writing', tags: ['tag:a', 'Second', 'tag:b', 'First', 'Empty task'] }], promptOrder: [] } });
  const json = JSON.parse(formats.serialize(input));
  assert.deepEqual(json.promptUIData.cats.map(item => item.name), ['Code', 'Writing']);
  assert.deepEqual(json.promptUIData.cats[1].tasks.map(item => item.name), ['Second', 'First', 'Empty task']);
  assert.equal(json.promptUIData.cats[1].tasks.some(item => item.name === 'tag:a'), false);
  const markdown = formats.serialize(input, 'md');
  assert.ok(markdown.indexOf('# Code') < markdown.indexOf('# Writing'));
  assert.ok(markdown.indexOf('## Second') < markdown.indexOf('## First'));
});

test('edited hierarchy reorders categories and sections despite stale JSON layout metadata', () => {
  const input = state({ prompts: [prompt({ section: 'First' }), prompt({ id: 'p-two', section: 'Second' }), prompt({ id: 'p-three', category: 'Code', section: 'Tools' })], layout: { categoryOrder: ['Writing', '', 'Code'], tagOrder: [{ category: 'Writing', tags: ['tag:a', 'First', 'tag:b', 'Second'] }], promptOrder: [] } });
  const source = JSON.parse(formats.serialize(input));
  source.promptUIData.cats.reverse();
  source.promptUIData.cats[1].tasks.reverse();
  const edited = formats.parse(JSON.stringify(source));
  assert.deepEqual(edited.layout.categoryOrder, ['Code', '', 'Writing']);
  assert.deepEqual(edited.layout.tagOrder.find(row => row.category === 'Writing').tags, ['tag:a', 'Second', 'tag:b', 'First']);
});

test('moving Markdown headings controls hierarchy order with stale metadata retained', () => {
  const source = '<!-- myprompt: {"layout":{"categoryOrder":["Writing","","Code"],"tagOrder":[{"category":"Writing","tags":["tag:a","First","tag:b","Second"]}],"promptOrder":[]}} -->\n# Code\n## Tools\n```prompt\nTool\n```\n# Writing\n## Second\n```prompt\nSecond\n```\n## First\n```prompt\nFirst\n```';
  const parsed = formats.parse(source, 'md');
  assert.deepEqual(parsed.layout.categoryOrder, ['Code', '', 'Writing']);
  assert.deepEqual(parsed.layout.tagOrder.find(row => row.category === 'Writing').tags, ['tag:a', 'Second', 'tag:b', 'First']);
});

test('edited hierarchy names and bodies override stale prompt metadata', () => {
  const source = JSON.parse(formats.serialize(state({ prompts: [prompt({ section: 'Old task' })] })));
  source.promptUIData.cats[0].name = 'New category';
  source.promptUIData.cats[0].tasks[0].name = 'New task';
  source.promptUIData.cats[0].tasks[0].prompts[0] = 'New body';
  const parsed = formats.parse(JSON.stringify(source));
  assert.equal(parsed.prompts[0].id, 'p-one');
  assert.equal(parsed.prompts[0].category, 'New category');
  assert.equal(parsed.prompts[0].section, 'New task');
  assert.equal(parsed.prompts[0].title, 'New task');
  assert.equal(parsed.prompts[0].body, 'New body');
  assert.deepEqual(parsed.layout.categoryOrder, ['New category']);
});

test('empty library, uncategorized records, and quoted multiline names survive Markdown', () => {
  const empty = formats.parse(formats.serialize(state(), 'md'), 'md');
  assert.deepEqual(empty.prompts, []);
  assert.deepEqual(empty.layout.categoryOrder, []);
  const input = state({ prompts: [prompt({ category: '', title: 'Free title' }), prompt({ id: 'p-quoted', category: '"Quoted category', section: 'Line one\nLine two' })] });
  const parsed = formats.parse(formats.serialize(input, 'md'), 'md');
  assert.deepEqual(parsed.prompts, input.prompts);
  assert.equal(Object.hasOwn(parsed.prompts[0], 'section'), false);
});

test('export never copies built-in catalog prompts into the personal library', () => {
  const input = state({ prompts: [prompt(), prompt({ id: 'starter-brief', builtIn: true })], favorites: ['starter-brief'] });
  const parsed = formats.parse(formats.serialize(input));
  assert.deepEqual(parsed.prompts.map(item => item.id), ['p-one']);
  assert.deepEqual(parsed.favorites, ['starter-brief']);
});

test('invalid Markdown reports line numbers and fails instead of partially accepting it', () => {
  const invalid = [
    '', '## Missing category', '# Category\n```prompt\nMissing task\n```',
    '# Category\n## Task\n```prompt\nUnclosed', '# Category\n## Task\n```javascript\nNo prompt fence\n```',
    '# Category\n## Task\n```prompt\nValid body\n```\nUnexpected text',
    '# "unterminated', '<!-- myprompt: {broken} -->',
    '# Category\n## Task\n<!-- task: {"prompts":["overwrite"]} -->',
    '# Category\n## Task\n<!-- task: {"__proto__":{}} -->',
    '<!-- myprompt: {"promptUIData":{"cats":[]}} -->',
    '<!-- myprompt: {} -->\n<!-- myprompt: {} -->'
  ];
  for (const source of invalid) assert.throws(() => formats.parse(source, 'md'), error => error.code === 'INVALID_MARKDOWN' && /^Line \d+:/.test(error.message), source);
});

test('invalid documents, unsafe keys, unsupported formats, and more than 5000 prompts are rejected', () => {
  for (const source of ['{broken', 'null', '[]', '{"cats":[] ,"extra":{"constructor":{}}}', '{"cats":[{"name":"OK","tasks":[{"name":"Task","prompts":["Valid",null]}]}]}']) {
    assert.throws(() => formats.parse(source));
  }
  assert.throws(() => formats.parse('{}', 'yaml'), { code: 'INVALID_FORMAT' });
  assert.throws(() => formats.parse(JSON.stringify({ cats: [{ name: 'Many', tasks: [{ name: 'Task', prompts: Array(5001).fill('Body') }] }] })));
  assert.equal({}.polluted, undefined);
});

test('10 MiB limit counts UTF-8 bytes, not only JavaScript character length', () => {
  assert.throws(() => formats.parse('한'.repeat(Math.ceil(core.limits.importBytes / 3)), 'md'), { code: 'IMPORT_TOO_LARGE' });
});

import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import vm from 'node:vm';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const htmlFiles = ['index.html', 'offline.html', ...readdirSync(join(root, 'app')).filter(name => name.endsWith('.html')).map(name => `app/${name}`)];
const standalone = ['sw.js', ...readdirSync(join(root, 'assets')).filter(name => name.endsWith('.js')).map(name => `assets/${name}`)];
let checked = 0;
const failures = [];
for (const name of standalone) {
  try { new vm.Script(readFileSync(join(root, name), 'utf8'), { filename: name }); checked++; }
  catch (error) { failures.push(`${name}: ${error.message}`); }
}
for (const name of htmlFiles) {
  let count = 0;
  for (const match of readFileSync(join(root, name), 'utf8').matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    count++;
    if (/\bsrc\s*=/.test(match[1]) || !match[2].trim() || /\btype\s*=\s*["'](?:application\/ld\+json|application\/json)/i.test(match[1])) continue;
    try { new vm.Script(match[2], { filename: `${name}#inline-${count}` }); checked++; }
    catch (error) { failures.push(`${name} inline ${count}: ${error.message}`); }
  }
}
for (const directory of ['server', 'tools']) {
  for (const name of readdirSync(join(root, directory)).filter(name => name.endsWith('.mjs'))) {
    const file = join(root, directory, name);
    const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
    if (result.status !== 0) failures.push(`${relative(root, file)}: ${result.stderr || result.error?.message}`);
    else checked++;
  }
}
console.log(`JavaScript syntax: ${checked} scripts checked, ${failures.length} errors`);
for (const failure of failures) console.error(` - ${failure}`);
if (failures.length) process.exitCode = 1;

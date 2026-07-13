import {readFileSync, readdirSync} from 'node:fs';
import {join, relative, resolve} from 'node:path';
import vm from 'node:vm';

const root = resolve(new URL('..', import.meta.url).pathname);
const htmlFiles = [join(root, 'index.html'), ...readdirSync(join(root, 'app'))
  .filter(name => name.endsWith('.html'))
  .sort()
  .map(name => join(root, 'app', name))];

let scriptsChecked = 0;
const failures = [];
const scriptPattern = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;

for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf8');
  let match;
  let index = 0;
  while ((match = scriptPattern.exec(html))) {
    index += 1;
    const attrs = match[1] || '';
    const source = match[2] || '';
    if (/\bsrc\s*=/.test(attrs) || !source.trim()) continue;
    try {
      new vm.Script(source, {filename: `${relative(root, file)}#inline-${index}`});
      scriptsChecked += 1;
    } catch (error) {
      failures.push(`${relative(root, file)} inline script ${index}: ${error.message}`);
    }
  }
}

console.log(`Inline JavaScript checked: ${scriptsChecked}`);
if (failures.length) {
  console.error(`Inline JavaScript errors: ${failures.length}`);
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}
console.log('Inline JavaScript errors: 0');

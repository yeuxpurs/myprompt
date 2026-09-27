"""Dependency-free path and deployment checks; run from any working directory."""
from __future__ import annotations

from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import json
import re
import sys

ROOT = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path(__file__).resolve().parents[1]
errors: list[str] = []
checks = 0
required = ['index.html', 'offline.html', 'manifest.webmanifest', 'sw.js', '.nojekyll',
            'assets/core.js', 'assets/i18n.js', 'assets/prompts.js', 'assets/app.js',
            'assets/app.css', 'assets/favicon.svg', 'server/serve.mjs']
routes = {'home', 'library', 'studio', 'workflows', 'guide', 'favorites', 'my', 'main-content'}


def check_reference(source: Path, raw: str) -> None:
    global checks
    raw = raw.strip()
    if not raw or '${' in raw:
        return
    parsed = urlsplit(raw)
    if parsed.scheme or parsed.netloc:
        return
    checks += 1
    target = (source.parent / unquote(parsed.path)).resolve() if parsed.path else source
    if not target.is_relative_to(ROOT):
        errors.append(f'{source.relative_to(ROOT)}: path escapes root: {raw}')
    elif not target.exists():
        errors.append(f'{source.relative_to(ROOT)}: missing local reference: {raw}')
    if target.name == 'index.html' and parsed.fragment and parsed.fragment.split('?')[0] not in routes:
        errors.append(f'{source.relative_to(ROOT)}: unknown application route: {raw}')


class References(HTMLParser):
    def __init__(self, file: Path):
        super().__init__()
        self.file = file

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        for name in ['src', 'href']:
            if values.get(name):
                check_reference(self.file, values[name])
        if tag == 'meta' and values.get('http-equiv', '').lower() == 'refresh':
            match = re.search(r'url\s*=\s*(.+)', values.get('content', ''), re.I)
            if match:
                check_reference(self.file, match.group(1).strip('"\''))


for name in required:
    checks += 1
    if not (ROOT / name).is_file():
        errors.append(f'missing required file: {name}')
htmls = [ROOT / 'index.html', ROOT / 'offline.html', *sorted((ROOT / 'app').glob('*.html'))]
for file in htmls:
    if file.exists():
        References(file).feed(file.read_text(encoding='utf-8'))

manifest = ROOT / 'manifest.webmanifest'
if manifest.exists():
    try:
        data = json.loads(manifest.read_text(encoding='utf-8'))
        for name in ['start_url', 'scope']:
            check_reference(manifest, data[name])
        for icon in data['icons']:
            check_reference(manifest, icon['src'])
    except (ValueError, KeyError, TypeError) as error:
        errors.append(f'invalid web manifest: {error}')

worker = ROOT / 'sw.js'
if worker.exists():
    source = worker.read_text(encoding='utf-8')
    match = re.search(r'const PRECACHE = \[([\s\S]*?)\]\.map', source)
    if not match:
        errors.append('service worker precache list is missing')
    else:
        for reference in re.findall(r"['\"]([^'\"]+)['\"]", match.group(1)):
            check_reference(worker, reference)

print(f'Static files: {len(htmls)} HTML pages, {checks} path checks, {len(errors)} errors')
for error in errors:
    print(' -', error)
sys.exit(bool(errors))

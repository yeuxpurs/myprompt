from __future__ import annotations

from pathlib import Path
from urllib.parse import unquote, urlsplit
import re
import sys

DEFAULT_ROOT = Path(__file__).resolve().parents[1]
ROOT = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else DEFAULT_ROOT
APP_DIR = ROOT / "app"
HTMLS = [ROOT / "index.html", *sorted(APP_DIR.glob("*.html"))]
errors: list[str] = []
checked = 0


def fail(message: str) -> None:
    errors.append(message)


ATTR_RE = re.compile(r'''(?:href|src)\s*=\s*["']([^"']+)["']''', re.I)
for html in HTMLS:
    if not html.exists():
        fail(f"missing HTML: {html.relative_to(ROOT)}")
        continue
    text = html.read_text(encoding="utf-8")
    for raw in ATTR_RE.findall(text):
        raw = raw.strip()
        if not raw or "${" in raw or raw.startswith(("#", "data:", "javascript:", "mailto:", "tel:")):
            continue
        parsed = urlsplit(raw)
        if parsed.scheme or parsed.netloc:
            continue
        path = unquote(parsed.path)
        if not path:
            continue
        target = (html.parent / path).resolve()
        checked += 1
        try:
            target.relative_to(ROOT)
        except ValueError:
            fail(f"{html.relative_to(ROOT)} -> path escapes repository root: {raw}")
            continue
        if not target.exists():
            fail(f"{html.relative_to(ROOT)} -> missing local reference: {raw}")

expected_apps = [
    "prompt-template-generator.html",
    "prompt_lib.html",
    "azure_openai_guide.html",
    "copilot-guide.html",
    "cot-prompt-generator.html",
    "cot-prompt-generator-rag-train.html",
    "prompt-refinement-agent.html",
    "ai-inspection-agent.html",
]
index = (ROOT / "index.html").read_text(encoding="utf-8") if (ROOT / "index.html").exists() else ""
metadata_apps = re.findall(r"file:'([^']+\.html)'", index)
checked += len(expected_apps)
if metadata_apps != expected_apps:
    fail(f"index app order mismatch: expected {expected_apps}, found {metadata_apps}")
for name in expected_apps:
    if not (APP_DIR / name).exists():
        fail(f"missing app page: app/{name}")

for html in sorted(APP_DIR.glob("*.html")):
    checked += 1
    if 'href="../index.html"' not in html.read_text(encoding="utf-8"):
        fail(f"{html.relative_to(ROOT)} -> missing ../index.html home link")

required = [
    ROOT / "index.html",
    ROOT / "config.js",
    ROOT / "manifest.webmanifest",
    ROOT / "sw.js",
    ROOT / ".nojekyll",
    ROOT / ".github/workflows/pages.yml",
    ROOT / "assets/runtime.js",
    ROOT / "assets/favicon.svg",
    ROOT / "tools/check-inline-js.mjs",
    ROOT / "tools/smoke-index.mjs",
]
for target in required:
    checked += 1
    if not target.exists():
        fail(f"missing required file: {target.relative_to(ROOT)}")

runtime_path = ROOT / "assets/runtime.js"
if runtime_path.exists():
    runtime = runtime_path.read_text(encoding="utf-8")
    for contract in ["window.JKE_RUNTIME", "window.JKE_STORAGE", "label: environment.label", "getGatewayBase"]:
        checked += 1
        if contract not in runtime:
            fail(f"assets/runtime.js -> missing compatibility contract: {contract}")

workflow_dir = ROOT / ".github/workflows"
workflow_text = "\n".join(
    file.read_text(encoding="utf-8")
    for file in sorted(workflow_dir.glob("*.y*ml"))
)
expected_actions = [
    "actions/checkout@v7",
    "actions/configure-pages@v6",
    "actions/upload-pages-artifact@v5",
    "actions/deploy-pages@v5",
]
for action in expected_actions:
    checked += 1
    if action not in workflow_text:
        fail(f"workflow -> expected current Node.js 24 action is missing: {action}")

obsolete_action_patterns = [
    r"actions/checkout@v[1-4](?:\b|$)",
    r"actions/configure-pages@v[1-5](?:\b|$)",
    r"actions/upload-pages-artifact@v[1-4](?:\b|$)",
    r"actions/upload-artifact@v[1-5](?:\b|$)",
    r"actions/deploy-pages@v[1-4](?:\b|$)",
]
for pattern in obsolete_action_patterns:
    checked += 1
    match = re.search(pattern, workflow_text)
    if match:
        fail(f"workflow -> obsolete action remains: {match.group(0)}")

secret_patterns = {
    "NVIDIA": re.compile(r"nvapi-[A-Za-z0-9_-]{24,}"),
    "OpenAI": re.compile(r"sk-[A-Za-z0-9_-]{24,}"),
    "Google": re.compile(r"AIza[0-9A-Za-z_-]{30,}"),
}
scan_files = [ROOT / "index.html", ROOT / "config.js", *sorted(APP_DIR.glob("*.html")), *sorted((ROOT / "assets").glob("*.js"))]
for file in scan_files:
    if not file.exists():
        continue
    text = file.read_text(encoding="utf-8", errors="ignore")
    for label, pattern in secret_patterns.items():
        checked += 1
        if pattern.search(text):
            fail(f"{file.relative_to(ROOT)} -> possible {label} secret detected")

print(f"HTML pages: {len(HTMLS)}")
print(f"Checks performed: {checked}")
print(f"Errors: {len(errors)}")
for error in errors:
    print(" -", error)
sys.exit(1 if errors else 0)

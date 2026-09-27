#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"

if command -v node >/dev/null 2>&1; then
  exec node server/serve.mjs
fi
if command -v python3 >/dev/null 2>&1; then
  echo "myprompt: http://127.0.0.1:8787/ (Python static server)"
  exec python3 -m http.server 8787 --bind 127.0.0.1
fi
if command -v python >/dev/null 2>&1; then
  echo "myprompt: http://127.0.0.1:8787/ (Python static server)"
  exec python -m http.server 8787 --bind 127.0.0.1
fi
echo "Install Node.js or Python to start a local server, or open index.html directly." >&2
exit 1

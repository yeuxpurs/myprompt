#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"

if command -v node >/dev/null 2>&1; then
  export SERVE_STATIC=1
  export HOST="${HOST:-127.0.0.1}"
  export PORT="${PORT:-8787}"
  echo "JKE AI Toolkit + Gateway: http://${HOST}:${PORT}/"
  echo "API keys are optional. Without keys, LOCAL/DEMO functions still work."
  exec node server/ai-gateway.mjs
fi

if command -v python3 >/dev/null 2>&1; then
  echo "Node.js was not found. Starting static-only mode at http://127.0.0.1:8000/"
  exec python3 -m http.server 8000 --bind 127.0.0.1
fi

if command -v python >/dev/null 2>&1; then
  echo "Node.js was not found. Starting static-only mode at http://127.0.0.1:8000/"
  exec python -m http.server 8000 --bind 127.0.0.1
fi

echo "Node.js or Python is required. You can still open index.html directly." >&2
exit 1

@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if %errorlevel%==0 (
  set "SERVE_STATIC=1"
  if "%HOST%"=="" set "HOST=127.0.0.1"
  if "%PORT%"=="" set "PORT=8787"
  echo JKE AI Toolkit + Gateway: http://%HOST%:%PORT%/
  echo API keys are optional. Without keys, LOCAL/DEMO functions still work.
  node server\ai-gateway.mjs
  exit /b %errorlevel%
)

echo Node.js was not found. Starting static-only mode at http://127.0.0.1:8000/
where py >nul 2>nul
if %errorlevel%==0 (
  py -m http.server 8000 --bind 127.0.0.1
  exit /b %errorlevel%
)
where python >nul 2>nul
if %errorlevel%==0 (
  python -m http.server 8000 --bind 127.0.0.1
  exit /b %errorlevel%
)

echo Node.js or Python is required. You can still double-click index.html.
exit /b 1

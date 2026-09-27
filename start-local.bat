@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if not errorlevel 1 goto node_server
where py >nul 2>nul
if not errorlevel 1 goto py_server
where python >nul 2>nul
if not errorlevel 1 goto python_server
echo Install Node.js or Python to start a local server, or open index.html directly.
exit /b 1

:node_server
node server\serve.mjs
exit /b %errorlevel%

:py_server
echo myprompt: http://127.0.0.1:8787/ (Python static server)
py -3 -m http.server 8787 --bind 127.0.0.1
exit /b %errorlevel%

:python_server
echo myprompt: http://127.0.0.1:8787/ (Python static server)
python -m http.server 8787 --bind 127.0.0.1
exit /b %errorlevel%

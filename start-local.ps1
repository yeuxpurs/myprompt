$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
if (Get-Command node -ErrorAction SilentlyContinue) {
    node server/serve.mjs
    exit $LASTEXITCODE
}
Write-Host 'myprompt: http://127.0.0.1:8787/ (Python static server)'
if (Get-Command py -ErrorAction SilentlyContinue) {
    py -3 -m http.server 8787 --bind 127.0.0.1
    exit $LASTEXITCODE
} elseif (Get-Command python -ErrorAction SilentlyContinue) {
    python -m http.server 8787 --bind 127.0.0.1
    exit $LASTEXITCODE
} else {
    Write-Error 'Install Node.js or Python to start a local server, or open index.html directly.'
    exit 1
}

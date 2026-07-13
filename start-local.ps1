Set-Location $PSScriptRoot

if (Get-Command node -ErrorAction SilentlyContinue) {
    $env:SERVE_STATIC = "1"
    if (-not $env:HOST) { $env:HOST = "127.0.0.1" }
    if (-not $env:PORT) { $env:PORT = "8787" }
    Write-Host "JKE AI Toolkit + Gateway: http://$($env:HOST):$($env:PORT)/"
    Write-Host "API keys are optional. Without keys, LOCAL/DEMO functions still work."
    node server/ai-gateway.mjs
    exit $LASTEXITCODE
}

Write-Host "Node.js was not found. Starting static-only mode at http://127.0.0.1:8000/"
if (Get-Command py -ErrorAction SilentlyContinue) {
    py -m http.server 8000 --bind 127.0.0.1
} elseif (Get-Command python -ErrorAction SilentlyContinue) {
    python -m http.server 8000 --bind 127.0.0.1
} else {
    Write-Error "Node.js or Python is required to start a local HTTP server. You can still double-click index.html."
    exit 1
}

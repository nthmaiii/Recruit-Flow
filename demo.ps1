# ============================================================
# RecruitFlow – Demo Script
# Gộp frontend vào backend, chạy 1 server, expose qua ngrok
# Chạy: .\demo.ps1
# ============================================================

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$frontendDir = "$root\frontend"
$backendDir  = "$root\backend"  # src (edit here)
$mirrorBackend = "D:\zipai_mirror\recruitflow\backend"  # running server

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  RecruitFlow - Build Demo" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# 1. Build frontend (VITE_API_URL rỗng = dùng URL tương đối)
Write-Host "[1/3] Building frontend..." -ForegroundColor Yellow
Set-Location $frontendDir

# Xóa VITE_API_URL nếu có trong .env.local để dùng relative URL
if (Test-Path ".env.local") {
    (Get-Content ".env.local") | Where-Object { $_ -notmatch "^VITE_API_URL" } | Set-Content ".env.local"
}

npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "Build failed!" -ForegroundColor Red; exit 1 }
Write-Host "  Frontend built OK" -ForegroundColor Green

# 2. Copy dist/ vào backend/public/
Write-Host "[2/3] Copying to backend public folder..." -ForegroundColor Yellow
$distDir = "$frontendDir\dist"

# Copy sang mirror (server đang chạy)
Get-ChildItem -Path $distDir | ForEach-Object {
    Copy-Item $_.FullName "$mirrorBackend\public\$($_.Name)" -Recurse -Force
}
Write-Host "  Copied to $mirrorBackend\public\" -ForegroundColor Green

# 3. Clear cache Laravel
Write-Host "[3/3] Clearing Laravel cache..." -ForegroundColor Yellow
Set-Location $mirrorBackend
php artisan config:clear 2>$null
php artisan route:clear 2>$null
php artisan view:clear 2>$null
Write-Host "  Cache cleared" -ForegroundColor Green

Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "  DONE! App ready to run" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "Tiep theo, mo 2 cua so PowerShell:" -ForegroundColor White
Write-Host ""
Write-Host "  Cua so 1 - Chay backend:" -ForegroundColor Cyan
Write-Host "    cd D:\zipai_mirror\recruitflow\backend" -ForegroundColor Gray
Write-Host "    php artisan serve --host=0.0.0.0 --port=8000" -ForegroundColor Gray
Write-Host ""
Write-Host "  Cua so 2 - Tao link public (ngrok):" -ForegroundColor Cyan
Write-Host "    ngrok http 8000" -ForegroundColor Gray
Write-Host ""
Write-Host "  Copy link https://xxx.ngrok-free.app va chia se!" -ForegroundColor Yellow
Write-Host ""

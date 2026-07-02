# EuroStore Complete Launch Script
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "🚀 Launching EuroStore Ecosystem 🚀" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow

# Step 1: Install dependencies if missing
Write-Host "[1/3] Checking dependencies..." -ForegroundColor Cyan
pnpm install

# Step 2: Start Supabase/Docker (If applicable in local dev)
Write-Host "[2/3] Ensure your Supabase backend is running or remote is accessible." -ForegroundColor Cyan

# Step 3: Run Turbo dev
Write-Host "[3/3] Starting Web, Admin, and Helper services..." -ForegroundColor Green
pnpm dev

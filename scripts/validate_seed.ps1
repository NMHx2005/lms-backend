# LMS Seed Data Validation PowerShell Script
Write-Host "🔍 Starting LMS Seed Data Validation..." -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
    } else {
        throw "Node.js not found"
    }
} catch {
    Write-Host "❌ Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if npm is installed
try {
    $npmVersion = npm --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ npm version: $npmVersion" -ForegroundColor Green
    } else {
        throw "npm not found"
    }
} catch {
    Write-Host "❌ npm is not installed or not in PATH" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  .env file not found. Creating default .env..." -ForegroundColor Yellow
    @"
MONGODB_URI=mongodb://localhost:27017/lms
NODE_ENV=development
"@ | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host "✅ Created default .env file" -ForegroundColor Green
    Write-Host ""
}

Write-Host "🔍 Running seed data validation..." -ForegroundColor Cyan
Write-Host ""

# Run the validation script
try {
    npm run validate
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "🎉 Validation completed successfully!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "❌ Validation failed with error code $LASTEXITCODE" -ForegroundColor Red
    }
} catch {
    Write-Host ""
    Write-Host "❌ Error running validation script: $_" -ForegroundColor Red
}

Write-Host ""
Read-Host "Press Enter to exit"

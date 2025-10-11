Write-Host "Checking course status in database..." -ForegroundColor Green
Set-Location $PSScriptRoot
Set-Location ..
node scripts/check-course-status.js
Read-Host "Press Enter to continue"

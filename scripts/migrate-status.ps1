#!/usr/bin/env pwsh

Write-Host "===================================" -ForegroundColor Cyan
Write-Host "Course Status Migration Script" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This will update courses without status field" -ForegroundColor Yellow
Write-Host "Press Ctrl+C to cancel..." -ForegroundColor Yellow
Write-Host ""
Read-Host "Press Enter to continue"

Write-Host "Running migration..." -ForegroundColor Green
node scripts/migrate-course-status.js

Write-Host ""
Write-Host "===================================" -ForegroundColor Cyan
Write-Host "Migration completed!" -ForegroundColor Green
Write-Host "===================================" -ForegroundColor Cyan
Read-Host "Press Enter to exit"

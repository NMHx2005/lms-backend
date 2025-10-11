@echo off
echo ===================================
echo Course Status Migration Script
echo ===================================
echo.
echo This will update courses without status field
echo Press Ctrl+C to cancel, or
pause

node scripts/migrate-course-status.js

echo.
echo ===================================
echo Migration completed!
echo ===================================
pause

@echo off
echo ========================================
echo Sync Course TotalStudents Script
echo ========================================
echo.

cd /d "%~dp0.."
node scripts/sync-course-totalstudents.js

echo.
echo ========================================
echo Script completed!
echo ========================================
pause


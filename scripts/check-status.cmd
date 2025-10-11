@echo off
echo Checking course status in database...
cd /d "%~dp0.."
node scripts/check-course-status.js
pause

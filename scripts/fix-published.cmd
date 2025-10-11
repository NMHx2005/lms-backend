@echo off
echo Fixing published courses...
cd /d "%~dp0.."
node scripts/fix-published-courses.js
pause

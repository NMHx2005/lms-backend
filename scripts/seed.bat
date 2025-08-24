@echo off
echo 🚀 Starting LMS Database Seeding...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed or not in PATH
    pause
    exit /b 1
)

echo ✅ Node.js and npm are available
echo.

REM Check if .env file exists
if not exist ".env" (
    echo ⚠️  .env file not found. Creating default .env...
    echo MONGODB_URI=mongodb://localhost:27017/lms > .env
    echo NODE_ENV=development >> .env
    echo.
)

echo 🔧 Running database seed...
echo.

REM Run the seed script
npm run seed

echo.
if %errorlevel% equ 0 (
    echo 🎉 Seeding completed successfully!
) else (
    echo ❌ Seeding failed with error code %errorlevel%
)

echo.
pause

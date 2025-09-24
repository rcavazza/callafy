@echo off
echo Initializing Database...
echo.
echo Changing to backend directory...
cd /d "%~dp0backend"
if not exist "package.json" (
    echo Error: package.json not found in backend directory
    echo Make sure you are running this script from the project root
    pause
    exit /b 1
)
echo Running database seeder...
node seeders/seed.js
echo.
echo Database initialized successfully!
pause
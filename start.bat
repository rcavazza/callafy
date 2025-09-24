@echo off
echo Starting Inventario Backend Server...
echo.
echo Changing to backend directory...
cd /d "%~dp0backend"
if not exist "package.json" (
    echo Error: package.json not found in backend directory
    echo Make sure you are running this script from the project root
    pause
    exit /b 1
)
echo Starting server with npm run dev...
npm run dev
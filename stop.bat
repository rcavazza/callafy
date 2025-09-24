@echo off
echo Stopping Inventario Backend Server...
echo.
echo Searching for Node.js processes...
for /f "tokens=2" %%i in ('tasklist /fi "imagename eq node.exe" /fo table /nh') do (
    echo Terminating process ID: %%i
    taskkill /pid %%i /f >nul 2>&1
)
echo.
echo Server stopped successfully.
pause
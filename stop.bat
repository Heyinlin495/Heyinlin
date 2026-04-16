@echo off
chcp 65001 >nul 2>&1
cd /d "%~dp0"

echo =========================================
echo   Stopping Personal Space Project
echo =========================================
echo.

rem Kill the window by title
taskkill /FI "WINDOWTITLE eq personal-space-dev*" /T /F 2>nul

if not errorlevel 1 (
    echo [DONE] Dev server stopped.
) else (
    echo [INFO] No running dev server found.
)

rem Clean up PID file
if exist ".dev.pid" del /f /q ".dev.pid" >nul 2>&1

echo =========================================
echo.
pause

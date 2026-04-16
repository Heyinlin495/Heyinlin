@echo off
chcp 65001 >nul 2>&1
cd /d "%~dp0"
set PID_FILE=%~dp0.dev.pid

echo =========================================
echo   Starting Personal Space Project
echo =========================================
echo.

rem Check if already running
if exist "%PID_FILE%" (
    for /f %%P in (%PID_FILE%) do (
        tasklist /FI "PID eq %%P" 2>nul | find "%%P" >nul
        if not errorlevel 1 (
            echo [WARN] Dev server already running ^(PID: %%P^)
            echo   Run stop.bat first, or restart with: stop.bat ^&^& start.bat
            pause
            exit /b 1
        )
    )
    del /f /q "%PID_FILE%" >nul 2>&1
)

rem Check and install dependencies
if not exist "node_modules" (
    echo [INFO] Installing root dependencies...
    call npm install
)

if not exist "frontend\node_modules" (
    echo [INFO] Installing frontend dependencies...
    cd frontend && call npm install && cd ..
)

if not exist "backend\node_modules" (
    echo [INFO] Installing backend dependencies...
    cd backend && call npm install && cd ..
)

echo.
echo [INFO] Starting backend and frontend...
echo   Backend  -^> http://localhost:3000
echo   Frontend -^> http://localhost:5173
echo.

rem Run concurrently in background
start "personal-space-dev" cmd /k "npm run dev"

echo [INFO] Dev server started in a new window.
echo   To stop: double-click stop.bat
echo.
pause

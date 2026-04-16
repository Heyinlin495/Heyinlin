@echo off
echo ========================================
echo   Personal Space - Database Manager
echo ========================================
echo.
echo [1] Reset database (clear all data)
echo [2] Seed only (skip if data exists)
echo.
set /p choice=Choose an option (1/2):

if "%choice%"=="1" goto reset
if "%choice%"=="2" goto seed
goto end

:reset
echo.
echo Deleting existing database...
if exist "backend\data\personal-space.db" (
    del "backend\data\personal-space.db"
    echo Database deleted.
)
cd backend
echo.
echo Running seed data...
call npm run seed
cd ..
goto done

:seed
cd backend
echo.
echo Running seed data...
call npm run seed
cd ..
goto done

:done
echo.
echo ========================================
echo Done!
echo ========================================
echo.
echo Demo accounts (password: demo1234):
echo   heyinlin
echo   visitor
echo   designer
echo.
pause
exit /b 0

:end
echo Invalid choice.
pause

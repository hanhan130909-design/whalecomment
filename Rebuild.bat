@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ========================================
echo  WhaleComment Desktop Build Script
echo ========================================
echo.

echo [1/3] Installing dependencies...
call npm install --save puppeteer puppeteer-extra puppeteer-extra-plugin-stealth 2>&1
if errorlevel 1 (
    echo.
    echo ERROR: npm install failed
    pause
    exit /b 1
)

echo.
echo [2/3] Building portable executable...
call npm run build 2>&1
if errorlevel 1 (
    echo.
    echo ERROR: Build failed
    pause
    exit /b 1
)

echo.
echo [3/3] Done!
echo.
echo Output: dist\WhaleComment 1.0.0.exe
echo.
pause

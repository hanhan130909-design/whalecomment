@echo off
chcp 65001 >nul
echo Installing WhaleComment Desktop...
echo.
cd /d "%~dp0"
call npm install --save puppeteer-extra puppeteer-extra-plugin-stealth electron 2>&1
echo.
echo Done! Run: npm start
pause

@echo off
echo ============================================
echo  WhaleComment EXE Builder
echo ============================================
cd /d "D:\自动化评论软件\desktop_app"

set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/

echo Building with puppeteer unpacked...
call npm run build

if exist "dist\*.exe" (
    echo.
    echo ============================================
    echo   SUCCESS! EXE in dist\
    echo ============================================
    dir dist\*.exe
) else (
    echo Build may have failed.
)
pause

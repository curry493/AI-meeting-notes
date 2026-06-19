@echo off
echo ================================
echo  AI 会议纪要 Demo 启动器
echo ================================
echo.
echo Step 1: 安装依赖...
cd /d "%~dp0"
call npm install
if errorlevel 1 (
    echo npm install 失败，请检查网络
    pause
    exit /b 1
)
echo.
echo Step 2: 启动服务器...
start "" "http://localhost:3001/demo.html"
node server.js
pause

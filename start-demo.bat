@echo off
cd /d "%~dp0"
echo Installing dependencies...
call npm install
echo.
echo Starting server...
start http://localhost:3001/demo.html
node server.js

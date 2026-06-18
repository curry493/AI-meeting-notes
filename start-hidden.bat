@echo off
cd /d "%~dp0"
powershell -WindowStyle Hidden -Command "node server.js"

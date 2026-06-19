@echo off
cd /d "d:\微软浏览器下载\ai-meeting-notes"
git add server.js
git commit -m "Fix API_KEY line break"
git push origin main
echo.
echo === Push 完成! ===
echo 请在 Vercel Dashboard 点击 Redeploy
pause

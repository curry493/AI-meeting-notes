@echo off
cd /d "d:\微软浏览器下载\ai-meeting-notes"
git add vercel.json api/index.js
git commit -m "Fix Vercel static file serving"
git push origin main
echo Done!
pause

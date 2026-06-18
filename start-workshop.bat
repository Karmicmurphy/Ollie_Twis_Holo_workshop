@echo off
setlocal
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel%==0 (
  start "" http://127.0.0.1:8787
  py companion\server.py
  goto :eof
)
where python >nul 2>nul
if %errorlevel%==0 (
  start "" http://127.0.0.1:8787
  python companion\server.py
  goto :eof
)
echo Python was not found.
echo Install Python 3 or open app\index.html for reduced browser-only mode.
pause

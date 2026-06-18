@echo off
setlocal
cd /d "%~dp0"

set TWIS_HOLO_URL=http://127.0.0.1:8787

where py >nul 2>nul
if %errorlevel%==0 (
  start "Twis Holo Companion" py companion\server.py
  goto wait
)

where python >nul 2>nul
if %errorlevel%==0 (
  start "Twis Holo Companion" python companion\server.py
  goto wait
)

echo Python was not found.
echo Install Python 3 or open app\index.html for reduced browser-only mode.
pause
goto :eof

:wait
echo Starting Twis Holo Workshop...
timeout /t 2 /nobreak >nul
start "" %TWIS_HOLO_URL%
echo Workshop opened at %TWIS_HOLO_URL%

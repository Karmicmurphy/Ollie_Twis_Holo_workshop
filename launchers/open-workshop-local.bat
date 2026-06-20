@echo off
setlocal
cd /d "%~dp0.."

echo Starting Twis Holo Workshop locally...
echo Folder: %CD%

if exist "start-workshop.bat" (
  start "Twis Holo Workshop Local" "start-workshop.bat"
) else (
  echo ERROR: start-workshop.bat was not found next to this repo.
  echo Move this launcher folder back inside the Workshop repo and try again.
  pause
)

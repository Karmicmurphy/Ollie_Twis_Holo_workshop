@echo off
setlocal
cd /d "%~dp0.."

set "ROOT=%CD%"
set "LOCAL_TARGET=%ROOT%\start-workshop.bat"
set "CLOUD_URL=https://ollie-twis-holo-workshop.pages.dev/"

echo Creating Twis Holo Workshop desktop shortcuts...
echo Repo root: %ROOT%

if not exist "%LOCAL_TARGET%" (
  echo ERROR: Cannot find start-workshop.bat at:
  echo %LOCAL_TARGET%
  echo.
  echo Put this launcher folder inside the Workshop repo and try again.
  pause
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$Desktop=[Environment]::GetFolderPath('Desktop');" ^
  "$Root=(Resolve-Path '.').Path;" ^
  "$Shell=New-Object -ComObject WScript.Shell;" ^
  "$Local=$Shell.CreateShortcut((Join-Path $Desktop 'Twis Holo Workshop - LOCAL.lnk'));" ^
  "$Local.TargetPath=(Join-Path $Root 'start-workshop.bat');" ^
  "$Local.WorkingDirectory=$Root;" ^
  "$Local.Description='Start the local private Twis Holo Workshop';" ^
  "$Local.IconLocation='shell32.dll,220';" ^
  "$Local.Save();" ^
  "$Cloud=$Shell.CreateShortcut((Join-Path $Desktop 'Twis Holo Workshop - CLOUD.url'));" ^
  "$Cloud.TargetPath='%CLOUD_URL%';" ^
  "$Cloud.Save();"

echo.
echo Done.
echo Desktop shortcuts created:
echo - Twis Holo Workshop - LOCAL
echo - Twis Holo Workshop - CLOUD
echo.
echo LOCAL opens your private laptop version.
echo CLOUD opens the phone/public Cloudflare shell.
pause

@echo off
setlocal
cd /d "%~dp0.."

set "ROOT=%CD%"
set "LOCAL_TARGET=%ROOT%\start-workshop.bat"
set "CLOUD_URL=https://ollie-twis-holo-workshop.pages.dev/"
set "ICON_PATH=%ROOT%\app\assets\icons\twis-holo-icon.ico"
set "ICON_SCRIPT=%ROOT%\launchers\generate-workshop-icon.ps1"

echo Creating Twis Holo Workshop desktop shortcuts...
echo Repo root: %ROOT%
echo.

if not exist "%LOCAL_TARGET%" (
  echo ERROR: Cannot find start-workshop.bat at:
  echo %LOCAL_TARGET%
  echo.
  echo Put this launcher folder inside the Workshop repo and try again.
  pause
  exit /b 1
)

if not exist "%ICON_PATH%" (
  if exist "%ICON_SCRIPT%" (
    echo Creating Workshop icon...
    powershell -NoProfile -ExecutionPolicy Bypass -File "%ICON_SCRIPT%" -OutPath "%ICON_PATH%"
  )
)

if exist "%ICON_PATH%" (
  echo Icon ready: %ICON_PATH%
) else (
  echo Icon was not created. Shortcuts will use a built-in Windows icon.
  set "ICON_PATH=shell32.dll,220"
)

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$Desktop=[Environment]::GetFolderPath('Desktop');" ^
  "$Root=(Resolve-Path '.').Path;" ^
  "$Icon='%ICON_PATH%';" ^
  "$CloudUrl='%CLOUD_URL%';" ^
  "$Shell=New-Object -ComObject WScript.Shell;" ^
  "$Local=$Shell.CreateShortcut((Join-Path $Desktop 'Twis Holo Workshop - LOCAL.lnk'));" ^
  "$Local.TargetPath=(Join-Path $Root 'start-workshop.bat');" ^
  "$Local.WorkingDirectory=$Root;" ^
  "$Local.Description='Start the local private Twis Holo Workshop';" ^
  "$Local.IconLocation=$Icon;" ^
  "$Local.Save();" ^
  "$CloudFile=(Join-Path $Desktop 'Twis Holo Workshop - CLOUD.url');" ^
  "$CloudIcon=$Icon;" ^
  "Set-Content -Encoding ASCII -Path $CloudFile -Value ('[InternetShortcut]' + [Environment]::NewLine + 'URL=' + $CloudUrl + [Environment]::NewLine + 'IconFile=' + $CloudIcon + [Environment]::NewLine + 'IconIndex=0' + [Environment]::NewLine);"

echo.
echo Done.
echo Desktop shortcuts created:
echo - Twis Holo Workshop - LOCAL
echo - Twis Holo Workshop - CLOUD
echo.
echo LOCAL opens your private laptop version.
echo CLOUD opens the phone/public Cloudflare shell.
echo.
echo Rule:
echo LOCAL = private home base
echo CLOUD = phone / away-mode shell
echo GITHUB = code backup and deploy source
pause

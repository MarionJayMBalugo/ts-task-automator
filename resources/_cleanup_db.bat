@echo off
setlocal enabledelayedexpansion
echo.
echo -----------------------------------------------------------
echo [FINISH] Task completed at: %TIME%
echo -----------------------------------------------------------

:: SECURITY: Wipe sensitive variables from memory
set "PW="
set "MYSQL_PWD="
set "DB_PASS="

:: -------------------------------------------------------------
:: USER EXPERIENCE: DYNAMIC AUTO-CLOSE
:: Reads the toggle switch directly from Electron's settings file
:: -------------------------------------------------------------
set "AUTO_CLOSE=False"
:: Check for the production folder name first, then fallback to the dev folder name
set "SETTINGS_FILE=%APPDATA%\TMS Pulse\settings.json"
if not exist "!SETTINGS_FILE!" set "SETTINGS_FILE=%APPDATA%\ts-automation-app\settings.json"

if exist "!SETTINGS_FILE!" (
    for /f "delims=" %%I in ('powershell -NoProfile -Command "(Get-Content '!SETTINGS_FILE!' | ConvertFrom-Json).autoCloseCmd"') do set "AUTO_CLOSE=%%I"
)

echo !SETTINGS_FILE! !AUTO_CLOSE!
if /I "!AUTO_CLOSE!"=="True" (
    echo.
    echo Task finished successfully. Auto-closing in 3 seconds...
    timeout /t 3 /nobreak >nul
) else (
    echo.
    pause
)

exit /b 0
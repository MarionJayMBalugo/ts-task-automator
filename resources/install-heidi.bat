@echo off
setlocal enabledelayedexpansion

:: 1. Capture the input path
set "rawPath=%~1"

:: 2. Check if the base path even exists
if not exist "%rawPath%" (
    echo [ERROR] The selected path does not exist: "%rawPath%"
    pause
    exit /b
)

:: 3. Check if the path already ends with \HeidiSQL
:: We use a temporary variable to check the last 8 characters
set "endPart=%rawPath:~-8%"
if /i "%endPart%"=="HeidiSQL" (
    set "targetDir=%rawPath%"
) else (
    set "targetDir=%rawPath%\HeidiSQL"
)

:: 4. If the HeidiSQL folder doesn't exist, create it
if not exist "%targetDir%\" (
    echo Creating HeidiSQL folder at: "%targetDir%"
    mkdir "%targetDir%"
    if !ERRORLEVEL! NEQ 0 (
        echo [ERROR] Failed to create directory. Check permissions.
        pause
        exit /b
    )
) else (
    echo HeidiSQL folder found.
)

set "outfile=%~dp0Heidi_Setup.exe"
echo Fetching latest HeidiSQL version from GitHub...

:: This PowerShell command finds the first asset ending in '_Setup.exe' from the latest release
for /f "delims=" %%I in ('powershell -Command "$repo = 'HeidiSQL/HeidiSQL'; $url = \"https://api.github.com/repos/$repo/releases/latest\"; $response = Invoke-RestMethod -Uri $url; $asset = $response.assets | Where-Object { $_.name -like '*_Setup.exe' } | Select-Object -First 1; echo $asset.browser_download_url"') do set "downloadUrl=%%I"

if "%downloadUrl%"=="" (
    echo [ERROR] Could not find the latest download URL.
    pause
    exit /b
)

echo Latest URL found: %downloadUrl%
echo Downloading HeidiSQL using Curl...
:: -L follows redirects, -A mimics a Chrome browser
curl -L -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" -o "%outfile%" "%downloadUrl%"
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Curl failed to download the file.
    pause
    exit /b
)

:: Check if the file was actually created
if not exist "%outfile%" (
    echo [ERROR] Download failed. The installer was not found.
    pause
    exit /b
)

echo Starting Installation to: %targetDir%
:: Run the installer
start /wait "" "%~dp0Heidi_Setup.exe" /SILENT /DIR="%targetDir%"
if %ERRORLEVEL% EQU 0 (
    echo Installation Complete!
    del "%~dp0Heidi_Setup.exe"
) else (
    echo [ERROR] Installation failed with exit code %ERRORLEVEL%
)

:: Call your cleanup script
call "%~dp0_cleanup_db.bat"
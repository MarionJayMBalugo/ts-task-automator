:: ======================================================================================================
:: DEPENDENCY: This script requires arguments passed by a caller (Main Menu).
:: Executing this file directly will result in errors due to missing parameters.
:: ======================================================================================================

@echo off

:: Args: %1=KeyName, %2=PathValue, %3=Scope(USER/SYSTEM)
set "KEY=%~1"
set "NEW_PATH=%~2"
set "SCOPE=%~3"
set "FLAG="
set "REG_KEY="

:: Remove trailing backslash for consistent comparison
if "%NEW_PATH:~-1%"=="\" set "NEW_PATH=%NEW_PATH:~0,-1%"

:: Determine Registry Hive and SETX flag
if /I "%SCOPE%"=="SYSTEM" (
    set "FLAG=/M"
    set "REG_KEY=HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment"
) else (
    set "FLAG="
    set "REG_KEY=HKCU\Environment"
)

:: Check if directory exists physically
if not exist "%NEW_PATH%\" (
    echo %WARN% Directory not found: %NEW_PATH%
)

:: 1. Extract the RAW path from the specific Registry hive (prevents merging)
:: We use 'tokens=2*' to grab everything after the 'Path' variable name
for /f "tokens=2*" %%A in ('reg query "%REG_KEY%" /v Path 2^>nul') do set "RAW_REG_PATH=%%B"

:: 2. Check current session AND Registry data to prevent duplicates (even if folder is missing)
echo ;%PATH%;%RAW_REG_PATH%; | findstr /I /C:";%NEW_PATH%;" /C:";%NEW_PATH%\;" >nul
if %errorlevel% EQU 0 (
    echo %WARN% %KEY% already exists in %SCOPE% session or Registry. Skipping.
    exit /b 0
)

:: 3. Update the local session so the NEXT 'call' in the main loop sees this change
set "PATH=%NEW_PATH%;%PATH%"

:: 4. Persist ONLY to the specific hive using the RAW data + New Path
:: This prevents System entries from being saved into the User hive
setx PATH "%NEW_PATH%;%RAW_REG_PATH%" %FLAG% >nul

if %errorlevel% EQU 0 (
    echo %SUCCESS% Added to %SCOPE% Path: %KEY%
) else (
    echo %ERROR% Failed to set %KEY%
)

exit /b 0
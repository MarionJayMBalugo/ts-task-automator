@echo off
setlocal enabledelayedexpansion

:: 1. LOAD ENV CONFIGURATION
call "%~dp0_init_kaau_as_in.bat"

:: 2. PARSE THE TARGET DRIVE FROM THE APP
set "RAW_DRIVE=%~1"
if "!RAW_DRIVE!"=="" set "RAW_DRIVE=D:"

:: Strip slashes AND colons to get just the letter, then rebuild it perfectly
set "CLEAN_DRIVE=!RAW_DRIVE:\=!"
set "CLEAN_DRIVE=!CLEAN_DRIVE::=!"
set "TARGET_DRIVE=!CLEAN_DRIVE!:\"

set "BASE_PATH=!TARGET_DRIVE!"

echo.
echo ===================================================
echo --- Initializing Directory Structure ---
echo [TARGET] !BASE_PATH!
echo ===================================================
echo.

:: 3. READ FOLDERS FROM .ENV
if "!TMS_INFRA_FOLDERS!"=="" (
    echo [ERROR] TMS_INFRA_FOLDERS not found in .env file!
    pause
    exit /b 1
)

:: Replace commas with spaces for the FOR loop
set "FOLDERS_LIST=!TMS_INFRA_FOLDERS:,= !"

:: 4. EXECUTION LOOP
for %%F in (!FOLDERS_LIST!) do (
    set "FULL_PATH=!BASE_PATH!\%%~F"
    
    if exist "!FULL_PATH!" (
        echo [EXIST]  %%~F
    ) else (
        mkdir "!FULL_PATH!" >nul 2>&1
        if !ERRORLEVEL! EQU 0 (
            echo [NEW]    Created: %%~F
        ) else (
            echo [ERROR]  Failed: %%~F
        )
    )
)

echo.
echo Setup Complete.
echo.
timeout /t 3 >nul

:: Call your cleanup script
call "%~dp0_cleanup_db.bat"
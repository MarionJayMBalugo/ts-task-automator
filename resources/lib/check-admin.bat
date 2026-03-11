:: ======================================================================================================
:: DEPENDENCY: This script requires arguments passed by a caller (Main Menu).
:: Executing this file directly will result in errors due to missing parameters.
:: ======================================================================================================

@echo off
:: ======================================================================================================
:: This script checks for Admin rights and returns an error level.
:: ======================================================================================================

:: ======================================================================================================
:: Dependency: This script relies on %SUCCESS% and %ERROR% variables being 
:: pre-defined in the calling script (typically via theme.bat).
:: Ensure theme.bat is called in the main
:: entry-point script before executing this check.
:: ======================================================================================================

REM Check for admin right before proceeding.
net session >nul 2>&1

if %errorlevel% EQU 0 (
    echo %SUCCESS% You are running as Administrator.
) else (
    echo %ERROR% This script requires administrator privilege!
    pause
    exit /b 1
)

:: If we get here, it was successful
exit /b 0
:: ======================================================================================================
:: DEPENDENCY: This script requires arguments passed by a caller (Main Menu).
:: Executing this file directly will result in errors due to missing parameters.
:: ======================================================================================================

@echo off
:: Args: %1=Key, %2=Value, %3=Scope

:: ======================================================================================================
:: Determine the target environment scope: System (Global) vs. User (Local).
:: ======================================================================================================
set "FLAG="
if /I "%~3"=="SYSTEM" set "FLAG=/M"

:: ======================================================================================================
:: Execute system-level persistence for the key-value pair using the identified scope.
:: ======================================================================================================
setx "%~1" "%~2" %FLAG% >nul

if %errorlevel% EQU 0 (
    echo %SUCCESS% Set %~3 Var: %~1
) else (
    echo %ERROR% Failed to set %~1
)
exit /b 0
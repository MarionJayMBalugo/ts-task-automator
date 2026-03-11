:: ======================================================================================================
:: DEPENDENCY: This script requires arguments passed by a caller (Main Menu).
:: Executing this file directly will result in errors due to missing parameters.
:: ======================================================================================================

@echo off
setlocal enabledelayedexpansion

SET "SYS_ENV_CONF=%~1"
SET "LIB_VAR_WORKER=%~dp0set-var.bat"
SET "LIB_PATH_WORKER=%~dp0set-path.bat"

:: ======================================================================================================
:: Iterate through configuration file to synchronize system and user variables.
:: ======================================================================================================

echo %CYAN%==================================================%RESET%
echo        INITIATING WIN ENVIRONMENT VARIABLE SYNCHRONIZATION
echo %CYAN%==================================================%RESET%

if "%SYS_ENV_CONF%" == "" (
    set "CONFIG_FILE=%~dp0..\..\config\env-spec.win.conf"
) else (
    set "CONFIG_FILE=%SYS_ENV_CONF%"
)

:: ======================================================================================================
:: Use 'usebackq' to safely handle file paths containing spaces via double-quoting.
:: Use ONLY "=" as the initial delimiter to protect "C:\" paths
:: ======================================================================================================

for /F "usebackq eol=# tokens=1* delims==" %%a in ("%CONFIG_FILE%") do (
    set "FULL_KEY=%%a"
    set "VAL=%%b"

    :: Now split the FULL_KEY manually by the colon
    for /f "tokens=1,2 delims=:" %%x in ("!FULL_KEY!") do (
        set "TYPE=%%x"
        set "KEY=%%y"
    )

    :: Your routing logic remains the same
    if "!TYPE!"=="USER"  call "%LIB_VAR_WORKER%"  "!KEY!" "!VAL!" "USER"
    if "!TYPE!"=="SYS"   call "%LIB_VAR_WORKER%" "!KEY!" "!VAL!" "SYSTEM"
    if "!TYPE!"=="UPATH" call "%LIB_PATH_WORKER%" "!KEY!" "!VAL!" "USER"
    if "!TYPE!"=="SPATH" call "%LIB_PATH_WORKER%" "!KEY!" "!VAL!" "SYSTEM"
)

echo.
echo %GREEN%Provisioning Complete.%RESET%
pause
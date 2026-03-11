@echo off

:: ======================================================================================================
:: SYSTEM PROVISIONING SCRIPT
:: ======================================================================================================

:: ======================================================================================================
:: This command automatically registers these variables as System Environment Variables.
:: ======================================================================================================

:: ======================================================================================================
:: Import the theme logic
:: ======================================================================================================

call "%~dp0lib\theme.bat"

:: Run the Admin check and watch for the exit code
call "%~dp0lib\check-admin.bat"

if %errorlevel% NEQ 0 exit /b

SET "SYS_ENV_CONF=%~dp0config\env-spec.win.conf"
SET "SYS_ENV_SETUP=%~dp0lib\sys-env\setup.bat"

:MENU
cls
echo %CYAN%==================================================%RESET%
echo        SYSTEM ENVIRONMENT VARIABLE MANAGER
echo %CYAN%==================================================%RESET%
echo 1. Import from Configuration File%YELLOW% (%SYS_ENV_CONF%)%RESET%
echo 2. Add Variable Manually
echo 3. Exit
echo.
set /p choice="Choose an option (1-3): "

:: If they typed nothing, just loop back silently
if "%choice%" == "" goto :MENU

if "%choice%" == "1" (
    CALL :CHOICE1
    exit /b    
)

if "%choice%" == "2" (
    CALL :CHOICE2
    exit /b    
)
if "%choice%" == "3" exit /b 

:: The "Catch-All" for invalid text/numbers
echo.
echo %RED%Error: [%choice%] is not a valid option.%RESET%
echo Press any key to try again...
pause >nul
goto :MENU

:: Import variable from File
:CHOICE1
    echo.
    echo %YELLOW%Have you finalized the configuration file?%RESET%
    echo [Y] Yes, proceed with import
    echo [N] No, return to menu
    echo.

    choice /c YN /n /m "Select (Y/N): "
    if errorlevel 2 GOTO :MENU
    
    if errorlevel 1 CALL "%SYS_ENV_SETUP%" "%SYS_ENV_CONF%" &  pause >nul

:: Add Variable Manually
:CHOICE2
    cls
    echo %CYAN%==================================================%RESET%
    echo           ADD VARIABLE MANUALLY
    echo %CYAN%==================================================%RESET%
    echo.
    
    :: 1. Get the Key
    set /p "VAR_KEY=Enter Variable Name (e.g., JAVA_HOME): "
    if "!VAR_KEY!"=="" goto :MENU

    :: 2. Get the Value
    set /p "VAR_VAL=Enter Variable Value (e.g., C:\Java): "
    if "!VAR_VAL!"=="" goto :MENU

    :: 3. Select Scope
    echo.
    echo Select Scope:
    echo [U] User Environment
    echo [S] System Environment (Requires Admin)
    echo [M] Return to Main Menu
    echo.
    
    choice /c USM /n /m "Choose Scope (U/S/M): "
    
    if errorlevel 3 goto :MENU
    if errorlevel 2 (
        set "VAR_SCOPE=SYSTEM"
    ) else (
        set "VAR_SCOPE=USER"
    )

    :: 4. Confirm and Execute
    echo.
    echo %YELLOW%Confirming: Set %VAR_SCOPE% Var: %VAR_KEY%=%VAR_VAL%%RESET%
    choice /c YN /n /m "Proceed? (Y/N): "
    if errorlevel 2 goto :CHOICE2

    :: Call your existing worker script
    :: Ensure LIB_VAR_WORKER is set to the path of your set-var.bat
    call "%~dp0lib\sys-env\set-var.bat" "%VAR_KEY%" "%VAR_VAL%" "%VAR_SCOPE%"

    echo.
    echo Press any key to return to menu...
    pause >nul
    goto :MENU
exit /b



@echo off
setlocal enabledelayedexpansion

:: =============================================================================
:: 1. PATH SETUP
:: =============================================================================
set "ROOT_DIR=%~dp0"
set "CONFIG_DIR=!ROOT_DIR!config\"
set "ENV_FILE=!CONFIG_DIR!.env"

cd /d "!ROOT_DIR!"

:: =============================================================================
:: 2. PARSE .ENV FROM \config\.env
:: =============================================================================
if not exist "!ENV_FILE!" (
    echo [ERROR] Configuration file NOT found at: "!ENV_FILE!"
    echo [ERROR] Please ensure the 'config' folder contains a '.env' file.
    pause
    exit /b 1
)

echo [INFO] Loading configuration from config\.env...

for /f "usebackq tokens=1,2 delims==" %%A in ("!ENV_FILE!") do (
    set "key=%%A"
    set "val=%%B"
    
    :: Strip leading/trailing spaces
    for /f "tokens=*" %%K in ("!key!") do set "key=%%K"
    for /f "tokens=*" %%V in ("!val!") do set "val=%%V"
    
    :: Remove quotes/apostrophes
    set "val=!val:'=!"
    set "val=!val:"=!"
    
    if /I "!key!"=="DB_PASSWORD"      set "PW=!val!"
    if /I "!key!"=="DB_USERNAME"      set "DB_USER=!val!"
    if /I "!key!"=="TARGET_DATABASES"  set "TARGET_DATABASES=!val!"
    if /I "!key!"=="USE_DOCKER"        set "USE_DOCKER=!val!"
    if /I "!key!"=="DOCKER_CONTAINER"  set "DOCKER_CONT=!val!"
    if /I "!key!"=="DB_HOST"           set "DB_HOST=!val!"
)

:: =============================================================================
:: 3. VALIDATION & PRE-FLIGHT CHECKS
:: =============================================================================
if "!TARGET_DATABASES!"=="" (
    echo [ERROR] TARGET_DATABASES is empty in .env.
    pause
    exit /b 1
)

:: Check if the required tool (Docker or MySQL) is actually installed
if /I "!USE_DOCKER!"=="true" (
    where docker >nul 2>nul
    if !ERRORLEVEL! NEQ 0 (
        echo [ERROR] Docker is not installed or not in System PATH.
        pause
        exit /b 1
    )
) else (
    where mysql >nul 2>nul
    if !ERRORLEVEL! NEQ 0 (
        echo [ERROR] MySQL Client is not installed or not in System PATH.
        pause
        exit /b 1
    )
)

:: =============================================================================
:: 4. EXECUTION LOGIC
:: =============================================================================
echo.
echo --- Starting Database Creation Task ---
:: FIXED: Added ^ before the | to escape it so CMD treats it as text, not a pipe
echo [STATUS] Mode: !USE_DOCKER! (Docker) ^| Host: !DB_HOST!
echo.



:: Replace commas with spaces
set "CLEAN_LIST=!TARGET_DATABASES:,= !"

for %%D in (!CLEAN_LIST!) do (
    set "CURRENT_DB=%%D"
    
    if not "!CURRENT_DB!"=="" (
        set "SQL=CREATE DATABASE IF NOT EXISTS `!CURRENT_DB!` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
        
        echo [PROCESS] Creating: !CURRENT_DB! ...

        if /I "!USE_DOCKER!"=="true" (
            :: MODE: DOCKER
            docker exec -i -e MYSQL_PWD=!PW! !DOCKER_CONT! mysql -u !DB_USER! -e "!SQL!"
        ) else (
            :: MODE: SYSTEM-WIDE MYSQL
            set "MYSQL_PWD=!PW!"
            mysql -h !DB_HOST! -u !DB_USER! -e "!SQL!"
        )

        if !ERRORLEVEL! EQU 0 (
            echo [SUCCESS] !CURRENT_DB! is ready.
        ) else (
            echo [FAILURE] Error creating !CURRENT_DB!. Code: !ERRORLEVEL!
        )
    )
)

:: =============================================================================
:: 5. CLEANUP
:: =============================================================================
echo.
echo --- Task Completed ---
set "PW="
set "MYSQL_PWD="
pause
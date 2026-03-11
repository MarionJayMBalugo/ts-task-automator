@echo off
setlocal enabledelayedexpansion

:: =============================================================================
:: 1. CORE CONFIGURATION
:: =============================================================================
set "ENV_FILE=C:\Users\mbalugo\Documents\automation scripts\.env"
set "IMPORT_FILE=C:\Users\mbalugo\Documents\automation scripts\Archived\backups\SQL\finalmetadataandproductsprod.sql"
:: set "ENV_FILE=D:\automation\.env"
:: set "IMPORT_FILE=D:\automation\SQL\sample.sql"

set "DB_NAME=platform"
set "DB_USER=root"

:: --- DOCKER CONFIG ---
set "DOCKER_CONT=wai-web-db-1"

:: --- EXTERNAL SERVER CONFIG (Local/Remote) ---
:: Ensure 'mysql' is in your System PATH for this to work
set "DB_HOST=127.0.0.1"

:: =============================================================================
:: 2. FAST PARSE .ENV (Direct Jump)
:: =============================================================================
for /f "tokens=2 delims==" %%P in ('findstr /B "DB_PASSWORD=" "%ENV_FILE%"') do (
    set "PW=%%P"
    set "PW=!PW:'=!"
    set "PW=!PW:"=!"
)
if "!PW!"=="" set "PW=password"

:: =============================================================================
:: 3. EXECUTION (Comment/Uncomment the desired method)
:: =============================================================================
echo Starting Import into %DB_NAME%...

:: --- METHOD A: DOCKER ---
docker exec -i -e MYSQL_PWD=!PW! %DOCKER_CONT% mysql -u %DB_USER% %DB_NAME% < "%IMPORT_FILE%"

:: --- METHOD B: EXTERNAL SERVER (Uncomment below and comment Method A to use) ---
:: set "MYSQL_PWD=!PW!"
:: mysql -h %DB_HOST% -u %DB_USER% %DB_NAME% < "%IMPORT_FILE%"

:: =============================================================================
:: 4. FINAL RESULT
:: =============================================================================
if %ERRORLEVEL% EQU 0 (
    echo SUCCESS.
) else (
    echo FAILURE: Exit Code %ERRORLEVEL%
)

:: Security cleanup
set "PW="
set "MYSQL_PWD="
pause
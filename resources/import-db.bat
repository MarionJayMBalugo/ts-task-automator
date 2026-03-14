@echo off
setlocal enabledelayedexpansion

:: 1. Initialize (Global Setup + DB Health + Theme)
:: This pulls DB_USER, PW, DOCKER_CONT, etc., from your .env automatically
call "%~dp0_medyo_init_db_ra.bat"
if !ERRORLEVEL! NEQ 0 exit /b !ERRORLEVEL!

:: =============================================================================
:: 2. TASK-SPECIFIC CONFIGURATION
:: =============================================================================
:: We pull the DB_NAME and IMPORT_FILE from .env for maximum flexibility
:: If they aren't in .env, you can set defaults here.
if "!DB_NAME_IMPORT!"=="" set "DB_NAME_IMPORT=!DB_MAIN!"
if "!IMPORT_FILE_PATH!"=="" set "IMPORT_FILE_PATH=!EXPORT_DIR!\!DB_MAIN!.sql"

:: =============================================================================
:: 3. PRE-FLIGHT CHECKS
:: =============================================================================
echo %CYAN%--- Starting Database Import ---%RESET%
echo %CYAN%[TARGET]%RESET% Database: !DB_NAME_IMPORT!
echo %CYAN%[SOURCE]%RESET% File: !IMPORT_FILE_PATH!

:: Check if the SQL file actually exists
if not exist "!IMPORT_FILE_PATH!" (
    echo %ERROR% SQL file not found at: "!IMPORT_FILE_PATH!"
    pause
    exit /b 1
)

:: =============================================================================
:: 4. EXECUTION LOGIC
:: =============================================================================
echo %YELLOW%[PROCESS]%RESET% Importing data... Please wait (this may take time)...

if /I "!USE_DOCKER!"=="true" (
    :: MODE: DOCKER
    :: We use -i for interactive stream and pass the file via redirect <
    docker exec -i -e MYSQL_PWD=!PW! !DOCKER_CONT! mysql -u !DB_USER! !DB_NAME_IMPORT! < "!IMPORT_FILE_PATH!"
) else (
    :: MODE: SYSTEM-WIDE MYSQL
    set "MYSQL_PWD=!PW!"
    mysql -h !DB_HOST! -u !DB_USER! !DB_NAME_IMPORT! < "!IMPORT_FILE_PATH!"
)

:: =============================================================================
:: 5. FINAL RESULT
:: =============================================================================
if !ERRORLEVEL! EQU 0 (
    echo.
    echo %SUCCESS% Import into !DB_NAME_IMPORT! completed successfully.
) else (
    echo.
    echo %ERROR% Import failed. Exit Code: !ERRORLEVEL!
    echo %YELLOW%[HINT]%RESET% Ensure the database '!DB_NAME_IMPORT!' exists before importing.
)

:: =============================================================================
:: 6. TEARDOWN
:: =============================================================================
:: Security cleanup and pause via your global script
call "%~dp0_cleanup_db.bat"
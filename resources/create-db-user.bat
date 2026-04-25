@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo             MariaDB User Creation
echo ===================================================

:: 1. LOAD ENV CONFIGURATION
call "%~dp0_init_kaau_as_in.bat"
if !ERRORLEVEL! NEQ 0 exit /b !ERRORLEVEL!

:: =============================================================================
:: 2. UI ARGUMENT PARSING (Safe against spaces)
:: =============================================================================
:: The UI passes: [Drive] [Username] [Password] [Host] [SQL_Privileges]
:: The tilde (~) strips the surrounding quotes we added in JS!
set "UI_USERNAME=%~2"
set "UI_PASSWORD=%~3"
set "UI_HOST=%~4"
set "UI_PRIVILEGE=%~5"

:: Determine the Source of Truth: UI takes priority, .env is fallback
if not "!UI_USERNAME!"=="" (
    echo [INFO] Using Target User from UI Input.
    set "FINAL_USERNAME=!UI_USERNAME!"
    set "FINAL_PASSWORD=!UI_PASSWORD!"
    set "FINAL_HOST=!UI_HOST!"
    set "FINAL_PRIVILEGE=!UI_PRIVILEGE!"
) else (
    echo [INFO] Using Target User from .env file.
    set "FINAL_USERNAME=!NEW_DB_USERNAME!"
    set "FINAL_PASSWORD=!NEW_DB_USER_PASS!"
    set "FINAL_HOST=!NEW_DB_USER_HOST!"
    set "FINAL_PRIVILEGE=!NEW_DB_USER_PRIV!"
)

:: Validation & Fallbacks
if "!FINAL_USERNAME!"=="" (
    echo [ERROR] No username provided. UI argument and .env are empty.
    pause
    exit /b 1
)
if "!FINAL_HOST!"=="" set "FINAL_HOST=%"
if "!FINAL_PRIVILEGE!"=="" set "FINAL_PRIVILEGE=SELECT"

echo [INFO] Target User: '!FINAL_USERNAME!'@'!FINAL_HOST!'
echo [INFO] Privileges : !FINAL_PRIVILEGE!
echo.

:: 3. BUILD SQL COMMAND
:: 🚨 The MySQL syntax uses single quotes '!FINAL_USERNAME!' which inherently protects against internal spaces in SQL.
set "SQL_CMD=CREATE USER IF NOT EXISTS '!FINAL_USERNAME!'@'!FINAL_HOST!' IDENTIFIED BY '!FINAL_PASSWORD!'; "
set "SQL_CMD=!SQL_CMD!GRANT !FINAL_PRIVILEGE! ON *.* TO '!FINAL_USERNAME!'@'!FINAL_HOST!' WITH GRANT OPTION; "
set "SQL_CMD=!SQL_CMD!FLUSH PRIVILEGES;"

:: 4. EXECUTION
if /I "!USE_DOCKER!"=="true" (
    echo [INFO] Executing inside Docker container: !DOCKER_CONT!
    docker exec -i -e MYSQL_PWD=!PW! !DOCKER_CONT! mysql -u "!DB_USER!" -e "!SQL_CMD!"
) else (
    echo [INFO] Executing locally via MariaDB Bin path...
    set "MYSQL_PWD=!PW!"
    "!MARIA_BIN!\mysql" -h "!DB_HOST!" -u "!DB_USER!" -e "!SQL_CMD!"
)

:: 5. ERROR HANDLING
if !ERRORLEVEL! NEQ 0 (
    echo.
    echo [ERROR] Failed to create user. 
    echo Please check if your MariaDB service/Docker container is running and root credentials are correct.
    pause
    exit /b 1
)

echo.
echo [SUCCESS] User !FINAL_USERNAME! created successfully!
timeout /t 3 >nul

:: Call your cleanup script
call "%~dp0_cleanup_db.bat"
@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo             MariaDB User Creation
echo ===================================================

:: 1. LOAD ENV CONFIGURATION
call "%~dp0_init_kaau_as_in.bat"

:: 2. VALIDATION
if "%NEW_DB_USERNAME%"=="" (
    echo [ERROR] NEW_DB_USERNAME not defined in .env
    pause
    exit /b 1
)

echo [INFO] Target User: '%NEW_DB_USERNAME%'@'%NEW_DB_USER_HOST%'
echo [INFO] Privileges : %NEW_DB_USER_PRIV%
echo.

:: 3. BUILD SQL COMMAND
:: Create the user (IF NOT EXISTS prevents crashes if they are already there)
set "SQL_CMD=CREATE USER IF NOT EXISTS '%NEW_DB_USERNAME%'@'%NEW_DB_USER_HOST%' IDENTIFIED BY '%NEW_DB_USER_PASS%'; "
:: Grant the permissions globally (*.*)
set "SQL_CMD=!SQL_CMD!GRANT %NEW_DB_USER_PRIV% ON *.* TO '%NEW_DB_USERNAME%'@'%NEW_DB_USER_HOST%' WITH GRANT OPTION; "
:: Apply the changes
set "SQL_CMD=!SQL_CMD!FLUSH PRIVILEGES;"

:: 4. EXECUTION
if /I "%USE_DOCKER%"=="true" (
    echo [INFO] Executing inside Docker container: %DOCKER_CONT%
    docker exec -i %DOCKER_CONT% mysql -u "%DB_USER%" -p"%PW%" -e "!SQL_CMD!"
) else (
    echo [INFO] Executing locally via MariaDB Bin path...
    "%MARIA_BIN%\mysql" -u "%DB_USER%" -p"%PW%" -h "%DB_HOST%" -e "!SQL_CMD!"
)

:: 5. ERROR HANDLING
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Failed to create user. 
    echo Please check if your MariaDB service/Docker container is running and root credentials are correct.
    pause
    exit /b 1
)

echo.
echo [SUCCESS] User %NEW_DB_USERNAME% created successfully!
timeout /t 3 >nul

:: Call your cleanup script
call "%~dp0_cleanup_db.bat"
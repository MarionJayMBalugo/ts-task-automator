@echo off
setlocal enabledelayedexpansion

:: Call the global loader
call "%~dp0_medyo_init_db_ra.bat"
if !ERRORLEVEL! NEQ 0 exit /b !ERRORLEVEL!

:: =============================================================================
:: 3. VALIDATION & PRE-FLIGHT CHECKS
:: =============================================================================
if "!TARGET_DATABASES!"=="" (
    echo %ERROR% TARGET_DATABASES is empty in .env.
    pause
    exit /b 1
)

:: Set Defaults if .env is missing these specific keys
if "!DB_CHARSET!"==""      set "DB_CHARSET=utf8mb4"
if "!DB_COLLATION!"==""    set "DB_COLLATION=utf8mb4_unicode_ci"

:: =============================================================================
:: 4. EXECUTION LOGIC
:: =============================================================================
echo.
echo %CYAN%--- Starting Database Creation Task ---%RESET%
echo %CYAN%[STATUS]%RESET% Mode: !USE_DOCKER! ^| Host: !DB_HOST!
echo %CYAN%[CONFIG]%RESET% Charset: !DB_CHARSET! ^| Collation: !DB_COLLATION!

:: Escape check for custom rules echo
if not "!DB_CUSTOM_RULES!"=="" (
    echo %CYAN%[RULES]%RESET% Active: "!DB_CUSTOM_RULES!"
)
echo.

:: Replace commas with spaces
set "CLEAN_LIST=!TARGET_DATABASES:,= !"

for %%D in (!CLEAN_LIST!) do (
    set "CURRENT_DB=%%D"
    
    if not "!CURRENT_DB!"=="" (
        :: Build the Dynamic SQL String
        set "SQL=CREATE DATABASE IF NOT EXISTS `!CURRENT_DB!` CHARACTER SET !DB_CHARSET! COLLATE !DB_COLLATION! !DB_CUSTOM_RULES!;"
        
        echo %YELLOW%[PROCESS]%RESET% Creating: !CURRENT_DB! ...

        if /I "!USE_DOCKER!"=="true" (
            :: MODE: DOCKER
            docker exec -i -e MYSQL_PWD=!PW! !DOCKER_CONT! mysql -u !DB_USER! -e "!SQL!"
        ) else (
            :: MODE: SYSTEM-WIDE MYSQL
            set "MYSQL_PWD=!PW!"
            mysql -h !DB_HOST! -u !DB_USER! -e "!SQL!"
        )

        if !ERRORLEVEL! EQU 0 (
            echo %SUCCESS% !CURRENT_DB! is ready.
        ) else (
            echo %ERROR% Failed to create !CURRENT_DB!. Code: !ERRORLEVEL!
        )
    )
)

:: =============================================================================
:: 5. TEARDOWN
:: =============================================================================
:: Using your cleanup script for security and pause
call "%~dp0_cleanup_db.bat"
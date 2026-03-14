@echo off
setlocal enabledelayedexpansion

:: 1. Initialize (Global Setup + DB Health Checks + Theme)
call "%~dp0_medyo_init_db_ra.bat"
if !ERRORLEVEL! NEQ 0 exit /b !ERRORLEVEL!

:: 2. Set Default Dump Options fallback
if "!DUMP_OPTS!"=="" (
    set "DUMP_OPTS=--single-transaction --routines --triggers --events --max_allowed_packet=1G --net_buffer_length=16M"
)

:: =============================================================================
:: 3. INITIALIZATION
:: =============================================================================
echo %CYAN%--- Starting Cutover Export ---%RESET%
echo %CYAN%[STATUS]%RESET% Mode: !USE_DOCKER! ^| Host: !DB_HOST!

:: Ensure Export Directory exists
if not exist "!EXPORT_DIR!" (
    echo %YELLOW%[INFO]%RESET% Creating export directory: !EXPORT_DIR!
    mkdir "!EXPORT_DIR!" 2>nul
)

:: =============================================================================
:: 4. EXECUTION: MAIN DATABASE
:: =============================================================================
echo.
echo %CYAN%[1/2] Dumping Main Database: !DB_MAIN!...%RESET%

if /I "!USE_DOCKER!"=="true" (
    docker exec -e MYSQL_PWD=!PW! !DOCKER_CONT! mysqldump -u !DB_USER! !DUMP_OPTS! !DB_MAIN! > "!EXPORT_DIR!\!DB_MAIN!.sql"
)

:: Separate IF block prevents the "missing drive" error from triggering
if /I "!USE_DOCKER!"=="false" (
    if not exist "!MARIA_BIN!\mysqldump.exe" (
        echo %ERROR% mysqldump.exe not found in !MARIA_BIN!
        pause
        exit /b 1
    )
    cd /d "!MARIA_BIN!"
    mysqldump.exe --user=!DB_USER! --password="!PW!" !DB_MAIN! !DUMP_OPTS! -r "!EXPORT_DIR!\!DB_MAIN!.sql"
)

if !ERRORLEVEL! EQU 0 (
    echo %SUCCESS% !DB_MAIN! dumped successfully.
    powershell -Command "if(Test-Path '!EXPORT_DIR!\!DB_MAIN!.sql'){ Get-Content -Path '!EXPORT_DIR!\!DB_MAIN!.sql' -Tail 10 } else { Write-Host 'File not found' -ForegroundColor Red }"
) else (
    echo %ERROR% Failed to dump !DB_MAIN!.
)

:: =============================================================================
:: 5. EXECUTION: DW CHANGELOG
:: =============================================================================
echo.
echo %CYAN%[2/2] Dumping DW Changelog: !DB_DW!...%RESET%

if /I "!USE_DOCKER!"=="true" (
    docker exec -e MYSQL_PWD=!PW! !DOCKER_CONT! mysqldump -u !DB_USER! !DUMP_OPTS! !DB_DW! changelog > "!EXPORT_DIR!\!DB_DW!_changelog.sql"
)

if /I "!USE_DOCKER!"=="false" (
    cd /d "!MARIA_BIN!"
    mysqldump.exe --user=!DB_USER! --password="!PW!" !DB_DW! changelog !DUMP_OPTS! -r "!EXPORT_DIR!\!DB_DW!_changelog.sql"
)

if !ERRORLEVEL! EQU 0 (
    echo %SUCCESS% !DB_DW! changelog dumped successfully.
    powershell -Command "if(Test-Path '!EXPORT_DIR!\!DB_DW!_changelog.sql'){ Get-Content -Path '!EXPORT_DIR!\!DB_DW!_changelog.sql' -Tail 10 } else { Write-Host 'File not found' -ForegroundColor Red }"
) else (
    echo %ERROR% Failed to dump !DB_DW! changelog.
)

:: =============================================================================
:: 6. FINALIZE
:: =============================================================================
echo.
echo %GREEN%===========================================================%RESET%
echo %GREEN% SUCCESS: Export Tasks Finished.%RESET%
echo %GREEN% Files are located in: !EXPORT_DIR!%RESET%
echo %GREEN%===========================================================%RESET%

:: Return to root directory before cleanup
cd /d "%ROOT_DIR%"

:: Call global cleanup (Handles PW wipe and pause)
call "%~dp0_cleanup_db.bat"
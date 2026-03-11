@echo off
setlocal enabledelayedexpansion

:: =============================================================================
:: 1. PATH SETUP (DYNAMIC)
:: =============================================================================
set "ROOT_DIR=%~dp0"
set "CONFIG_DIR=!ROOT_DIR!config\"
set "ENV_FILE=!CONFIG_DIR!.env"

:: Ensure we start in the script's directory
cd /d "!ROOT_DIR!"

:: =============================================================================
:: 2. LOAD CONFIGURATION FROM .ENV
:: =============================================================================
if not exist "!ENV_FILE!" (
    echo [ERROR] Configuration file NOT found at: "!ENV_FILE!"
    pause
    exit /b 1
)

echo [INFO] Loading Export Configuration...

for /f "usebackq tokens=1,2 delims==" %%A in ("!ENV_FILE!") do (
    set "key=%%A"
    set "val=%%B"
    for /f "tokens=*" %%K in ("!key!") do set "key=%%K"
    for /f "tokens=*" %%V in ("!val!") do set "val=%%V"
    set "val=!val:'=!"
    set "val=!val:"=!"
    
    if /I "!key!"=="MARIA_BIN_PATH"   set "MARIA_BIN=!val!"
    if /I "!key!"=="EXPORT_DEST_DIR"  set "EXPORT_DIR=!val!"
    if /I "!key!"=="DB_USERNAME"      set "DB_USER=!val!"
    if /I "!key!"=="DB_PASSWORD"      set "DB_PASS=!val!"
    if /I "!key!"=="DB_NAME_MAIN"     set "DB_MAIN=!val!"
    if /I "!key!"=="DB_NAME_DW"       set "DB_DW=!val!"
)

:: Optimized Flags
set "DUMP_OPTS=--single-transaction --routines --triggers --events --max_allowed_packet=1G --net_buffer_length=16M"

:: =============================================================================
:: 3. INITIALIZATION
:: =============================================================================
echo --- Starting Cutover Export ---
if not exist "!EXPORT_DIR!" mkdir "!EXPORT_DIR!"

:: Move to MariaDB Bin folder
cd /d "!MARIA_BIN!"
if !ERRORLEVEL! NEQ 0 (
    echo [ERROR] Could not find MariaDB Bin at !MARIA_BIN!
    pause
    exit /b 1
)

:: =============================================================================
:: 4. EXECUTION: MAIN DATABASE
:: =============================================================================
echo [1/3] Dumping Main Database: !DB_MAIN!...
mysqldump.exe --user=!DB_USER! --password="!DB_PASS!" !DB_MAIN! !DUMP_OPTS! -r "!EXPORT_DIR!\!DB_MAIN!.sql"

echo [VERIFY] Last 10 lines of !DB_MAIN!:
powershell -Command "Get-Content -Path '!EXPORT_DIR!\!DB_MAIN!.sql' -Tail 10"

:: =============================================================================
:: 5. EXECUTION: DW CHANGELOG
:: =============================================================================
echo [2/3] Dumping DW Changelog: !DB_DW%...
mysqldump.exe --user=!DB_USER! --password="!DB_PASS!" !DB_DW! changelog !DUMP_OPTS! -r "!EXPORT_DIR!\!DB_DW!_changelog.sql"

echo [VERIFY] Last 10 lines of !DB_DW!_changelog:
powershell -Command "Get-Content -Path '!EXPORT_DIR!\!DB_DW!_changelog.sql' -Tail 10"

:: =============================================================================
:: 6. COMPRESSION
:: =============================================================================
echo [3/3] Compressing Folder...
:: Create timestamp (YYYYMMDD)
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set "dt=%%I"
set "STAMP=!dt:~0,8!"
set "ZIP_NAME=!EXPORT_DIR!\EXPORT_BACKUP_!STAMP!.zip"

:: Use PowerShell's native Compress-Archive
powershell -Command "Compress-Archive -Path '!EXPORT_DIR!\*.sql' -DestinationPath '!ZIP_NAME!' -Update"

if !ERRORLEVEL! EQU 0 (
    echo.
    echo ===========================================================
    echo SUCCESS: Export and Compression Complete.
    echo Location: !ZIP_NAME!
    echo ===========================================================
) else (
    echo.
    echo [ERROR] Compression failed. Check if files are in use.
)

set "DB_PASS="
pause
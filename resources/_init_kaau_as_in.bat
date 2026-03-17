@echo off
:: 0. HARD RESET (Kill any ghost variables from previous runs)
set "PW="
set "DB_USER="
set "MARIA_BIN="
set "EXPORT_DIR="
set "ROOT_DIR="

:: 1. GLOBAL PATHS
set "ROOT_DIR=%~dp0"
set "CONFIG_DIR=%ROOT_DIR%config\"
set "ENV_FILE=%CONFIG_DIR%.env"

set "THEME_FILE=%ROOT_DIR%lib\theme.bat"
if exist "%THEME_FILE%" call "%THEME_FILE%"

:: 2. LOAD ENV
if not exist "%ENV_FILE%" (
    echo [ERROR] Configuration file NOT found at: "%ENV_FILE%"
    pause
    exit /b 1
)

:: Use tokens=1* to ensure the entire value is captured
for /f "usebackq tokens=1* delims==" %%A in ("%ENV_FILE%") do (
    set "key=%%A"
    set "val=%%B"
    
    :: Strip spaces from key
    for /f "tokens=*" %%K in ("%%A") do set "key=%%K"
    
    :: If value exists, clean and map it
    if defined val (
        set "val=!val:'=!"
        set "val=!val:"=!"
        
        if /I "!key!"=="DB_PASSWORD"       set "PW=!val!"
        if /I "!key!"=="DB_USERNAME"       set "DB_USER=!val!"
        if /I "!key!"=="TARGET_DATABASES"  set "TARGET_DATABASES=!val!"
        if /I "!key!"=="USE_DOCKER"        set "USE_DOCKER=!val!"
        if /I "!key!"=="DOCKER_CONTAINER"  set "DOCKER_CONT=!val!"
        if /I "!key!"=="DB_HOST"           set "DB_HOST=!val!"
        if /I "!key!"=="MARIA_BIN_PATH"    set "MARIA_BIN=!val!"
        if /I "!key!"=="EXPORT_DEST_DIR"   set "EXPORT_DIR=!val!"
        if /I "!key!"=="DB_CHARSET"        set "DB_CHARSET=!val!"
        if /I "!key!"=="DB_COLLATION"      set "DB_COLLATION=!val!"
        if /I "!key!"=="DB_CUSTOM_RULES"   set "DB_CUSTOM_RULES=!val!"
        if /I "!key!"=="DB_NAME_MAIN"      set "DB_MAIN=!val!"
        if /I "!key!"=="DB_NAME_DW"        set "DB_DW=!val!"
        if /I "!key!"=="DB_DUMP_OPTS"      set "DUMP_OPTS=!val!"
        if /I "!key!"=="DB_NAME_IMPORT"    set "DB_NAME_IMPORT=!val!"
        if /I "!key!"=="IMPORT_FILE_PATH"  set "IMPORT_FILE_PATH=!val!"
        if /I "!key!"=="TMS_INFRA_FOLDERS" set "TMS_INFRA_FOLDERS=!val!"
    )
)

:: 3. GLOBAL CD (FIXED SYNTAX)
:: We use the /d switch directly on the quoted variable. 
:: If you are already on C:, this is all you need.
cd /d "%ROOT_DIR%"

exit /b 0
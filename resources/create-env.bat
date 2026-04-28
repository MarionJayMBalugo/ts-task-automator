@echo off
:: 1. LOAD ENV CONFIGURATION
call "%~dp0_init_kaau_as_in.bat"

:: 2. PARSE THE TARGET DRIVE FROM THE APP
set "RAW_DRIVE=%~1"
if "!RAW_DRIVE!"=="" set "RAW_DRIVE=D:"
set "TargetDIR=%RAW_DRIVE%\tms-dos\resources\resources\www\Default"
echo %TargetDIR%
set "SOURCE_FILE=%TargetDIR%\.env.example"
set "DEST_FILE=%TargetDIR%\.env"

:: 3. Check if the source directory exists
if not exist "%TargetDIR%" (
    echo Error: Source directory "%TargetDIR%" not found.
    goto :end
)

:: 4. Check if the .env.example exists inside that directory
if not exist "%SOURCE_FILE%" (
    echo Error: %SOURCE_FILE% not found.
    goto :end
)

:: 5. Check if .env already exists in the destination
if exist "%DEST_FILE%" (
    echo .env file already exists. Skipping copy to prevent overwriting.
) else (
    echo Copying %SOURCE_FILE% to %DEST_FILE%...
    copy "%SOURCE_FILE%" "%DEST_FILE%"
    echo Done!
)

:end

:: Call your cleanup script
call "%~dp0_cleanup_db.bat"
@echo off
:: %1 is the target drive (e.g., E:)
:: %2 is the absolute path to the installer

echo Launching installer from: %2
start "" /wait "%~2"

:: Call your cleanup script
call "%~dp0_cleanup_db.bat"
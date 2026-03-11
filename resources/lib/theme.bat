:: ======================================================================================================
:: DEPENDENCY: This script requires arguments passed by a caller (Main Menu).
:: Executing this file directly will result in errors due to missing parameters.
:: ======================================================================================================

@echo off 
:: =====================================================================
:: THEME.BAT - Global UI & Color Definitions
:: =====================================================================

:: =====================================================================
:: This module handles ANSI escape sequences for colored console output.
:: Generating the ESC character via prompt ensures the script remains 
:: portable across different editors and sharing platforms.
:: =====================================================================

for /F "tokens=1,2 delims=#" %%a in ('"prompt #$H#$E# & echo on & for %%b in (1) do rem"') do set "ESC=%%b"


:: Define Standard UI Colors
set "RED=%ESC%[91m"
set "GREEN=%ESC%[92m"
set "YELLOW=%ESC%[93m"
set "CYAN=%ESC%[96m"
set "RESET=%ESC%[0m"

:: Define Status Prefixes 
set "SUCCESS=[%GREEN%SUCCESS%RESET%]"
set "ERROR=[%RED%ERROR%RESET%]"
set "WARN=[%YELLOW%WARN%RESET%]"
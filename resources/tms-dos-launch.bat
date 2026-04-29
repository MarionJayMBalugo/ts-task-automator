@echo off

set "rawDrive=%~1"

:: Check for administrative permissions
openfiles >nul 2>&1
if %errorlevel% neq 0 (
    echo Requesting administrative privileges...
    :: This line now passes the arguments (%*) to the elevated script
    powershell -Command "Start-Process -FilePath '%~f0' -ArgumentList '%*' -Verb RunAs"
    exit /b
)

:: ============================================================
:: YOUR APP LOGIC STARTS HERE
:: ============================================================
echo Running application as Administrator...

:: Opening the TMS-DOS application
start "" "%rawDrive%\tms-dos\tms-dos.exe"

:end
exit /b
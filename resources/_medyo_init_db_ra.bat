@echo off
:: 1. Load the Global Config first
call "%~dp0_init.bat"
if !ERRORLEVEL! NEQ 0 exit /b !ERRORLEVEL!

: Check if the required tool (Docker or MySQL) is actually installed
if /I "!USE_DOCKER!"=="true" (
    where docker >nul 2>nul
    if !ERRORLEVEL! NEQ 0 (
        echo [ERROR] Docker is not installed or not in System PATH.
        pause
        exit /b 1
    )
    
    :: Check if the specific container is actually running
    docker inspect -f "{{.State.Running}}" !DOCKER_CONT! 2>nul | findstr "true" >nul
    if !ERRORLEVEL! NEQ 0 (
        echo [ERROR] Docker container '!DOCKER_CONT!' is NOT running.
        echo Please start the container first.
        pause
        exit /b 1
    )
) else (
    where mysql >nul 2>nul
    if !ERRORLEVEL! NEQ 0 (
        echo [ERROR] MySQL Client is not installed or not in System PATH.
        pause
        exit /b 1
    )
)

exit /b 0
@echo off
echo.
echo -----------------------------------------------------------
echo [FINISH] Task completed at: %TIME%
echo -----------------------------------------------------------

:: SECURITY: Wipe sensitive variables from memory
set "PW="
set "MYSQL_PWD="
set "DB_PASS="

:: USER EXPERIENCE: Keep window open to see results
pause

exit /b 0
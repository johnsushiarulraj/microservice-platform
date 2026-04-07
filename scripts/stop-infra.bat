@echo off
REM stop-infra.bat — Stop infrastructure on Windows
REM Usage: stop-infra.bat [--clean]

echo === JavaBackend Platform — Stop Infrastructure ===
echo.

where bash >nul 2>nul
if %ERRORLEVEL% equ 0 (
    bash "%~dp0stop-infra.sh" %*
    exit /b %ERRORLEVEL%
)

where wsl >nul 2>nul
if %ERRORLEVEL% equ 0 (
    wsl bash "%~dp0stop-infra.sh" %*
    exit /b %ERRORLEVEL%
)

echo ERROR: Neither bash nor WSL found.
exit /b 1

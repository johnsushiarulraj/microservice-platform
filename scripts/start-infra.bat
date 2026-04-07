@echo off
REM start-infra.bat — Start infrastructure on Windows
REM Requires: Docker Desktop, Kind, kubectl, Helm (all in PATH)
REM This is a wrapper that calls the bash script via Git Bash or WSL

echo === JavaBackend Platform — Start Infrastructure ===
echo.

REM Try Git Bash first
where bash >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo Using bash...
    bash "%~dp0start-infra.sh"
    exit /b %ERRORLEVEL%
)

REM Try WSL
where wsl >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo Using WSL...
    wsl bash "%~dp0start-infra.sh"
    exit /b %ERRORLEVEL%
)

echo ERROR: Neither bash nor WSL found.
echo Install Git for Windows (includes Git Bash) or enable WSL.
echo https://gitforwindows.org/
exit /b 1

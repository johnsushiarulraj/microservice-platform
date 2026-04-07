@echo off
REM test.bat — Run unit tests
cd /d "%~dp0"
echo Running tests...
call mvn test

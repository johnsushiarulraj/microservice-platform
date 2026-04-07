@echo off
REM build.bat — Build the microservice JAR + Docker image.
REM Usage: scripts\build.bat 1.0.0

setlocal
cd /d "%~dp0\.."

set SERVICE_NAME=microservice-template
set IMAGE_TAG=%1
if "%IMAGE_TAG%"=="" set IMAGE_TAG=local

echo.
echo   Service: %SERVICE_NAME%
echo   Tag:     %IMAGE_TAG%
echo.

echo === [1/2] Building JAR...
call mvn clean package -DskipTests -q
if errorlevel 1 (echo BUILD FAILED & exit /b 1)

echo === [2/3] Building Docker image...
docker build -t %SERVICE_NAME%:%IMAGE_TAG% .
if errorlevel 1 (echo DOCKER BUILD FAILED & exit /b 1)

echo === [3/3] Loading into Kind cluster...
kind load docker-image %SERVICE_NAME%:%IMAGE_TAG% --name template-local 2>nul
if errorlevel 1 (
    echo     Kind cluster not found - load manually: kind load docker-image %SERVICE_NAME%:%IMAGE_TAG% --name template-local
) else (
    echo     Loaded into Kind
)

echo.
echo Done: %SERVICE_NAME%:%IMAGE_TAG%
echo Deploy: DevConsole - Services - Deploy - name: %SERVICE_NAME%, tag: %IMAGE_TAG%

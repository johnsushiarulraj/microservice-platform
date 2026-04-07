@echo off
REM deploy.bat — Build, provision, and deploy in one command.
REM Usage:
REM   deploy.bat 1.0.0        Deploy to microservice platform
REM   deploy.bat --compose     Run standalone with Docker Compose

setlocal enabledelayedexpansion
cd /d "%~dp0"

set SERVICE_NAME=microservice-template
set GATEWAY=http://localhost:18090

REM ── Docker Compose mode ────────────────────────────────────────────────────
if "%~1"=="--compose" (
    echo.
    echo   Starting %SERVICE_NAME% with Docker Compose...
    echo.

    echo === [1/3] Building JAR...
    call mvn clean package -DskipTests -q
    if errorlevel 1 (echo BUILD FAILED & exit /b 1)

    echo === [2/3] Building and starting containers...
    docker compose up -d --build

    echo === [3/3] Waiting for service to be healthy...
    for /L %%i in (1,1,24) do (
        timeout /t 5 /nobreak >nul
        curl -s -o nul -w "%%{http_code}" "http://localhost:8081/microservice-template/actuator/health" >%TEMP%\compose_health.txt 2>nul
        set /p CHEALTH=<%TEMP%\compose_health.txt
        if "!CHEALTH!"=="200" goto :compose_ready
        if "!CHEALTH!"=="401" goto :compose_ready
        echo     Waiting... ^(attempt %%i^)
    )
    echo.
    echo   Service started but not healthy yet. Check logs:
    echo   docker compose logs -f app
    exit /b 0

    :compose_ready
    echo.
    echo   %SERVICE_NAME% is running (Docker Compose)
    echo.
    echo   App:        http://localhost:8081/microservice-template/
    echo   Swagger:    http://localhost:8081/microservice-template/swagger-ui.html
    echo   Keycloak:   http://localhost:8080/auth/  (admin / admin)
    echo   Postgres:   localhost:5432  (template / template123)
    echo.
    echo   Logs:   docker compose logs -f app
    echo   Stop:   docker compose down
    echo   Clean:  docker compose down -v
    exit /b 0
)

REM ── Platform mode ──────────────────────────────────────────────────────────
set IMAGE_TAG=%1
if "%IMAGE_TAG%"=="" (
    echo Usage: deploy.bat ^<version^>
    echo        deploy.bat --compose
    echo.
    echo Examples:
    echo   deploy.bat 1.0.0       Deploy to microservice platform
    echo   deploy.bat --compose   Run standalone with Docker Compose
    exit /b 1
)

REM Check if platform is running
echo.
echo   Checking platform...
curl -s -o nul -w "%%{http_code}" %GATEWAY%/devconsole/api/health >%TEMP%\healthcheck.txt 2>nul
set /p HEALTH=<%TEMP%\healthcheck.txt
if not "%HEALTH%"=="200" (
    echo.
    echo   ERROR: Platform not reachable at %GATEWAY%
    echo   Run start-infra.sh first, or use: deploy.bat --compose
    exit /b 1
)
echo   Platform is running.

REM Step 1: Build
echo.
echo === [1/4] Building JAR...
call mvn clean package -DskipTests -q
if errorlevel 1 (echo BUILD FAILED & exit /b 1)

REM Step 2: Docker
echo === [2/4] Building Docker image: %SERVICE_NAME%:%IMAGE_TAG%
docker build -t %SERVICE_NAME%:%IMAGE_TAG% .
if errorlevel 1 (echo DOCKER BUILD FAILED & exit /b 1)

REM Step 3: Load into Kind
echo === [3/4] Loading into Kind...
kind load docker-image %SERVICE_NAME%:%IMAGE_TAG% --name template-local 2>nul
if errorlevel 1 (
    echo   Kind cluster not found. Is start-infra.sh running?
    exit /b 1
)
echo   Loaded into Kind.

REM Step 4: Deploy (provision + helm)
echo === [4/4] Deploying %SERVICE_NAME%:%IMAGE_TAG%...

REM Build JSON body via PowerShell for reliable escaping
set TMPFILE=%TEMP%\deploy-body-%RANDOM%.json

if exist provision.yml (
    powershell -NoProfile -Command ^
        "$yml = Get-Content 'provision.yml' -Raw; " ^
        "$body = @{name='%SERVICE_NAME%'; tag='%IMAGE_TAG%'; provisionYml=$yml} | ConvertTo-Json -Compress; " ^
        "[System.IO.File]::WriteAllText('%TMPFILE%', $body, [System.Text.Encoding]::UTF8)"
) else (
    echo {"name":"%SERVICE_NAME%","tag":"%IMAGE_TAG%"} > %TMPFILE%
)

REM Call deploy API
curl -s -X POST %GATEWAY%/devconsole/api/services/deploy ^
  -H "Content-Type: application/json" ^
  -d @%TMPFILE% ^
  >%TEMP%\deploy_result.txt 2>nul

type %TEMP%\deploy_result.txt
del /q %TMPFILE% 2>nul
echo.

REM Poll health
echo.
echo   Waiting for service to be healthy...
set CONTEXT=/template
for /L %%i in (1,1,12) do (
    timeout /t 5 /nobreak >nul
    curl -s -o nul -w "%%{http_code}" %GATEWAY%%CONTEXT%/actuator/health >%TEMP%\svc_health.txt 2>nul
    set /p SVC_HEALTH=<%TEMP%\svc_health.txt
    if "!SVC_HEALTH!"=="200" (
        echo.
        echo   %SERVICE_NAME%:%IMAGE_TAG% is LIVE
        echo   URL: %GATEWAY%%CONTEXT%/actuator/health
        echo   API: %GATEWAY%%CONTEXT%/api/items
        echo   Docs: %GATEWAY%%CONTEXT%/swagger-ui.html
        exit /b 0
    )
)

echo.
echo   Service deployed but not healthy yet. Check logs:
echo   kubectl logs -f deployment/%SERVICE_NAME% -n payments

#!/usr/bin/env bash
# deploy.sh — Build, provision, and deploy in one command.
# Usage:
#   ./deploy.sh 1.0.0          Deploy to microservice platform (Kind cluster)
#   ./deploy.sh --compose      Run standalone with docker-compose
set -uo pipefail
cd "$(dirname "$0")"

SERVICE_NAME="microservice-template"
GATEWAY="http://localhost:18090"

# ── Docker Compose mode ──────────────────────────────────────────────────────
if [ "${1:-}" = "--compose" ]; then
  echo ""
  echo "  Starting $SERVICE_NAME with Docker Compose..."
  echo ""

  echo "==> [1/3] Building JAR..."
  mvn clean package -DskipTests -q || { echo "BUILD FAILED"; exit 1; }

  echo "==> [2/3] Building and starting containers..."
  docker compose up -d --build

  echo "==> [3/3] Waiting for service to be healthy..."
  for i in $(seq 1 24); do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8081/microservice-template/actuator/health" 2>/dev/null)
    if [ "$STATUS" = "200" ] || [ "$STATUS" = "401" ]; then
      echo ""
      echo "┌────────────────────────────────────────────────────────────────┐"
      echo "│  $SERVICE_NAME is running (Docker Compose)                     │"
      echo "├────────────────────────────────────────────────────────────────┤"
      echo "│                                                                │"
      echo "│  App:       http://localhost:8081/microservice-template/        │"
      echo "│  Swagger:   http://localhost:8081/microservice-template/swagger-ui.html │"
      echo "│  Health:    http://localhost:8081/microservice-template/actuator/health  │"
      echo "│                                                                │"
      echo "│  Keycloak:  http://localhost:8080/auth/  (admin / admin)       │"
      echo "│  Postgres:  localhost:5432  (template / template123)           │"
      echo "│  Redis:     localhost:6379                                     │"
      echo "│  Kafka:     localhost:9092                                     │"
      echo "│  LocalStack: http://localhost:4566                             │"
      echo "│  OpenSearch: http://localhost:9200                             │"
      echo "│                                                                │"
      echo "│  Logs:   docker compose logs -f app                           │"
      echo "│  Stop:   docker compose down                                  │"
      echo "│  Clean:  docker compose down -v                               │"
      echo "└────────────────────────────────────────────────────────────────┘"
      exit 0
    fi
    echo "    Waiting... (attempt $i)"
    sleep 5
  done

  echo ""
  echo "  Service started but not healthy yet. Check logs:"
  echo "  docker compose logs -f app"
  exit 0
fi

# ── Platform mode (existing behavior) ────────────────────────────────────────
IMAGE_TAG="${1:-}"

if [ -z "$IMAGE_TAG" ]; then
  echo "Usage: ./deploy.sh <version>"
  echo "       ./deploy.sh --compose"
  echo ""
  echo "Examples:"
  echo "  ./deploy.sh 1.0.0       Deploy to microservice platform"
  echo "  ./deploy.sh --compose   Run standalone with Docker Compose"
  exit 1
fi

# Check platform
echo ""
echo "  Checking platform..."
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "$GATEWAY/devconsole/api/health" 2>/dev/null)
if [ "$HEALTH" != "200" ]; then
  echo "  ERROR: Platform not reachable at $GATEWAY"
  echo "  Run start-infra.sh first, or use: ./deploy.sh --compose"
  exit 1
fi
echo "  Platform is running."

# Step 1: Build
echo ""
echo "==> [1/4] Building JAR..."
mvn clean package -DskipTests -q || { echo "BUILD FAILED"; exit 1; }

# Step 2: Docker
echo "==> [2/4] Building Docker image: $SERVICE_NAME:$IMAGE_TAG"
docker build -t "$SERVICE_NAME:$IMAGE_TAG" . || { echo "DOCKER BUILD FAILED"; exit 1; }

# Step 3: Kind
echo "==> [3/4] Loading into Kind..."
if ! kind load docker-image "$SERVICE_NAME:$IMAGE_TAG" --name template-local 2>/dev/null; then
  echo "  Kind cluster not found. Is start-infra.sh running?"
  exit 1
fi
echo "  Loaded into Kind."

# Step 4: Deploy
echo "==> [4/4] Deploying $SERVICE_NAME:$IMAGE_TAG..."

# Build JSON body using a temp file — avoids all escaping issues
TMPFILE=$(mktemp /tmp/deploy-body-XXXXXX.json)
trap "rm -f '$TMPFILE'" EXIT

if [ -f provision.yml ]; then
  # Build JSON body safely — try jq first (works on Windows+Linux), then python3
  if command -v jq &>/dev/null; then
    jq -n --arg name "$SERVICE_NAME" --arg tag "$IMAGE_TAG" --arg yml "$(cat provision.yml)" \
      '{name: $name, tag: $tag, provisionYml: $yml}' > "$TMPFILE"
  elif python3 -c "print()" &>/dev/null; then
    python3 -c "
import json, sys
yml = open('provision.yml').read()
json.dump({'name': '$SERVICE_NAME', 'tag': '$IMAGE_TAG', 'provisionYml': yml}, sys.stdout)
" > "$TMPFILE"
  elif python -c "print()" &>/dev/null; then
    python -c "
import json, sys
yml = open('provision.yml').read()
json.dump({'name': '$SERVICE_NAME', 'tag': '$IMAGE_TAG', 'provisionYml': yml}, sys.stdout)
" > "$TMPFILE"
  else
    echo "  ERROR: jq or python required to deploy. Install one:"
    echo "    Windows: choco install jq   or   winget install Python.Python.3"
    echo "    Linux:   apt install jq     or   apt install python3"
    exit 1
  fi
else
  printf '{"name":"%s","tag":"%s"}' "$SERVICE_NAME" "$IMAGE_TAG" > "$TMPFILE"
fi

RESULT=$(curl -s -X POST "$GATEWAY/devconsole/api/services/deploy" \
  -H "Content-Type: application/json" \
  -d @"$TMPFILE")
echo "  $RESULT"

# Poll health
CONTEXT="/$(echo $SERVICE_NAME | sed 's/-service//')"
echo ""
echo "  Waiting for service to be healthy..."
for i in $(seq 1 12); do
  sleep 5
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$GATEWAY$CONTEXT/actuator/health" 2>/dev/null)
  if [ "$STATUS" = "200" ]; then
    echo ""
    echo "  $SERVICE_NAME:$IMAGE_TAG is LIVE"
    echo "  URL:  $GATEWAY$CONTEXT/actuator/health"
    echo "  API:  $GATEWAY$CONTEXT/api/items"
    echo "  Docs: $GATEWAY$CONTEXT/swagger-ui.html"
    exit 0
  fi
done

echo ""
echo "  Service deployed but not healthy yet. Check logs:"
echo "  kubectl logs -f deployment/$SERVICE_NAME -n payments"

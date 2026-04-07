#!/usr/bin/env bash
# deploy.sh — Build, provision, and deploy in one command.
# Usage: ./deploy.sh 1.0.0
set -uo pipefail
cd "$(dirname "$0")"

SERVICE_NAME="microservice-template"
IMAGE_TAG="${1:-}"
GATEWAY="http://localhost:18090"

if [ -z "$IMAGE_TAG" ]; then
  echo "Usage: ./deploy.sh <version>"
  echo "Example: ./deploy.sh 1.0.0"
  exit 1
fi

# Check platform
echo ""
echo "  Checking platform..."
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "$GATEWAY/devconsole/api/health" 2>/dev/null)
if [ "$HEALTH" != "200" ]; then
  echo "  ERROR: Platform not reachable at $GATEWAY"
  echo "  Run start-infra.sh first."
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

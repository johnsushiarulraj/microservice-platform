#!/usr/bin/env bash
# build.sh — Build the microservice JAR + Docker image.
# Usage:
#   ./scripts/build.sh 1.0.0        Build and load into Kind
#   ./scripts/build.sh --compose     Build JAR and Docker image only (for docker-compose)
set -euo pipefail

cd "$(dirname "$0")/.."

SERVICE_NAME="microservice-template"
COMPOSE_MODE=false

if [ "${1:-}" = "--compose" ]; then
  COMPOSE_MODE=true
  IMAGE_TAG="local"
else
  IMAGE_TAG="${1:-local}"
fi

echo ""
echo "  Service: $SERVICE_NAME"
echo "  Tag:     $IMAGE_TAG"
echo "  Mode:    $([ "$COMPOSE_MODE" = true ] && echo 'docker-compose' || echo 'platform')"
echo ""

echo "==> [1/2] Building JAR..."
mvn clean package -DskipTests -q
echo "    target/$SERVICE_NAME-*.jar"

echo "==> [2/2] Building Docker image..."
docker build -t "$SERVICE_NAME:$IMAGE_TAG" .

if [ "$COMPOSE_MODE" = false ]; then
  echo "==> [3/3] Loading into Kind cluster..."
  if kind load docker-image "$SERVICE_NAME:$IMAGE_TAG" --name template-local 2>/dev/null; then
    echo "    Loaded into Kind"
  else
    echo "    Kind cluster not found — load manually: kind load docker-image $SERVICE_NAME:$IMAGE_TAG --name template-local"
  fi
fi

echo ""
echo "Done: $SERVICE_NAME:$IMAGE_TAG"
if [ "$COMPOSE_MODE" = true ]; then
  echo "Run: docker compose up -d"
else
  echo "Deploy: DevConsole → Services → Deploy → name: $SERVICE_NAME, tag: $IMAGE_TAG"
fi

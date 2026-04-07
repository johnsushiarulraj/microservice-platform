#!/usr/bin/env bash
# build.sh — Build the microservice JAR + Docker image.
# Usage: ./scripts/build.sh 1.0.0
set -euo pipefail

cd "$(dirname "$0")/.."

SERVICE_NAME="microservice-template"
IMAGE_TAG="${1:-local}"

echo ""
echo "  Service: $SERVICE_NAME"
echo "  Tag:     $IMAGE_TAG"
echo ""

echo "==> [1/2] Building JAR..."
mvn clean package -DskipTests -q
echo "    target/$SERVICE_NAME-*.jar"

echo "==> [2/3] Building Docker image..."
docker build -t "$SERVICE_NAME:$IMAGE_TAG" .

echo "==> [3/3] Loading into Kind cluster..."
if kind load docker-image "$SERVICE_NAME:$IMAGE_TAG" --name template-local 2>/dev/null; then
  echo "    Loaded into Kind"
else
  echo "    Kind cluster not found — load manually: kind load docker-image $SERVICE_NAME:$IMAGE_TAG --name template-local"
fi

echo ""
echo "Done: $SERVICE_NAME:$IMAGE_TAG"
echo "Deploy: DevConsole → Services → Deploy → name: $SERVICE_NAME, tag: $IMAGE_TAG"

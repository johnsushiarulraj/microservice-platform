#!/usr/bin/env bash
# build.sh — Build the microservice JAR + Docker image + push to registry.
#
# Usage:
#   ./scripts/build.sh 1.0.0              # build + push to configured registry
#   ./scripts/build.sh 1.0.0 ghcr.io/org  # build + push to custom registry
#   ./scripts/build.sh                     # build only (local tag, no push)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
IMAGE_TAG="${1:-local}"

# Read config
if [ -f "$ROOT_DIR/config/build.conf" ]; then
  source "$ROOT_DIR/config/build.conf"
fi

REGISTRY="${2:-${REGISTRY:-}}"
SERVICE_NAME="${SERVICE_NAME:-microservice-template}"

cd "$ROOT_DIR"

echo "==> [1/3] Building JAR (skipping tests)..."
mvn clean package -pl "$SERVICE_NAME" -am -DskipTests -q
echo "    $SERVICE_NAME/target/$SERVICE_NAME-*.jar"

echo "==> [2/3] Building Docker image: $SERVICE_NAME:$IMAGE_TAG"
docker build -t "$SERVICE_NAME:$IMAGE_TAG" .

if [[ -n "$REGISTRY" ]]; then
  FULL_IMAGE="$REGISTRY/$SERVICE_NAME:$IMAGE_TAG"
  echo "==> [3/3] Pushing to $FULL_IMAGE ..."
  docker tag "$SERVICE_NAME:$IMAGE_TAG" "$FULL_IMAGE"
  docker push "$FULL_IMAGE"
  echo "✓ Pushed $FULL_IMAGE"
else
  echo "==> [3/3] Skipping push (no registry configured)"
  echo "✓ Image built: $SERVICE_NAME:$IMAGE_TAG"
  echo "  To push: ./scripts/build.sh $IMAGE_TAG <your-registry>"
fi

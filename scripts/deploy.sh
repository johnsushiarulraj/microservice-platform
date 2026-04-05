#!/usr/bin/env bash
# deploy.sh — Build and deploy the gateway, then deploy the microservice from its registry image.
# Usage: ./scripts/deploy.sh [image-tag]
#   image-tag defaults to "local" (expects images pre-loaded via build.sh)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
NAMESPACE="payments"
CLUSTER_NAME="template-local"
IMAGE_TAG="${1:-local}"

MS_HELM_CHART="$ROOT_DIR/infrastructure/helm/microservice-template"
GW_HELM_CHART="$ROOT_DIR/infrastructure/helm/api-gateway"

cd "$ROOT_DIR"

# ── Build gateway image ───────────────────────────────────────────────────────
echo "==> [1/4] Building api-gateway JAR..."
mvn clean package -DskipTests -q

echo "==> [2/4] Building api-gateway Docker image..."
docker build -t "api-gateway:$IMAGE_TAG" -f Dockerfile.gateway .

echo "==> [3/4] Loading api-gateway image into Kind cluster '$CLUSTER_NAME'..."
kind load docker-image "api-gateway:$IMAGE_TAG" --name "$CLUSTER_NAME"

# ── Deploy via Helm ───────────────────────────────────────────────────────────
echo "==> [4/4] Deploying to Kubernetes namespace '$NAMESPACE'..."

# microservice-template — image must already be in the cluster (built from template repo)
helm upgrade --install microservice-template "$MS_HELM_CHART" \
  -f "$MS_HELM_CHART/values-local.yaml" \
  --set image.tag="$IMAGE_TAG" \
  -n "$NAMESPACE" \
  --wait --timeout 180s

# api-gateway
helm upgrade --install api-gateway "$GW_HELM_CHART" \
  -f "$GW_HELM_CHART/values-local.yaml" \
  --set image.tag="$IMAGE_TAG" \
  -n "$NAMESPACE" \
  --wait --timeout 120s

echo ""
echo "✓ Services deployed."
kubectl get pods -n "$NAMESPACE" | grep -E "microservice|api-gateway"

# ── Port-forwards ─────────────────────────────────────────────────────────────
pkill -f "kubectl port-forward.*svc/microservice-template" 2>/dev/null || true
pkill -f "kubectl port-forward.*svc/api-gateway"           2>/dev/null || true
sleep 1

kubectl port-forward -n "$NAMESPACE" svc/microservice-template 18080:8080 >/tmp/pf-microservice.log 2>&1 & echo $! >/tmp/pf-microservice.pid
kubectl port-forward -n "$NAMESPACE" svc/api-gateway           18090:8090 >/tmp/pf-gateway.log     2>&1 & echo $! >/tmp/pf-gateway.pid

# start infra port-forwards if not running
kill -0 "$(cat /tmp/pf-keycloak.pid  2>/dev/null)" 2>/dev/null || { kubectl port-forward -n "$NAMESPACE" svc/keycloak 18081:8080 >/tmp/pf-keycloak.log 2>&1 & echo $! >/tmp/pf-keycloak.pid; }
kill -0 "$(cat /tmp/pf-grafana.pid   2>/dev/null)" 2>/dev/null || { kubectl port-forward -n "$NAMESPACE" svc/monitoring-grafana 13000:80 >/tmp/pf-grafana.log 2>&1 & echo $! >/tmp/pf-grafana.pid; }

sleep 2
echo ""
echo "┌──────────────────────────────────────────────────────────────────────┐"
echo "│  All services available                                              │"
echo "├──────────────────────────────────────────────────────────────────────┤"
echo "│  Via Gateway (use this) →  http://localhost:18090/template/...       │"
echo "│    Health   →  http://localhost:18090/template/actuator/health       │"
echo "│    Swagger  →  http://localhost:18090/template/swagger-ui.html       │"
echo "│    API      →  http://localhost:18090/template/api/v1/templates      │"
echo "│    (Bearer token required — get one from Keycloak below)             │"
echo "│                                                                      │"
echo "│  Gateway health  →  http://localhost:18090/actuator/health           │"
echo "│  Direct service  →  http://localhost:18080/template/actuator/health  │"
echo "│  Keycloak        →  http://localhost:18081  (admin / admin)          │"
echo "│  Grafana         →  http://localhost:13000  (admin / admin)          │"
echo "└──────────────────────────────────────────────────────────────────────┘"
echo ""
echo "  Get a token:"
echo "    curl -s -X POST http://localhost:18081/realms/template/protocol/openid-connect/token \\"
echo "      -d 'grant_type=password&client_id=microservice-template&client_secret=template-secret&username=testuser&password=password' \\"
echo "      | grep -o '\"access_token\":\"[^\"]*\"'"

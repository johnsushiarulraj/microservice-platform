#!/usr/bin/env bash
# destroy.sh — Remove deployed services from the cluster.
# Usage:
#   ./scripts/destroy.sh          — remove microservice-template + api-gateway (keep infra)
#   ./scripts/destroy.sh --all    — delete the entire Kind cluster
set -euo pipefail

NAMESPACE="payments"
CLUSTER_NAME="template-local"

if [[ "${1:-}" == "--all" ]]; then
  echo "==> Deleting entire cluster '$CLUSTER_NAME'..."
  pkill -f "kubectl port-forward.*payments" 2>/dev/null || true
  kind delete cluster --name "$CLUSTER_NAME"
  rm -f /tmp/pf-*.pid /tmp/pf-*.log
  echo "✓ Cluster deleted."
else
  echo "==> Removing microservice-template and api-gateway from '$NAMESPACE'..."

  pkill -f "kubectl port-forward.*svc/microservice-template" 2>/dev/null || true
  pkill -f "kubectl port-forward.*svc/api-gateway"           2>/dev/null || true
  rm -f /tmp/pf-microservice.pid /tmp/pf-microservice.log
  rm -f /tmp/pf-gateway.pid      /tmp/pf-gateway.log

  helm uninstall api-gateway           -n "$NAMESPACE" 2>/dev/null || true
  helm uninstall microservice-template -n "$NAMESPACE" 2>/dev/null || true

  echo ""
  echo "✓ Services removed. Infrastructure is still running."
  echo "  Run './scripts/deploy.sh' to redeploy."
  kubectl get pods -n "$NAMESPACE" | grep -Ev "microservice|api-gateway" || true
fi

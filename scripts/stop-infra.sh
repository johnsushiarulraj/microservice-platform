#!/usr/bin/env bash
# stop-infra.sh — Stop the infrastructure.
# Usage:
#   ./scripts/stop-infra.sh          — stop cluster (data preserved in ./data/)
#   ./scripts/stop-infra.sh --clean  — stop cluster + wipe all persistent data
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
CLUSTER_NAME="template-local"

cd "$ROOT_DIR"

# ── Kill watchdog + port-forwards ─────────────────────────────────────────────
echo "==> Stopping watchdog and port-forwards..."
pkill -f "port-forward-watchdog" 2>/dev/null || true
pkill -f "kubectl port-forward.*payments" 2>/dev/null || true
rm -f /tmp/pf-*.pid /tmp/pf-*.log /tmp/pf-watchdog.log

# ── Stop UI containers (running outside Kind) ────────────────────────────────
echo "==> Stopping UI containers..."
docker rm -f pgadmin dynamodb-admin kafka-ui spring-boot-admin 2>/dev/null || true

# ── Delete Kind cluster ───────────────────────────────────────────────────────
echo "==> Deleting Kind cluster '$CLUSTER_NAME'..."
kind delete cluster --name "$CLUSTER_NAME" 2>/dev/null || true

# ── Clean data if requested ───────────────────────────────────────────────────
if [[ "${1:-}" == "--clean" ]]; then
  echo "==> Wiping persistent data in ./data/..."
  rm -rf "$ROOT_DIR/data"
  echo "✓ Data wiped. Next start-infra.sh will be a fresh start."
else
  echo ""
  echo "✓ Infrastructure stopped. Data preserved in ./data/"
  echo "  Run './scripts/start-infra.sh' to resume where you left off."
  echo "  Run './scripts/stop-infra.sh --clean' to wipe all data."
fi

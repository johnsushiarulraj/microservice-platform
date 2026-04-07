#!/usr/bin/env bash
# port-forward-watchdog.sh — Monitors and restarts dead port-forwards
# Usage: ./scripts/port-forward-watchdog.sh &
# Stop:  kill $(cat /tmp/pf-watchdog.pid)
set -euo pipefail

NAMESPACE="payments"
INTERVAL=15  # seconds between checks

# Services that still need port-forward (not covered by NodePort)
# Format: "name|service|local_port|remote_port"
FORWARDS=(
  "localstack|svc/localstack|14566|4566"
  "opensearch|svc/opensearch-cluster-master|19200|9200"
  "kafka|svc/kafka-kafka-bootstrap|19092|9092"
  "osdash|svc/opensearch-dashboards|15601|5601"
)

echo $$ > /tmp/pf-watchdog.pid
echo "Port-forward watchdog started (PID: $$, checking every ${INTERVAL}s)"

while true; do
  for entry in "${FORWARDS[@]}"; do
    IFS='|' read -r name svc local_port remote_port <<< "$entry"

    # Check if port is reachable
    if ! curl -s -o /dev/null --connect-timeout 2 "http://localhost:$local_port/" 2>/dev/null; then
      # Kill any existing stale forward
      pkill -f "port-forward.*$local_port:$remote_port" 2>/dev/null || true
      sleep 1

      # Restart
      kubectl port-forward -n "$NAMESPACE" "$svc" "$local_port:$remote_port" \
        >/tmp/pf-"$name".log 2>&1 &
      echo "[$(date +%H:%M:%S)] Restarted: $name ($local_port → $remote_port)"
    fi
  done

  sleep "$INTERVAL"
done

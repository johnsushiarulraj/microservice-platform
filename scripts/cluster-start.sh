#!/usr/bin/env bash
# cluster-start.sh — Create the Kind cluster and install all infrastructure + gateway.
# Usage: ./scripts/cluster-start.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
CLUSTER_NAME="template-local"
NAMESPACE="payments"

cd "$ROOT_DIR"

# ── 1. Kind cluster ──────────────────────────────────────────────────────────
echo "==> [1/11] Creating Kind cluster '$CLUSTER_NAME'..."
if kind get clusters 2>/dev/null | grep -q "^${CLUSTER_NAME}$"; then
  echo "    Cluster already exists, skipping."
else
  kind create cluster --config infrastructure/kind/cluster-config.yaml --name "$CLUSTER_NAME"
fi

# ── 2. Namespace ─────────────────────────────────────────────────────────────
echo "==> [2/11] Creating namespace '$NAMESPACE'..."
kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -

# ── 3. NGINX Ingress Controller ───────────────────────────────────────────────
echo "==> [3/11] Installing NGINX Ingress Controller..."
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=120s

# ── 4. Helm repos ─────────────────────────────────────────────────────────────
echo "==> [4/11] Adding Helm repos..."
helm repo add bitnami               https://charts.bitnami.com/bitnami                 2>/dev/null || true
helm repo add localstack            https://helm.localstack.cloud                      2>/dev/null || true
helm repo add grafana               https://grafana.github.io/helm-charts              2>/dev/null || true
helm repo add prometheus-community  https://prometheus-community.github.io/helm-charts 2>/dev/null || true
helm repo add opensearch            https://opensearch-project.github.io/helm-charts   2>/dev/null || true
helm repo add strimzi               https://strimzi.io/charts/                         2>/dev/null || true
helm repo update

# ── 5. PostgreSQL ─────────────────────────────────────────────────────────────
echo "==> [5/11] Installing PostgreSQL..."
helm upgrade --install postgres bitnami/postgresql -n "$NAMESPACE" \
  --set auth.database=template \
  --set auth.username=template \
  --set auth.password=template123 \
  --set primary.resources.requests.memory=256Mi \
  --set primary.resources.limits.memory=512Mi \
  --wait --timeout 120s

# ── 6. Redis ──────────────────────────────────────────────────────────────────
echo "==> [6/11] Installing Redis..."
helm upgrade --install redis bitnami/redis -n "$NAMESPACE" \
  --set auth.enabled=false \
  --set master.resources.requests.memory=128Mi \
  --set master.resources.limits.memory=256Mi \
  --set replica.replicaCount=0 \
  --wait --timeout 120s

# ── 7. Kafka (Strimzi KRaft) ──────────────────────────────────────────────────
echo "==> [7/11] Installing Kafka via Strimzi..."
helm upgrade --install strimzi-operator strimzi/strimzi-kafka-operator \
  -n "$NAMESPACE" \
  --set resources.requests.memory=256Mi \
  --set resources.limits.memory=512Mi \
  --wait --timeout 120s

kubectl apply -f infrastructure/kubernetes/kafka-cluster.yaml

echo "    Waiting for Kafka broker to be ready (~2 min)..."
kubectl rollout status statefulset/kafka-kafka -n "$NAMESPACE" --timeout=300s

# ── 8. LocalStack ─────────────────────────────────────────────────────────────
echo "==> [8/11] Installing LocalStack..."
helm upgrade --install localstack localstack/localstack -n "$NAMESPACE" \
  --set image.repository=localstack/localstack \
  --set image.tag=3.0 \
  --set resources.requests.memory=256Mi \
  --set resources.limits.memory=512Mi \
  --wait --timeout 120s

kubectl apply -f infrastructure/kubernetes/localstack-init-job.yaml

# ── 9. Keycloak ───────────────────────────────────────────────────────────────
echo "==> [9/11] Installing Keycloak..."
kubectl apply -f infrastructure/kubernetes/keycloak.yaml
kubectl rollout status deployment/keycloak -n "$NAMESPACE" --timeout=300s

# ── 10. Observability stack ───────────────────────────────────────────────────
echo "==> [10/11] Installing OpenSearch, Prometheus, Grafana, Loki..."

helm upgrade --install opensearch opensearch/opensearch -n "$NAMESPACE" \
  --set singleNode=true \
  --set "extraEnvs[0].name=OPENSEARCH_INITIAL_ADMIN_PASSWORD" \
  --set "extraEnvs[0].value=Str0ngP@ssw0rd#2026" \
  --set security.enabled=false \
  --set opensearchJavaOpts="-Xms256m -Xmx256m" \
  --set resources.requests.memory=512Mi \
  --set resources.limits.memory=768Mi \
  --wait --timeout 300s

helm upgrade --install monitoring prometheus-community/kube-prometheus-stack -n "$NAMESPACE" \
  --set grafana.adminPassword=admin \
  --set grafana.sidecar.datasources.defaultDatasourceEnabled=false \
  --set grafana.resources.requests.memory=128Mi \
  --set prometheus.prometheusSpec.resources.requests.memory=256Mi \
  --set prometheusOperator.resources.requests.memory=128Mi \
  --wait --timeout 300s

helm upgrade --install loki grafana/loki-stack -n "$NAMESPACE" \
  --set loki.resources.requests.memory=128Mi \
  --set promtail.enabled=true \
  --wait --timeout 180s

echo ""
echo "==> [11/11] Cluster ready. Run './scripts/deploy.sh' to deploy services."
echo ""
kubectl get pods -n "$NAMESPACE"

# ── Port-forwards (background) ────────────────────────────────────────────────
pkill -f "kubectl port-forward.*payments" 2>/dev/null || true
sleep 1

echo ""
echo "==> Starting port-forwards..."
kubectl port-forward -n "$NAMESPACE" svc/monitoring-grafana   13000:80   >/tmp/pf-grafana.log     2>&1 & echo $! >/tmp/pf-grafana.pid
kubectl port-forward -n "$NAMESPACE" svc/keycloak             18081:8080 >/tmp/pf-keycloak.log    2>&1 & echo $! >/tmp/pf-keycloak.pid
kubectl port-forward -n "$NAMESPACE" \
  svc/prometheus-monitoring-kube-prometheus-prometheus        19090:9090 >/tmp/pf-prometheus.log  2>&1 & echo $! >/tmp/pf-prometheus.pid
sleep 2

echo ""
echo "┌──────────────────────────────────────────────────────────────┐"
echo "│  Infrastructure ready                                        │"
echo "├──────────────────────────────────────────────────────────────┤"
echo "│  Keycloak   →  http://localhost:18081  (admin / admin)       │"
echo "│  Grafana    →  http://localhost:13000  (admin / admin)       │"
echo "│  Prometheus →  http://localhost:19090                        │"
echo "│                                                              │"
echo "│  Next: ./scripts/deploy.sh  to deploy services              │"
echo "└──────────────────────────────────────────────────────────────┘"

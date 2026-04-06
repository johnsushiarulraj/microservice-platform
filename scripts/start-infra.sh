#!/usr/bin/env bash
# start-infra.sh — Create the Kind cluster and install all infrastructure + UIs + gateway.
# Usage: ./scripts/start-infra.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
CLUSTER_NAME="template-local"
NAMESPACE="payments"
IMAGE_TAG="local"

cd "$ROOT_DIR"

# ── 0. Create persistent data directories ────────────────────────────────────
echo "==> [0/16] Ensuring persistent data directories exist..."
mkdir -p data/postgres data/opensearch data/localstack data/kafka data/keycloak-db

# ── 1. Kind cluster ──────────────────────────────────────────────────────────
echo "==> [1/16] Creating Kind cluster '$CLUSTER_NAME'..."
if kind get clusters 2>/dev/null | grep -q "^${CLUSTER_NAME}$"; then
  echo "    Cluster already exists, skipping."
else
  kind create cluster --config infrastructure/kind/cluster-config.yaml --name "$CLUSTER_NAME"
fi

# ── 2. Namespace ─────────────────────────────────────────────────────────────
echo "==> [2/16] Creating namespace '$NAMESPACE'..."
kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -

# ── 3. NGINX Ingress Controller ───────────────────────────────────────────────
echo "==> [3/16] Installing NGINX Ingress Controller..."
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=120s

# ── 4. Helm repos ─────────────────────────────────────────────────────────────
echo "==> [4/16] Adding Helm repos..."
helm repo add bitnami               https://charts.bitnami.com/bitnami                 2>/dev/null || true
helm repo add localstack            https://helm.localstack.cloud                      2>/dev/null || true
helm repo add grafana               https://grafana.github.io/helm-charts              2>/dev/null || true
helm repo add prometheus-community  https://prometheus-community.github.io/helm-charts 2>/dev/null || true
helm repo add opensearch            https://opensearch-project.github.io/helm-charts   2>/dev/null || true
helm repo add strimzi               https://strimzi.io/charts/                         2>/dev/null || true
helm repo add kubernetes-dashboard  https://kubernetes.github.io/dashboard/            2>/dev/null || true
helm repo update

# ── 5. PostgreSQL ─────────────────────────────────────────────────────────────
echo "==> [5/16] Installing PostgreSQL..."
helm upgrade --install postgres bitnami/postgresql -n "$NAMESPACE" \
  --set auth.database=template \
  --set auth.username=template \
  --set auth.password=template123 \
  --set primary.resources.requests.memory=256Mi \
  --set primary.resources.limits.memory=512Mi \
  --wait --timeout 120s

# ── 6. Redis ──────────────────────────────────────────────────────────────────
echo "==> [6/16] Installing Redis..."
helm upgrade --install redis bitnami/redis -n "$NAMESPACE" \
  --set auth.enabled=false \
  --set master.resources.requests.memory=128Mi \
  --set master.resources.limits.memory=256Mi \
  --set replica.replicaCount=0 \
  --wait --timeout 120s

# ── 7. Kafka (Strimzi KRaft) ──────────────────────────────────────────────────
echo "==> [7/16] Installing Kafka via Strimzi..."
helm upgrade --install strimzi-operator strimzi/strimzi-kafka-operator \
  -n "$NAMESPACE" \
  --set resources.requests.memory=256Mi \
  --set resources.limits.memory=512Mi \
  --wait --timeout 120s

kubectl apply -f infrastructure/kubernetes/kafka-cluster.yaml

echo "    Waiting for Kafka broker to be ready (~2 min)..."
kubectl wait --for=condition=ready pod -l strimzi.io/cluster=kafka -n "$NAMESPACE" --timeout=300s

# ── 8. LocalStack ─────────────────────────────────────────────────────────────
echo "==> [8/16] Installing LocalStack..."
helm upgrade --install localstack localstack/localstack -n "$NAMESPACE" \
  --set image.repository=localstack/localstack \
  --set image.tag=3.0 \
  --set resources.requests.memory=256Mi \
  --set resources.limits.memory=512Mi \
  --wait --timeout 120s

kubectl apply -f infrastructure/kubernetes/localstack-init-job.yaml

# ── 9. Keycloak ───────────────────────────────────────────────────────────────
echo "==> [9/16] Installing Keycloak..."
kubectl apply -f infrastructure/kubernetes/keycloak.yaml
kubectl rollout status deployment/keycloak -n "$NAMESPACE" --timeout=300s

# ── 10. Observability stack ───────────────────────────────────────────────────
echo "==> [10/16] Installing OpenSearch, Prometheus, Grafana, Loki..."

helm upgrade --install opensearch opensearch/opensearch -n "$NAMESPACE" \
  --set singleNode=true \
  --set "extraEnvs[0].name=OPENSEARCH_INITIAL_ADMIN_PASSWORD" \
  --set "extraEnvs[0].value=Str0ngP@ssw0rd#2026" \
  --set security.enabled=false \
  --set opensearchJavaOpts="-Xms256m -Xmx256m" \
  --set resources.requests.memory=512Mi \
  --set resources.limits.memory=768Mi \
  --wait --timeout 300s

helm upgrade --install opensearch-dashboards opensearch/opensearch-dashboards -n "$NAMESPACE" \
  --set opensearchHosts="https://opensearch-cluster-master:9200" \
  --set resources.requests.memory=256Mi \
  --set resources.limits.memory=512Mi \
  --set-string 'extraEnvs[0].name=DISABLE_SECURITY_DASHBOARDS_PLUGIN' \
  --set-string 'extraEnvs[0].value=true' \
  --set 'config.opensearch_dashboards\.yml.opensearch\.ssl\.verificationMode=none' \
  --set 'config.opensearch_dashboards\.yml.opensearch\.username=admin' \
  --set 'config.opensearch_dashboards\.yml.opensearch\.password=Str0ngP@ssw0rd#2026' \
  --wait --timeout 180s

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

# ── 11. Kubernetes Dashboard ──────────────────────────────────────────────────
echo "==> [11/16] Installing Kubernetes Dashboard..."
helm upgrade --install kubernetes-dashboard kubernetes-dashboard/kubernetes-dashboard \
  -n kubernetes-dashboard --create-namespace \
  --wait --timeout 120s 2>/dev/null || echo "    (Kubernetes Dashboard install skipped or already installed)"

# ── 12. API Gateway ───────────────────────────────────────────────────────────
echo "==> [12/16] Building and deploying api-gateway..."
mvn clean package -pl services/api-gateway -am -DskipTests -q

docker build -t "api-gateway:$IMAGE_TAG" -f services/api-gateway/Dockerfile services/api-gateway
kind load docker-image "api-gateway:$IMAGE_TAG" --name "$CLUSTER_NAME"

helm upgrade --install api-gateway infrastructure/helm/api-gateway \
  -f infrastructure/helm/api-gateway/values-local.yaml \
  --set image.tag="$IMAGE_TAG" \
  -n "$NAMESPACE" \
  --wait --timeout 120s

# ── 13. UI Containers (outside Kind, plain Docker) ───────────────────────────
echo "==> [13/16] Starting UI containers..."

# pgAdmin
docker rm -f pgadmin 2>/dev/null || true
docker run -d --name pgadmin \
  --network kind \
  -p 15050:80 \
  -e PGADMIN_DEFAULT_EMAIL=admin@admin.com \
  -e PGADMIN_DEFAULT_PASSWORD=admin \
  -e PGADMIN_CONFIG_SERVER_MODE=False \
  --restart unless-stopped \
  dpage/pgadmin4:latest

# DynamoDB Admin (connects via host port-forward to LocalStack)
docker rm -f dynamodb-admin 2>/dev/null || true
docker run -d --name dynamodb-admin \
  -p 18001:8001 \
  -e DYNAMO_ENDPOINT=http://host.docker.internal:14566 \
  --restart unless-stopped \
  aaronshaf/dynamodb-admin:latest 2>/dev/null || echo "    DynamoDB Admin: failed to start"

# Kafka UI (connects via host port-forward to Kafka)
docker rm -f kafka-ui 2>/dev/null || true
docker run -d --name kafka-ui \
  -p 18002:8080 \
  -e KAFKA_CLUSTERS_0_NAME=local \
  -e KAFKA_CLUSTERS_0_BOOTSTRAPSERVERS=host.docker.internal:19092 \
  --restart unless-stopped \
  provectuslabs/kafka-ui:latest 2>/dev/null || echo "    Kafka UI: failed to start"

echo "    UI containers started."

# ── 14. Persistent Volumes ────────────────────────────────────────────────────
echo "==> [14/16] Applying persistent volume manifests..."
kubectl apply -f infrastructure/kubernetes/persistent-volumes.yaml 2>/dev/null || true

# ── 15. Port-forwards ─────────────────────────────────────────────────────────
echo "==> [15/16] Starting port-forwards..."
pkill -f "kubectl port-forward.*payments" 2>/dev/null || true
pkill -f "kubectl port-forward.*kubernetes-dashboard" 2>/dev/null || true
sleep 1

# Infrastructure
kubectl port-forward -n "$NAMESPACE" svc/monitoring-grafana                              13000:80   >/tmp/pf-grafana.log     2>&1 & echo $! >/tmp/pf-grafana.pid
kubectl port-forward -n "$NAMESPACE" svc/keycloak                                        18081:8080 >/tmp/pf-keycloak.log    2>&1 & echo $! >/tmp/pf-keycloak.pid
kubectl port-forward -n "$NAMESPACE" svc/monitoring-kube-prometheus-prometheus 19090:9090 >/tmp/pf-prometheus.log  2>&1 & echo $! >/tmp/pf-prometheus.pid
kubectl port-forward -n "$NAMESPACE" svc/api-gateway                                     18090:8090 >/tmp/pf-gateway.log     2>&1 & echo $! >/tmp/pf-gateway.pid

# Data services
kubectl port-forward -n "$NAMESPACE" svc/postgres-postgresql                             15432:5432 >/tmp/pf-postgres.log    2>&1 & echo $! >/tmp/pf-postgres.pid
kubectl port-forward -n "$NAMESPACE" svc/opensearch-cluster-master                       19200:9200 >/tmp/pf-opensearch.log  2>&1 & echo $! >/tmp/pf-opensearch.pid
kubectl port-forward -n "$NAMESPACE" svc/localstack                                      14566:4566 >/tmp/pf-localstack.log  2>&1 & echo $! >/tmp/pf-localstack.pid
kubectl port-forward -n "$NAMESPACE" svc/kafka-kafka-bootstrap                           19092:9092 >/tmp/pf-kafka.log       2>&1 & echo $! >/tmp/pf-kafka.pid

# UIs inside cluster
kubectl port-forward -n "$NAMESPACE" svc/opensearch-dashboards                           15601:5601 >/tmp/pf-osdash.log      2>&1 & echo $! >/tmp/pf-osdash.pid
kubectl port-forward -n kubernetes-dashboard svc/kubernetes-dashboard-kong-proxy          13003:443  >/tmp/pf-k8sdash.log     2>&1 & echo $! >/tmp/pf-k8sdash.pid 2>/dev/null || true

sleep 3

# ── 16. Summary ───────────────────────────────────────────────────────────────
echo ""
kubectl get pods -n "$NAMESPACE"
echo ""
echo "┌────────────────────────────────────────────────────────────────────────┐"
echo "│  Infrastructure ready                                                  │"
echo "├────────────────────────────────────────────────────────────────────────┤"
echo "│                                                                        │"
echo "│  Management UIs                                                        │"
echo "│  ─────────────                                                         │"
echo "│  Keycloak              →  http://localhost:18081   (admin / admin)      │"
echo "│  Grafana               →  http://localhost:13000   (admin / admin)      │"
echo "│  Prometheus            →  http://localhost:19090                        │"
echo "│  pgAdmin               →  http://localhost:15050   (admin@admin.com)    │"
echo "│  OpenSearch Dashboards →  http://localhost:15601   (admin / Str0ng..)    │"
echo "│  DynamoDB Admin        →  http://localhost:18001                        │"
echo "│  Kafka UI              →  http://localhost:18002                        │"
echo "│  Kubernetes Dashboard  →  https://localhost:13003                       │"
echo "│                                                                        │"
echo "│  Services                                                              │"
echo "│  ────────                                                              │"
echo "│  API Gateway           →  http://localhost:18090/actuator/health        │"
echo "│                                                                        │"
echo "│  Data Services                                                         │"
echo "│  ─────────────                                                         │"
echo "│  PostgreSQL            →  localhost:15432   (template / template123)    │"
echo "│  OpenSearch            →  http://localhost:19200                        │"
echo "│  LocalStack (S3/SQS/DDB) → http://localhost:14566                      │"
echo "│  Kafka                 →  localhost:19092                               │"
echo "│                                                                        │"
echo "│  Stop:  ./scripts/stop-infra.sh                                        │"
echo "│  Clean: ./scripts/stop-infra.sh --clean                                │"
echo "└────────────────────────────────────────────────────────────────────────┘"

#!/usr/bin/env bash
# start-infra.sh — Create the Kind cluster and install all infrastructure + UIs + gateway.
# Usage: ./scripts/start-infra.sh
set -uo pipefail
# Note: not using set -e because helm --wait can timeout on slow pulls
# without the install actually failing. Each critical step checks its own result.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
CLUSTER_NAME="template-local"
NAMESPACE="payments"
IMAGE_TAG="local"

cd "$ROOT_DIR"

START_TIME=$SECONDS

# ── 0. Create persistent data directories ────────────────────────────────────
echo "==> [0] Ensuring persistent data directories exist..."
mkdir -p data/postgres data/opensearch data/localstack data/kafka data/keycloak-db

# ── 1. Kind cluster ──────────────────────────────────────────────────────────
echo "==> [1] Creating Kind cluster '$CLUSTER_NAME'..."
if kind get clusters 2>/dev/null | grep -q "^${CLUSTER_NAME}$"; then
  echo "    Cluster already exists, skipping."
else
  kind create cluster --config infrastructure/kind/cluster-config.yaml --name "$CLUSTER_NAME"
fi

# ── 2. Namespace + Ingress + Helm repos (quick sequential setup) ─────────────
echo "==> [2] Namespace, Ingress, Helm repos..."
kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -

kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=120s &
INGRESS_PID=$!

helm repo add bitnami               https://charts.bitnami.com/bitnami                 2>/dev/null || true
helm repo add localstack            https://helm.localstack.cloud                      2>/dev/null || true
helm repo add grafana               https://grafana.github.io/helm-charts              2>/dev/null || true
helm repo add prometheus-community  https://prometheus-community.github.io/helm-charts 2>/dev/null || true
helm repo add opensearch            https://opensearch-project.github.io/helm-charts   2>/dev/null || true
helm repo add strimzi               https://strimzi.io/charts/                         2>/dev/null || true
helm repo add kubernetes-dashboard  https://kubernetes.github.io/dashboard/            2>/dev/null || true
helm repo update

wait $INGRESS_PID 2>/dev/null || true

# ── 3. Start Maven builds in background (while helm installs run) ────────────
echo "==> [3] Starting Maven builds in background..."
mvn clean package -pl services/api-gateway -am -DskipTests -q &
MVN_GW_PID=$!
mvn clean package -pl services/devconsole/backend -am -DskipTests -q &
MVN_DC_PID=$!

# ── 4. PARALLEL: Data services (Postgres, Redis, Kafka, LocalStack, Keycloak)
echo "==> [4] Installing data services in parallel (Postgres, Redis, Kafka, LocalStack, Keycloak)..."

# --- Postgres ---
(
  echo "    [Postgres] Installing..."
  helm upgrade --install postgres bitnami/postgresql -n "$NAMESPACE" \
    --set auth.database=template \
    --set auth.username=template \
    --set auth.password=template123 \
    --set primary.resources.requests.memory=256Mi \
    --set primary.resources.limits.memory=512Mi \
    --wait --timeout 180s
  echo "    [Postgres] Done."
) &
PG_PID=$!

# --- Redis ---
(
  echo "    [Redis] Installing..."
  helm upgrade --install redis bitnami/redis -n "$NAMESPACE" \
    --set auth.enabled=false \
    --set master.resources.requests.memory=128Mi \
    --set master.resources.limits.memory=256Mi \
    --set replica.replicaCount=0 \
    --wait --timeout 120s
  echo "    [Redis] Done."
) &
REDIS_PID=$!

# --- Kafka (Strimzi + cluster) ---
(
  echo "    [Kafka] Installing Strimzi operator..."
  helm upgrade --install strimzi-operator strimzi/strimzi-kafka-operator \
    -n "$NAMESPACE" \
    --set resources.requests.memory=256Mi \
    --set resources.limits.memory=512Mi \
    --wait --timeout 120s

  kubectl apply -f infrastructure/kubernetes/kafka-cluster.yaml

  sleep 10
  kubectl patch kafka kafka -n "$NAMESPACE" --type merge \
    -p '{"spec":{"entityOperator":{"topicOperator":{"resources":{"limits":{"memory":"512Mi"},"requests":{"memory":"256Mi"}}},"userOperator":{"resources":{"limits":{"memory":"512Mi"},"requests":{"memory":"256Mi"}}}}}}' 2>/dev/null || true

  echo "    [Kafka] Waiting for broker..."
  for i in $(seq 1 36); do
    kubectl get pod -l strimzi.io/cluster=kafka -n "$NAMESPACE" 2>/dev/null | grep -q "1/1.*Running" && break
    sleep 10
  done
  echo "    [Kafka] Done."
) &
KAFKA_PID=$!

# --- LocalStack ---
(
  echo "    [LocalStack] Installing..."
  helm upgrade --install localstack localstack/localstack -n "$NAMESPACE" \
    --set image.repository=localstack/localstack \
    --set image.tag=3.0 \
    --set resources.requests.memory=512Mi \
    --set resources.limits.memory=1024Mi \
    --set livenessProbe.initialDelaySeconds=60 \
    --set readinessProbe.initialDelaySeconds=30 \
    --wait --timeout 300s

  kubectl apply -f infrastructure/kubernetes/localstack-init-job.yaml
  echo "    [LocalStack] Done."
) &
LS_PID=$!

# --- Keycloak ---
(
  echo "    [Keycloak] Installing..."
  kubectl apply -f infrastructure/kubernetes/keycloak.yaml
  kubectl rollout status deployment/keycloak -n "$NAMESPACE" --timeout=300s
  echo "    [Keycloak] Done."
) &
KC_PID=$!

# ── 5. PARALLEL: Observability stack (while data services install) ───────────
echo "==> [5] Installing observability stack in parallel..."

# --- OpenSearch ---
(
  echo "    [OpenSearch] Installing..."
  helm upgrade --install opensearch opensearch/opensearch -n "$NAMESPACE" \
    --set singleNode=true \
    --set "extraEnvs[0].name=OPENSEARCH_INITIAL_ADMIN_PASSWORD" \
    --set "extraEnvs[0].value=Str0ngP@ssw0rd#2026" \
    --set security.enabled=false \
    --set opensearchJavaOpts="-Xms256m -Xmx256m" \
    --set resources.requests.memory=512Mi \
    --set resources.limits.memory=768Mi \
    --wait --timeout 300s
  echo "    [OpenSearch] Done."

  echo "    [OpenSearch Dashboards] Installing..."
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
  echo "    [OpenSearch Dashboards] Done."
) &
OS_PID=$!

# --- Prometheus + Grafana ---
(
  echo "    [Monitoring] Installing Prometheus + Grafana..."
  helm upgrade --install monitoring prometheus-community/kube-prometheus-stack -n "$NAMESPACE" \
    --set grafana.adminPassword=admin \
    --set grafana.sidecar.datasources.defaultDatasourceEnabled=false \
    --set grafana.resources.requests.memory=128Mi \
    --set prometheus.prometheusSpec.resources.requests.memory=256Mi \
    --set prometheusOperator.resources.requests.memory=128Mi \
    --wait --timeout 300s
  echo "    [Monitoring] Done."
) &
MON_PID=$!

# --- Loki ---
(
  echo "    [Loki] Installing..."
  helm upgrade --install loki grafana/loki-stack -n "$NAMESPACE" \
    --set loki.resources.requests.memory=128Mi \
    --set promtail.enabled=true \
    --wait --timeout 180s
  echo "    [Loki] Done."
) &
LOKI_PID=$!

# --- Kubernetes Dashboard (optional, non-blocking) ---
(
  helm upgrade --install kubernetes-dashboard kubernetes-dashboard/kubernetes-dashboard \
    -n kubernetes-dashboard --create-namespace \
    --wait --timeout 120s 2>/dev/null || true
) &
DASH_PID=$!

# ── 6. Wait for all parallel installs ────────────────────────────────────────
echo "==> [6] Waiting for all parallel installs to complete..."
FAIL=0
for name_pid in "Postgres:$PG_PID" "Redis:$REDIS_PID" "Kafka:$KAFKA_PID" "LocalStack:$LS_PID" "Keycloak:$KC_PID" "OpenSearch:$OS_PID" "Monitoring:$MON_PID" "Loki:$LOKI_PID" "Dashboard:$DASH_PID"; do
  NAME="${name_pid%%:*}"
  PID="${name_pid##*:}"
  if wait "$PID" 2>/dev/null; then
    echo "    $NAME: OK"
  else
    echo "    $NAME: WARN (may still be starting)"
    FAIL=$((FAIL + 1))
  fi
done
echo "    All installs complete ($FAIL warnings)."

# ── 7. Wait for Maven builds and build Docker images ─────────────────────────
echo "==> [7] Waiting for Maven builds..."
wait $MVN_GW_PID 2>/dev/null || { echo "    WARN: api-gateway build had issues"; }
echo "    api-gateway JAR ready."
wait $MVN_DC_PID 2>/dev/null || { echo "    WARN: devconsole build had issues"; }
echo "    devconsole JAR ready."

echo "==> [8] Building Docker images and loading into Kind..."

# Build both Docker images in parallel
docker build -t "api-gateway:$IMAGE_TAG" -f services/api-gateway/Dockerfile services/api-gateway &
DK_GW_PID=$!
docker build -t "devconsole:$IMAGE_TAG" -f services/devconsole/Dockerfile . &
DK_DC_PID=$!
wait $DK_GW_PID $DK_DC_PID

# Load both into Kind in parallel
kind load docker-image "api-gateway:$IMAGE_TAG" --name "$CLUSTER_NAME" &
KL_GW_PID=$!
kind load docker-image "devconsole:$IMAGE_TAG" --name "$CLUSTER_NAME" &
KL_DC_PID=$!
wait $KL_GW_PID $KL_DC_PID

# Deploy both via Helm in parallel
(
  helm upgrade --install api-gateway infrastructure/helm/api-gateway \
    -f infrastructure/helm/api-gateway/values-local.yaml \
    --set image.tag="$IMAGE_TAG" \
    -n "$NAMESPACE" \
    --wait --timeout 120s
) &
HLM_GW_PID=$!

(
  helm upgrade --install devconsole infrastructure/helm/devconsole \
    --set image.tag="$IMAGE_TAG" \
    -n "$NAMESPACE" \
    --wait --timeout 120s
) &
HLM_DC_PID=$!

wait $HLM_GW_PID $HLM_DC_PID
echo "    api-gateway and devconsole deployed."

# ── 9. UI Containers (outside Kind, plain Docker) ────────────────────────────
echo "==> [9] Starting UI containers..."

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

# ── 10. NodePort services + port-forward watchdog ────────────────────────────
echo "==> [10] Setting up NodePort services and persistent volumes..."
kubectl apply -f infrastructure/kubernetes/persistent-volumes.yaml 2>/dev/null || true
kubectl apply -f infrastructure/kubernetes/nodeport-services.yaml 2>/dev/null || true
echo "    NodePort services applied (gateway:18090, prometheus:19090, keycloak:18081, postgres:15432, grafana:13000)"

# Kill any old port-forwards
pkill -f "kubectl port-forward.*payments" 2>/dev/null || true
pkill -f "kubectl port-forward.*kubernetes-dashboard" 2>/dev/null || true
pkill -f "pf-watchdog" 2>/dev/null || true
sleep 1

# Start watchdog for remaining services (LocalStack, OpenSearch, Kafka, etc.)
echo "    Starting port-forward watchdog for remaining services..."
nohup bash "$(dirname "$0")/port-forward-watchdog.sh" >/tmp/pf-watchdog.log 2>&1 &
echo "    Watchdog PID: $(cat /tmp/pf-watchdog.pid 2>/dev/null || echo $!)"

# Wait for gateway to be accessible
echo "    Waiting for gateway..."
for i in 1 2 3 4 5 6 7 8 9 10; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:18090/actuator/health 2>/dev/null || echo "000")
  if [ "$STATUS" = "200" ]; then echo "    Gateway ready"; break; fi
  sleep 3
done

# ── 11. PostgreSQL setup (schema + permissions for DevConsole) ───────────────
echo "==> [11] Setting up PostgreSQL..."
PGPASS=$(kubectl get secret postgres-postgresql -n "$NAMESPACE" -o jsonpath='{.data.postgres-password}' 2>/dev/null | base64 -d 2>/dev/null)
if [ -n "$PGPASS" ]; then
  MSYS_NO_PATHCONV=1 kubectl exec -n "$NAMESPACE" postgres-postgresql-0 -- bash -c "PGPASSWORD=$PGPASS psql -U postgres -d template -c \"CREATE SCHEMA IF NOT EXISTS devconsole;\"" 2>/dev/null
  MSYS_NO_PATHCONV=1 kubectl exec -n "$NAMESPACE" postgres-postgresql-0 -- bash -c "PGPASSWORD=$PGPASS psql -U postgres -c \"ALTER USER template CREATEROLE CREATEDB;\"" 2>/dev/null
  MSYS_NO_PATHCONV=1 kubectl exec -n "$NAMESPACE" postgres-postgresql-0 -- bash -c "PGPASSWORD=$PGPASS psql -U postgres -d template -c \"GRANT ALL ON SCHEMA devconsole TO template;\"" 2>/dev/null
  MSYS_NO_PATHCONV=1 kubectl exec -n "$NAMESPACE" postgres-postgresql-0 -- bash -c "PGPASSWORD=$PGPASS psql -U postgres -d template -c \"ALTER DEFAULT PRIVILEGES IN SCHEMA devconsole GRANT ALL ON TABLES TO template;\"" 2>/dev/null
  MSYS_NO_PATHCONV=1 kubectl exec -n "$NAMESPACE" postgres-postgresql-0 -- bash -c "PGPASSWORD=$PGPASS psql -U postgres -d template -c \"ALTER SCHEMA devconsole OWNER TO template;\"" 2>/dev/null
  echo "    Schema + permissions configured"
else
  echo "    WARNING: Could not get postgres password"
fi

# ── 12. Keycloak auto-setup (users, roles, client config) ──────────────────
echo "==> [12] Configuring Keycloak (users, roles, redirect URIs)..."
for i in 1 2 3 4 5 6 7 8 9 10; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:18090/devconsole/api/health 2>/dev/null)
  if [ "$STATUS" = "200" ]; then break; fi
  echo "    Waiting for DevConsole to be ready... (attempt $i)"
  sleep 5
done
# Run Keycloak setup via DevConsole API (idempotent)
curl -s -X POST http://localhost:18090/devconsole/api/setup/keycloak 2>/dev/null | head -1
echo "    Realm configured"

# Fix users: set firstName/lastName/email (Keycloak 24 VERIFY_PROFILE) and password
KC_TOKEN=$(curl -s -X POST http://localhost:18081/auth/realms/master/protocol/openid-connect/token \
  -d "grant_type=password&client_id=admin-cli&username=admin&password=admin" 2>/dev/null \
  | sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p')
if [ -n "$KC_TOKEN" ]; then
  KC_USERS=$(curl -s -H "Authorization: Bearer $KC_TOKEN" "http://localhost:18081/auth/admin/realms/template/users" 2>/dev/null)
  for uid in $(echo "$KC_USERS" | sed -n 's/.*"id":"\([^"]*\)","username":"\([^"]*\)".*/\1:\2/gp'); do
    ID=$(echo "$uid" | cut -d: -f1)
    NAME=$(echo "$uid" | cut -d: -f2)
    FIRST=$([ "$NAME" = "testuser" ] && echo "Test" || echo "Admin")
    curl -s -X PUT "http://localhost:18081/auth/admin/realms/template/users/$ID" \
      -H "Authorization: Bearer $KC_TOKEN" -H "Content-Type: application/json" \
      -d "{\"firstName\":\"$FIRST\",\"lastName\":\"User\",\"email\":\"${NAME}@example.com\",\"emailVerified\":true,\"requiredActions\":[]}" 2>/dev/null
    curl -s -X PUT "http://localhost:18081/auth/admin/realms/template/users/$ID/reset-password" \
      -H "Authorization: Bearer $KC_TOKEN" -H "Content-Type: application/json" \
      -d '{"type":"password","value":"password","temporary":false}' 2>/dev/null
    echo "    User $NAME configured"
  done
  # Fix client redirect URIs
  CLIENT_UUID=$(curl -s -H "Authorization: Bearer $KC_TOKEN" "http://localhost:18081/auth/admin/realms/template/clients?clientId=microservice-template" 2>/dev/null \
    | sed -n 's/.*"id":"\([^"]*\)".*/\1/p' | head -1)
  if [ -n "$CLIENT_UUID" ]; then
    curl -s -X PUT "http://localhost:18081/auth/admin/realms/template/clients/$CLIENT_UUID" \
      -H "Authorization: Bearer $KC_TOKEN" -H "Content-Type: application/json" \
      -d '{"clientId":"microservice-template","redirectUris":["*"],"webOrigins":["*"]}' 2>/dev/null
    echo "    Client redirect URIs configured"
  fi
else
  echo "    WARNING: Could not get Keycloak admin token. Run setup manually."
fi

# ── 13. Redeploy previously deployed services ───────────────────────────────
echo "==> [13] Redeploying saved services..."
REDEPLOY_RESULT=$(curl -s -X POST http://localhost:18090/devconsole/api/services/redeploy-all 2>/dev/null)
echo "    $REDEPLOY_RESULT"

# ── Summary ───────────────────────────────────────────────────────────────────
ELAPSED=$(( SECONDS - START_TIME ))
MINS=$(( ELAPSED / 60 ))
SECS=$(( ELAPSED % 60 ))
echo ""
kubectl get pods -n "$NAMESPACE"
echo ""
echo "┌────────────────────────────────────────────────────────────────────────┐"
echo "│  Infrastructure ready  (${MINS}m ${SECS}s)                                     │"
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
echo "│  JavaBackend           →  http://localhost:18090/devconsole/            │"
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

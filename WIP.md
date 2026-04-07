# Work In Progress — Resume From Here

**Last updated:** 2026-04-07 00:00
**Last deployed devconsole version:** v52
**Last deployed gateway version:** v13
**Dockerfile build context:** repo root
**Build command:** `cd <repo-root> && docker build -f services/devconsole/Dockerfile -t devconsole:vXX .`

## Current State

The provision system is **fully built and tested E2E**. All fixes resolved. New features shipped.

### What's Working
- DeployedService entity + JPA repository — saves to PostgreSQL
- ProvisionService — provisions database, Kafka topics, SQS queues, S3 buckets, DynamoDB tables, OpenSearch indices, Keycloak realms
- **ProvisionService.deprovision()** — removes all provisioned infrastructure (DB, topics, queues, buckets, indices)
- POST /api/provision — standalone provision endpoint
- POST /api/services/deploy — provisions + helm deploy + saves to DB
- POST /api/services/redeploy-all — reads DB, redeploys all (called by start-infra.sh)
- GET /api/services/{name}/infrastructure — returns provisioned info from DB
- **GET /api/services/{name}/pods** — returns pod status (ready, restarts, age)
- **GET /api/services/{name}/logs** — returns tail logs with configurable line count
- DELETE /api/services/{name}?deprovision=true — destroys service + deprovisions infrastructure
- Scaffold generates provision.yml dynamically based on selected deps
- Template includes: deploy.bat, deploy.sh, build.bat, build.sh, test.bat, test.sh, README.md, provision.yml
- Kafka topic provisioning works (via kubectl apply KafkaTopic CR)
- Keycloak realm/client/roles provisioning works
- Database provisioning works (connects to postgres DB for CREATE DATABASE)
- **Services page UI** — pod status (green/yellow/red), provisioned infrastructure detail, destroy+deprovision
- **Logs page** — live log viewer per service with auto-refresh, search/filter
- **Landing page** — "Why not Docker Compose?" section added
- **architecture-decisions.md** — documents all key technical decisions

### What Was Fixed
1. **Database provisioning** — ProvisionService now connects to the `postgres` admin database (via `getAdminConnection()`) for CREATE DATABASE/USER operations, instead of the `template` database.
2. **Gateway SecurityConfig** — All `/devconsole/api/services/**` endpoints are now permitAll. Deploy scripts work without auth.
3. **deploy.bat/deploy.sh YAML escaping** — Replaced fragile string escaping with temp JSON file approach. deploy.sh uses python3/jq/fallback. deploy.bat uses PowerShell's ConvertTo-Json.
4. **Pod/logs label matching** — KubernetesService tries `app.kubernetes.io/instance` (Helm) first, falls back to `app` (simple deployments).
5. **deploy.sh python3 on Windows** — `python3` stub on Windows fakes `command -v` success but fails to run. Fixed: try jq first, then test python3 execution, add `python` fallback (v50).
6. **Helm configmap/probes hardcoded /template** — ConfigMap and deployment probes now use dynamic `SERVER_SERVLET_CONTEXT_PATH` from Helm values (v51).
7. **No gateway route for user services** — KubernetesService.deployService() now registers a dynamic route via gateway actuator API; destroyService() removes it (v51).
8. **Keycloak provisioning: no test user** — ProvisionService.provisionKeycloak() now creates a `testuser` with password `1Johnsushil` and assigns all roles (v51).
9. **JWT issuer mismatch** — Template application-local.yml uses `jwk-set-uri` only (no `issuer-uri`) so tokens from both localhost and tunnel are accepted (v51).
10. **Re-deploy after destroy skipped provisioning** — ServicesController now detects `status=destroyed` and re-provisions infrastructure (v52).
11. **Gateway blocked user service JWT** — Split SecurityConfig into two filter chains: user services bypass gateway JWT validation entirely, services handle their own auth (v13).

### Full E2E Test Results (2026-04-07) — Real User Flow
1. Landing page: hero + "Why not Docker Compose?" section ✓
2. Create wizard: artifact "e2etest", 11 deps, download e2etest-service.zip ✓
3. Extract ZIP, run deploy.sh 1.0.0: builds JAR, Docker, loads Kind, provisions all infra ✓
   - Created: database, 2 Kafka topics, SQS queue, S3 bucket, DynamoDB table, OpenSearch index, Keycloak realm+client+user
4. Login as testuser / 1Johnsushil → Dashboard ✓
5. Dashboard health grid: all 6 infra UP, 8+ services deployed ✓
6. Services page: e2etest-service visible with DEPLOYED badge ✓
7. Logs page: real Spring Boot startup logs from e2etest-service ✓
8. Postman API test via gateway:
   - Bearer token from Keycloak e2etest realm ✓
   - GET /e2etest/actuator/health → UP (DB, Redis) ✓
   - GET /e2etest/api/v1/templates → empty list ✓
   - POST /e2etest/api/v1/templates → created item with UUID ✓
   - GET /e2etest/api/v1/templates → 1 item returned ✓
   - Swagger UI → 302 redirect ✓
9. Destroy via UI → clean state, empty YOUR SERVICES ✓

### What's NOT Built Yet
1. **Enrich Learn pages** — 15+ pages are sparse (~300 chars each)
2. **Add remaining Learn pages** — Database Design, Multithreading, Java Best Practices (37 pages)

## File Locations (Changed Files)

| File | What Changed |
|---|---|
| `services/devconsole/backend/.../entity/DeployedService.java` | JPA entity |
| `services/devconsole/backend/.../repository/DeployedServiceRepository.java` | JPA repo |
| `services/devconsole/backend/.../service/ProvisionService.java` | Provisions + deprovisions all infra from YAML, uses admin DB connection |
| `services/devconsole/backend/.../controller/ProvisionController.java` | POST /api/provision |
| `services/devconsole/backend/.../controller/ServicesController.java` | deploy, redeploy-all, pods, logs, infrastructure, destroy+deprovision |
| `services/devconsole/backend/.../controller/ScaffoldController.java` | Generates provision.yml, strips source files dynamically |
| `services/devconsole/backend/.../service/KubernetesService.java` | getPodStatus, getLogs, dual-label matching |
| `services/api-gateway/.../config/SecurityConfig.java` | All service endpoints permitAll |
| `services/devconsole/frontend/src/pages/Services.js` | Pod status, infra detail, destroy+deprovision, logs link |
| `services/devconsole/frontend/src/pages/Logs.js` | NEW — live log viewer |
| `services/devconsole/frontend/src/pages/Landing.js` | "Why not Docker Compose?" section |
| `services/devconsole/frontend/src/App.js` | Logs route + sidebar nav |
| `services/template/deploy.bat` | PowerShell JSON encoding |
| `services/template/deploy.sh` | python3/jq JSON encoding |
| `architecture-decisions.md` | NEW — 10 decisions documented |
| `scripts/start-infra.sh` | Schema creation (15a), redeploy-all (15c) |

## How to Build and Deploy

```bash
# From repo root:
cd services/devconsole/frontend && npm run build && cp -r build/* ../backend/src/main/resources/static/
cd ../backend && mvn package -DskipTests -q
cd <repo-root>
docker build -f services/devconsole/Dockerfile -t devconsole:vXX .
kind load docker-image devconsole:vXX --name template-local
kubectl set image deployment/devconsole -n payments devconsole=devconsole:vXX
kubectl rollout status deployment/devconsole -n payments --timeout=90s

# Gateway (if SecurityConfig changed):
cd services/api-gateway && mvn package -DskipTests -q && docker build -t api-gateway:vXX .
kind load docker-image api-gateway:vXX --name template-local
kubectl set image deployment/api-gateway -n payments api-gateway=api-gateway:vXX
```

## Testing

```bash
# Quick provision test
curl -s -X POST http://localhost:18090/devconsole/api/provision \
  -H "Content-Type: application/json" \
  -d '{"provisionYml": "service: test-svc\n\ndatabase:\n  name: testdb\n\nkeycloak:\n  realm: test\n  client: test-svc\n  roles:\n    - TEST_USER"}'

# Quick deploy test
curl -s -X POST http://localhost:18090/devconsole/api/services/deploy \
  -H "Content-Type: application/json" \
  -d '{"name": "test-svc", "tag": "1.0.0"}'

# Pod status
curl -s http://localhost:18090/devconsole/api/services/devconsole/pods

# Logs
curl -s "http://localhost:18090/devconsole/api/services/devconsole/logs?lines=50"

# Check DB
kubectl exec -n payments postgres-postgresql-0 -- bash -c "PGPASSWORD=template123 psql -U template -d template -c 'SELECT name, tag, status FROM devconsole.deployed_services;'"

# Destroy + deprovision
curl -s -X DELETE "http://localhost:18090/devconsole/api/services/test-svc?deprovision=true"

# Playwright tests
cd ../microservice-platform-tests && node test-confidence.mjs
```

## Credentials
- DevConsole: testuser / 1Johnsushil
- Keycloak Admin: admin / admin
- Grafana: admin / admin
- PostgreSQL: template / template123 (superuser: postgres / Yyg9g9wjDa)
- pgAdmin: admin@admin.com / admin
- OpenSearch: admin / Str0ngP@ssw0rd#2026

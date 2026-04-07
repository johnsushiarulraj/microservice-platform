# JavaBackend Platform — Build Plan

## Overview

Local microservice development platform. Clone, run, deploy. Everything pre-configured.

**Repo:** https://github.com/johnsushiarulraj/microservice-platform
**Live:** https://platform.javabackend.com/devconsole/

## Current State (What's Done)

### Infrastructure
- Kind 3-node cluster with NodePort services (no port-forward for key services)
- PostgreSQL, Redis, Kafka (Strimzi), LocalStack (S3/SQS/DynamoDB), OpenSearch, Keycloak
- Prometheus, Grafana (observability)
- Spring Cloud Gateway (auth, rate limiting, circuit breaking)
- Port-forward watchdog for remaining services
- Cloudflare tunnel support (tunneling/ folder outside repo)

### DevConsole (React + Spring Boot)
- Landing page with architecture diagram, comparison table, audience cards
- Create Service wizard — group ID, artifact ID, dependency selection
- Dynamic template generation — Java source files stripped based on selected deps
- Scaffold API runs rename.sh, applies group ID, strips unused packages
- Tutorial (10 steps), Learn section (73 pages, collapsible sidebar)
- Dashboard with health grid, deployed services, quick access links
- Services page — deploy, restart, destroy
- SQS Manager, S3 Manager
- Login/logout with Keycloak JWT
- Sidebar with compact infra links grid

### Template
- Flat structure (no multi-module parent POM)
- Spring Boot 2.7 with spring-boot-starter-parent
- All files at root: pom.xml, Dockerfile, build.bat, build.sh, src/
- Dynamic dependency stripping — Java files, pom.xml deps, and broken imports cleaned
- Mandatory deps: Keycloak, Actuator (Prometheus/Grafana), Sleuth (Loki)
- build.bat/build.sh — builds JAR + Docker + loads into Kind

### Known Issues
- LocalStack restarts under memory pressure (needs 1GB limit)
- Kafka entity operator needs 512Mi memory patch
- start-infra.sh uses `set -uo pipefail` (not -e) to tolerate helm timeouts
- Dockerfile build context is repo root (not services/)

---

## What Needs to Be Built

### Phase 1: Provision System

**Database table** — `deployed_services` in DevConsole PostgreSQL:
```sql
deployed_services (
    id UUID PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    tag VARCHAR(50) NOT NULL,
    context_path VARCHAR(100),
    provision_yml TEXT,
    source_path TEXT,
    status VARCHAR(20),
    deployed_at TIMESTAMP,
    updated_at TIMESTAMP
)
```

**provision.yml** — dynamically generated per service:
```yaml
service: order-service
context-path: /order

database:           # if PostgreSQL selected
  name: order

kafka:              # if Kafka selected
  topics:
    - order-events
    - order-events-dlq

sqs:                # if SQS selected
  queues:
    - order-tasks

s3:                 # if S3 selected
  buckets:
    - order-documents

dynamodb:           # if DynamoDB selected
  tables:
    - name: order-items
      partitionKey: id

opensearch:         # if OpenSearch selected
  indices:
    - order-items

keycloak:           # always included
  realm: order
  client: order-service
  roles:
    - ORDER_USER
    - ORDER_ADMIN
```

**New backend endpoints:**
- `POST /api/provision` — accepts provision.yml content, provisions all infra, saves to DB
- `POST /api/services/deploy` — updated: accepts provision_yml, provisions if changed, deploys, saves to DB
- `POST /api/services/redeploy-all` — reads DB, redeploys all saved services
- `GET /api/services/{name}/infrastructure` — returns what's provisioned for a service

**Provision logic:**
- Provision only CREATES, never deletes (safe)
- Passwords follow convention: database user = service prefix, password = `<prefix>123`
- Idempotent — running twice skips existing items
- Validates YAML structure, returns clear errors

**Template changes:**
- Add `provision.yml` at root (dynamically generated)
- Add `deploy.bat` / `deploy.sh` at root
- Add `test.bat` / `test.sh` at root
- Add `README.md` in generated service
- Remove `config/` folder
- Remove `scripts/` folder — all scripts at root

**deploy.bat flow:**
1. Check DevConsole is reachable (fail with clear message if not)
2. Build JAR
3. Build Docker image
4. Load into Kind
5. Read provision.yml
6. POST to /api/services/deploy with name + tag + provision_yml
7. Backend: diff provision → provision new stuff → helm upgrade → save to DB
8. Print service URL
9. Poll health endpoint until healthy (timeout 60s)
10. Print SUCCESS or clear error

**start-infra.sh update:**
- After DevConsole is ready, call `POST /api/services/redeploy-all`
- This reads the DB and redeploys all previously deployed services

### Phase 2: UI Improvements

**Services page enhancements:**
- Show pod status (Ready 2/2, restarts, uptime) — green/yellow/red
- Show provisioned infrastructure per service (click to expand)
- Context path conflict check before deploy
- Destroy also deprovisions (with confirmation listing what will be deleted)
- Async deploy — return immediately, poll for status, show progress

**Logs page (new):**
- Live log viewer for each deployed service
- Pull from kubectl logs API
- Tail follow with search/filter

### Phase 3: Quality & Polish

**Reliability:**
- deploy.bat checks DevConsole connectivity before starting
- deploy.bat fail-fast — if any step fails, stop immediately with clear error
- Concurrent deploy lock on service name
- Async deploy — no 3-min API blocking

**Documentation:**
- README.md in every generated service (3 lines: open in IDE, build, deploy)
- architecture-decisions.md in repo
- "Why not Docker Compose?" on landing page or FAQ

**Learn section:**
- Enrich sparse pages with explanations (15 pages at ~300 chars)
- Add remaining 37 pages (Database Design, Multithreading, Java Best Practices)

---

## Technical Notes

### Build context
The Dockerfile at `services/devconsole/Dockerfile` uses repo root as build context:
```
docker build -f services/devconsole/Dockerfile -t devconsole:vXX .
```
Paths in Dockerfile use: `COPY services/devconsole/backend/target/...` and `COPY infrastructure/helm/...`

### Image versioning
Kind caches images aggressively. Always use unique tags (v1, v2, ... not :latest).

### Keycloak 24 requirements
Users need firstName, lastName, email, emailVerified. The setup API handles this.

### MSYS path conversion
On Windows Git Bash, paths starting with `/` get converted to Windows paths.
Use `MSYS_NO_PATHCONV=1` for kubectl/helm commands with path arguments.

### Port mapping
NodePort services (no port-forward needed):
- Gateway: 18090 → 30090
- Keycloak: 18081 → 30081
- Grafana: 13000 → 30030
- Prometheus: 19090 → 30091
- PostgreSQL: 15432 → 30432

Docker containers (outside cluster):
- pgAdmin: 15050
- Kafka UI: 18002
- DynamoDB Admin: 18001

Watchdog-managed port-forwards:
- LocalStack: 14566
- OpenSearch: 19200
- Kafka bootstrap: 19092
- OpenSearch Dashboards: 15601

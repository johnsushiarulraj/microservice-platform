# Microservice Platform — Build Progress

> See PLAN.md for full plan details.

## Current Phase: A, B, D complete. C (payment system per build guide) pending.

## Summary
- Phase 1 (Infrastructure): DONE — 12 ports, all pods running
- Phase 2 (DevConsole Backend): DONE — health, services, SQS, S3, keycloak, google SSO APIs
- Phase 3 (DevConsole Frontend): DONE — Dashboard, Services, Create Service, SQS/S3 managers
- Phase A (Security + Gateway): DONE — single entry point, JWT auth, rate limiting, circuit breaker, login page, Google SSO
- Phase B (Full Test Service): DONE — order-service tests PostgreSQL, Outbox, RBAC, Redis, Kafka. LocalStack services need more memory.
- Phase D (UI Polish + Learn): DONE — 73 learn pages, professional redesign, login/logout/change password

## Cloudflare Tunnel
- Config: ~/.cloudflared/config.yml
- Single route: platform.javabackend.com → gateway (port 18090)
- Start: ~/.cloudflared/start-tunnel.sh
- Stop: ~/.cloudflared/stop-tunnel.sh
- Google OAuth: configured in ~/.cloudflared/remote-credentials.env

## Known Issues
- LocalStack restarts under memory pressure (S3, DynamoDB, SQS affected)
- OpenSearch search indexing needs investigation
- Keycloak admin console still uses separate admin/admin credentials
- ~37 learn pages still to be added (Database Design, Multithreading, Java Best Practices, etc.)
- Phase 4 (Template Repo): DONE — rename.sh, build.sh, CI, tests (12 pass)
- Phase 5 (Learn Section): DONE — 65 pages, 45 more can be added incrementally

## Phase 1 — Infrastructure (COMPLETE)

| # | Task | Status | Notes |
|---|---|---|---|
| 1.1 | Restructure repo (services/, infrastructure/, scripts/) | DONE | api-gateway + template moved into services/ |
| 1.2 | Persistent data mounts (Kind extraMounts + PV manifests) | DONE | cluster-config.yaml + persistent-volumes.yaml |
| 1.3 | Update start-infra.sh (UIs, port-forwards, pull logic) | DONE | 16-step script with all UIs + port-forwards |
| 1.4 | Create stop-infra.sh + --clean flag | DONE | |
| 1.5 | Add UI containers (pgAdmin, OS Dashboards, DDB Admin, Kafka UI) | DONE | pgAdmin + DynamoDB Admin + Kafka UI as Docker, OS Dashboards via Helm |
| 1.6 | Add port-forwards (12 total) | DONE | All 12 ports verified open |
| 1.7 | images.conf (registry config) | DONE | infrastructure/config/images.conf |
| 1.8 | Platform README.md | DONE | |
| 1.9 | Delete old scripts (cluster-start.sh, old deploy.sh, old destroy.sh) | DONE | |
| 1.10 | VALIDATE | DONE | All 12 ports open, all pods running, gateway UP |

### Phase 1 Fixes Applied
- Strimzi uses StrimziPodSets not StatefulSets — wait command changed to `kubectl wait --for=condition=ready pod -l`
- Prometheus service name: `monitoring-kube-prometheus-prometheus` (not `prometheus-monitoring-...`)
- OpenSearch Dashboards needs HTTPS + credentials to connect to OpenSearch
- DynamoDB Admin connects via `host.docker.internal:14566` (port-forward)
- Kafka UI connects via `host.docker.internal:19092` (port-forward)
- Kafka entity operator needs 256Mi/512Mi memory (patched)

## Phase 2 — DevConsole Backend

| # | Task | Status | Notes |
|---|---|---|---|
| 2.1 | Project setup (pom.xml, Dockerfile, application.yml) | TODO | |
| 2.2 | Health API — aggregated infra health | TODO | |
| 2.3 | Services API — list/deploy/destroy | TODO | |
| 2.4 | Registry API — list images + tags from ghcr.io | TODO | |
| 2.5 | Scaffold API — generate ZIP from template | TODO | |
| 2.6 | Setup API — provision topics/queues/buckets/roles from DB | TODO | |
| 2.7 | SQS API — CRUD + send/receive/purge | TODO | |
| 2.8 | S3 API — buckets + objects + upload/download | TODO | |
| 2.9 | SQL Runner API | TODO | |
| 2.10 | Kafka API — produce/consume | TODO | |
| 2.11 | DynamoDB API — put/get/scan | TODO | |
| 2.12 | OpenSearch API — search | TODO | |
| 2.13 | Redis API + Keycloak token API | TODO | |
| 2.14 | Helm chart for devconsole | TODO | |
| 2.15 | VALIDATE: all APIs tested with curl | TODO | |

## Phase 3 — DevConsole Frontend

| # | Task | Status | Notes |
|---|---|---|---|
| 3.1 | Project setup (React + Tailwind, routing, nav) | TODO | |
| 3.2 | Dashboard page | TODO | |
| 3.3 | Services page (deploy/destroy/redeploy) | TODO | |
| 3.4 | Create Service wizard (name, deps, config, review, ZIP download) | TODO | |
| 3.5 | SQS Manager page | TODO | |
| 3.6 | S3 Manager page | TODO | |
| 3.7 | VALIDATE: full UI walkthrough | TODO | |

## Phase 4 — Template Repo

| # | Task | Status | Notes |
|---|---|---|---|
| 4.1 | rename.sh — full rename automation | TODO | |
| 4.2 | config/build.conf + update build.sh | TODO | |
| 4.3 | Jib maven plugin | TODO | |
| 4.4 | Checkstyle plugin + rules | TODO | |
| 4.5 | SpotBugs plugin | TODO | |
| 4.6 | Google Java Format plugin | TODO | |
| 4.7 | JaCoCo + coverage threshold | TODO | |
| 4.8 | OWASP Dependency Check | TODO | |
| 4.9 | .editorconfig | TODO | |
| 4.10 | MapStruct dependency + example mapper | TODO | |
| 4.11 | Lombok (optional in wizard) | TODO | |
| 4.12 | Git pre-commit hook | TODO | |
| 4.13 | GitHub Actions CI pipeline | TODO | |
| 4.14 | Unit tests (service, controller, event) | TODO | |
| 4.15 | Integration tests (DB, Redis, Kafka, OpenSearch, S3, SQS) | TODO | |
| 4.16 | BaseIntegrationTest.java + application-test.yml | TODO | |
| 4.17 | Generated service README.md | TODO | |
| 4.18 | VALIDATE: rename + build + deploy + test all pass | TODO | |

## Phase 5 — Learn Section (110 pages)

| # | Task | Status | Notes |
|---|---|---|---|
| 5.1 | Learn layout (sidebar nav, search, page template component) | TODO | |
| 5.2 | Getting Started (1 page) | TODO | |
| 5.3 | Core Concepts (6 pages) | TODO | |
| 5.4 | API Design (11 pages) | TODO | |
| 5.5 | Day-to-Day Tasks (23 pages) | TODO | |
| 5.6 | Working with JSON (1 page) | TODO | |
| 5.7 | Event-Driven Architecture (11 pages) | TODO | |
| 5.8 | Design Patterns in Spring Boot (3 pages) | TODO | |
| 5.9 | Database Design (12 pages) | TODO | |
| 5.10 | Kafka Basics (4 pages) | TODO | |
| 5.11 | Kubernetes Basics (4 pages) | TODO | |
| 5.12 | Using Keycloak (4 pages) | TODO | |
| 5.13 | Using Grafana (6 pages) | TODO | |
| 5.14 | Security (4 pages) | TODO | |
| 5.15 | Patterns (8 pages) | TODO | |
| 5.16 | Resilience (1 page) | TODO | |
| 5.17 | Multithreading in Spring (7 pages) | TODO | |
| 5.18 | Observability (6 pages) | TODO | |
| 5.19 | Java Best Practices (11 pages) | TODO | |
| 5.20 | Code Quality (3 pages) | TODO | |
| 5.21 | Testing (2 pages) | TODO | |
| 5.22 | Operations (3 pages) | TODO | |
| 5.23 | Performance (1 page) | TODO | |
| 5.24 | Cheatsheets (2 pages) | TODO | |
| 5.25 | VALIDATE: all pages load, code examples compile | TODO | |

## Key Decisions Made

- Single `microservice-platform` repo for infra + DevConsole + gateway + template
- Generated services get their own repos
- Always pull from remote registry (ghcr.io), no local registry
- Public images only, no auth needed for pull
- DevConsole handles setup (topics, queues, buckets, roles) from its DB — no shell setup scripts
- Persistent data in ./data/ survives cluster restarts
- Learn section built into DevConsole (not Zeppelin, not markdown files)
- Learn pages are documentation only (no "try it" panels) — all with code examples
- No Google federation for Keycloak — local users only
- Existing UIs used where possible (Keycloak, Grafana, pgAdmin, etc.)
- Only build custom UI for what's missing (deploy, scaffold, SQS, S3)

## Known Issues from Phase 0

- Bitnami images paywalled — use Strimzi for Kafka, quay.io for Keycloak
- Strimzi 0.51 only supports Kafka 4.1.0+
- OpenSearch needs OPENSEARCH_INITIAL_ADMIN_PASSWORD (strong, not similar to username)
- Keycloak 24 health probe: use /realms/template/.well-known/openid-configuration on port 8080
- Liquibase XSD: must use 4.9 (bundled), not 4.20 (remote only)
- Resilience4j: use 1.7.0, not 1.7.1
- AWS SDK: explicitly set .httpClient(UrlConnectionHttpClient.create())
- Redis: spring.redis.host (Boot 2.x), not spring.data.redis.host (Boot 3.x)

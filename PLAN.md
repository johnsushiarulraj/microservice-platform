# Microservice Platform — Full Build Plan

## Overview

Two repos:
- `microservice-platform` (this repo, renamed from `microservice-deployment-env`) — Infrastructure + DevConsole + API Gateway + Template
- Generated services (e.g. `payment-service`) — own repo per service, created via DevConsole

## Repo Structure (Target)

```
microservice-platform/
├── services/
│   ├── devconsole/
│   │   ├── backend/              ← Spring Boot 2.7
│   │   ├── frontend/             ← React + Tailwind
│   │   └── Dockerfile
│   ├── api-gateway/              ← Spring Cloud Gateway
│   │   ├── src/
│   │   └── Dockerfile
│   └── template/                 ← Source template (DevConsole reads this)
│       ├── microservice-template/
│       ├── Dockerfile
│       ├── scripts/
│       │   ├── build.sh
│       │   └── rename.sh
│       └── config/
│           └── build.conf
├── infrastructure/
│   ├── helm/
│   │   ├── api-gateway/
│   │   ├── devconsole/
│   │   └── microservice-template/  ← base Helm chart for any service
│   ├── kubernetes/
│   │   ├── kafka-cluster.yaml
│   │   ├── keycloak.yaml
│   │   └── localstack-init-job.yaml
│   ├── kind/
│   │   └── cluster-config.yaml
│   └── config/
│       └── images.conf
├── scripts/
│   ├── start-infra.sh
│   └── stop-infra.sh
├── data/                          ← Persistent data (gitignored)
├── PLAN.md
├── PROGRESS.md
└── README.md
```

## Tech Stack

- Java 11, Spring Boot 2.7.18, Spring Cloud 2021.0.9
- Kind (Kubernetes in Docker) 3-node cluster
- React + Tailwind CSS (DevConsole frontend)
- Container Registry: ghcr.io (public)

## Infrastructure Services

| Service | Internal | External Port |
|---|---|---|
| PostgreSQL | postgres-postgresql:5432 | localhost:15432 |
| Redis | redis-master:6379 | — |
| Kafka (Strimzi KRaft) | kafka-kafka-bootstrap:9092 | localhost:19092 |
| LocalStack (S3, SQS, DynamoDB) | localstack:4566 | localhost:14566 |
| Keycloak | keycloak:8080 | localhost:18081 |
| OpenSearch | opensearch:9200 | localhost:19200 |
| Prometheus | prometheus:9090 | localhost:19090 |
| Loki | loki:3100 | — |
| NGINX Ingress | — | — |
| API Gateway | api-gateway:8090 | localhost:18090 |
| DevConsole | devconsole:8080 | localhost:13001 |

## UI Containers

| UI | Port | Source |
|---|---|---|
| DevConsole | 13001 | Custom (Spring Boot + React) |
| Grafana | 13000 | Helm (kube-prometheus-stack) |
| Spring Boot Admin | 13002 | Docker container |
| Kubernetes Dashboard | 13003 | Helm install |
| pgAdmin | 15050 | Docker container |
| OpenSearch Dashboards | 15601 | Helm install |
| DynamoDB Admin | 18001 | Docker container |
| Kafka UI (provectus) | 18002 | Docker container |
| Keycloak | 18081 | K8s deployment |
| Prometheus | 19090 | Helm (kube-prometheus-stack) |

## Scripts

| Script | Purpose |
|---|---|
| `start-infra.sh` | Create Kind cluster + install all infra + UIs + gateway + devconsole + port-forwards |
| `stop-infra.sh` | Kill port-forwards + stop UI containers + delete cluster. `--clean` wipes data/ |

## Developer Workflow

```bash
# Start everything
git clone microservice-platform && cd microservice-platform
./scripts/start-infra.sh

# Open DevConsole
# http://localhost:13001
# Create Service → Download ZIP → Extract → Code → build.sh → Deploy from UI
```

---

## Build Phases

### Phase 1 — Infrastructure
Restructure repo. Update start-infra.sh with all UIs, persistent data, extra port-forwards. Create stop-infra.sh.
**Validation:** start-infra.sh runs clean, all 15 ports accessible, data persists across restart.

### Phase 2 — DevConsole Backend (Spring Boot)
15 API endpoints: health, services, deploy, destroy, registry, scaffold, setup, SQS, S3, SQL runner, Kafka, DynamoDB, OpenSearch, Redis, Keycloak.
**Validation:** Every API tested with curl against live infra.

### Phase 3 — DevConsole Frontend (React + Tailwind)
5 management pages: Dashboard, Services, Create Service wizard, SQS Manager, S3 Manager. Nav with links to all external UIs.
**Validation:** Full UI walkthrough — create service, deploy, destroy, manage data.

### Phase 4 — Template Repo
rename.sh, build.conf, Jib plugin, Checkstyle, SpotBugs, Google Java Format, JaCoCo, OWASP check, EditorConfig, MapStruct, Lombok, git hooks, GitHub Actions CI, unit tests, integration tests (Testcontainers), generated README.
**Validation:** rename.sh + build.sh + deploy + health check + mvn test + mvn verify all pass.

### Phase 5 — Learn Section (110 pages)
Built into DevConsole frontend. All with code examples. Sections: Getting Started, Core Concepts, API Design, Day-to-Day Tasks, JSON, Event-Driven Architecture, Design Patterns, Database Design, Kafka Basics, Kubernetes Basics, Using Keycloak, Using Grafana, Security, Patterns, Resilience, Multithreading, Observability, Java Best Practices, Code Quality, Testing, Operations, Performance, Cheatsheets.
**Validation:** Every page loads, every code example compiles.

---

## DevConsole Backend API Endpoints

| Group | Endpoints |
|---|---|
| Dashboard | `GET /api/health` |
| Services | `GET /api/services`, `POST /api/services/deploy`, `DELETE /api/services/:name` |
| Registry | `GET /api/registry/images`, `GET /api/registry/images/:name/tags` |
| Scaffold | `POST /api/scaffold` |
| Setup | `POST /api/setup/run` |
| SQS | `GET/POST/DELETE /api/sqs/queues`, `POST .../send`, `GET .../receive`, `POST .../purge` |
| S3 | `GET/POST/DELETE /api/s3/buckets`, `GET/POST/DELETE .../objects` |
| SQL | `POST /api/sql/execute` |
| Kafka | `POST /api/kafka/produce`, `GET /api/kafka/consume` |
| DynamoDB | `GET/POST/DELETE /api/dynamodb/tables`, `GET/POST/DELETE .../items` |
| OpenSearch | `POST /api/opensearch/search` |
| Redis | `GET/POST/DELETE /api/redis/keys` |
| Keycloak | `POST /api/keycloak/token` |

---

## DevConsole Frontend Pages

| Page | Route |
|---|---|
| Dashboard | `/` |
| Services | `/services` |
| Create Service | `/create` |
| SQS Manager | `/data/sqs` |
| S3 Manager | `/data/s3` |
| Learn Section | `/learn/*` |

---

## Learn Section (110 pages)

### Getting Started (1)
- Getting Started

### Core Concepts (6)
- Spring Beans & Dependency Injection
- @Component, @Service, @Repository, @Bean
- Profiles — Loading Different Beans Per Env
- @Value & @ConfigurationProperties
- Auto-Configure & Conditional Beans
- Application.yml Structure

### API Design (11)
- REST Conventions & Status Codes
- API Design Best Practices
- API Versioning
- Idempotent APIs
- Rate Limiting at Service Level
- DTOs vs Entities + MapStruct
- Error Response Format
- CORS
- Swagger Documentation
- Validation
- Pagination, Sorting & Filtering

### Day-to-Day Tasks (23)
- Add a New REST Endpoint
- Add Business Logic
- Add a New Database Table + Entity
- Query a Database
- Map DTOs to Entities
- Handle Errors
- Partial Updates (PATCH)
- Bulk Operations
- File Upload via REST API
- Soft Delete
- Audit Trail
- Retry Failed Operations
- Secure an Endpoint with a Role
- Publish a Kafka Event
- Consume a Kafka Event
- Send a Message to SQS
- Process SQS Messages
- Upload and Download Files (S3)
- Work with DynamoDB
- Cache with Redis
- Full-Text Search with OpenSearch
- Call Another Service
- Wrap External Calls with Circuit Breaker

### Working with JSON (1)
- Jackson Serialization

### Event-Driven Architecture (11)
- What is Event-Driven Architecture
- Events vs Commands
- Event Design — What an Event Should Contain
- Event Naming Conventions
- Event Versioning & Schema Evolution
- Event-Driven Best Practices
- Idempotency — Handling Duplicate Events
- Event Ordering — When Order Matters
- Dead Letter Queues — Handling Failures
- Event Sourcing
- Choreography vs Orchestration

### Design Patterns in Spring Boot (3)
- Strategy Pattern
- Factory Pattern
- Builder Pattern

### Database Design (12)
- SQL Table Design
- Entity Relationship Design
- DynamoDB Table Design
- SQL vs DynamoDB — When to Use Which
- Complex SQL Queries
- DynamoDB Complex Queries
- OpenSearch Complex Queries
- Liquibase Migrations
- Database Indexing
- Database Transactions & Locking
- Connection Pooling
- N+1 Query Problem

### Kafka Basics (4)
- What is Kafka
- Producers & Consumers
- Consumer Groups
- When to Use Kafka vs SQS vs REST

### Kubernetes Basics (4)
- What is Kubernetes
- How Your Service Runs in K8s
- Service Discovery
- ConfigMaps & Secrets

### Using Keycloak (4)
- Keycloak Basics — Realms, Clients, Users
- Create Users & Roles
- Single Sign-On with OAuth2
- Client Configuration

### Using Grafana (6)
- Grafana Basics — Navigating the UI
- View Service Performance Metrics
- Trace a Request
- Emit Custom Metrics
- Build a Dashboard for Your Service
- Set Up Alerts

### Security (4)
- JWT & OAuth2
- Roles & Permissions
- OWASP Top 10 for APIs
- Input Sanitization

### Patterns (8)
- Transactions
- Saga — Concept & Flow
- Saga — Full Worked Example
- CQRS — Concept & Flow
- CQRS — Full Worked Example
- Outbox — Concept & Flow
- Outbox — Full Worked Example
- Saga + Outbox Combined

### Resilience (1)
- Circuit Breaker, Retry & Rate Limiting

### Multithreading in Spring (7)
- Thread Safety — What You Need to Know
- @Async — Running Tasks in Background
- Thread Pools — Configuration & Sizing
- CompletableFuture — Parallel Calls
- @Scheduled Thread Safety
- Concurrent Data Access — When to Lock
- Common Concurrency Bugs in Spring

### Observability (6)
- Metrics & Prometheus
- Distributed Tracing
- Correlation IDs
- Structured Logging & Loki
- Health Checks
- Graceful Shutdown

### Java Best Practices (11)
- Clean Code Basics
- Null Handling — Optional, Validation, Defaults
- Exception Handling — Checked vs Unchecked
- Immutability — Why and How
- Streams — Filter, Map, Reduce
- Streams — Grouping, Sorting, Flattening
- Streams — Real-World Recipes
- Lambdas & Method References
- Collections — Choosing the Right One
- Equals, HashCode & ToString
- Logging — SLF4J Best Practices

### Code Quality (3)
- Linting & Formatting
- Best Practices
- Common Anti-Patterns

### Testing (2)
- Unit Tests
- Integration Tests

### Operations (3)
- Docker Best Practices
- Git Workflow & CI Pipeline
- Environment Variables & ConfigMaps

### Performance (1)
- Performance Basics

### Cheatsheets (2)
- Annotations
- Common Errors

---

## Totals

| Category | Done | TODO | Total |
|---|---|---|---|
| Infrastructure | 14 | 28 | 42 |
| DevConsole Backend | 0 | 15 | 15 |
| DevConsole Frontend | 0 | 6 | 6 |
| Template Repo | 2 | 18 | 20 |
| Learn Section | 0 | 111 | 111 |
| **Total** | **16** | **178** | **194** |

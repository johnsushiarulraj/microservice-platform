# Microservice Platform

Local microservice development environment with everything you need — infrastructure, gateway, monitoring, and a management console.

## Prerequisites

- Docker Desktop
- Java 11+
- Maven 3.8+
- kubectl
- Helm
- Kind

## Quick Start

```bash
git clone https://github.com/johnsushiarulraj/microservice-platform
cd microservice-platform
./scripts/start-infra.sh
```

Open http://localhost:13001 — everything is ready.

## What's Included

### Management UIs

| UI                    | URL                          | Credentials           |
|-----------------------|------------------------------|-----------------------|
| DevConsole            | http://localhost:13001        |                       |
| Keycloak              | http://localhost:18081        | admin / admin         |
| Grafana               | http://localhost:13000        | admin / admin         |
| Prometheus            | http://localhost:19090        |                       |
| pgAdmin               | http://localhost:15050        | admin@admin.com / admin |
| OpenSearch Dashboards | http://localhost:15601        |                       |
| DynamoDB Admin        | http://localhost:18001        |                       |
| Kafka UI              | http://localhost:18002        |                       |
| Kubernetes Dashboard  | https://localhost:13003       |                       |

### Data Services

| Service                    | Connection                                |
|----------------------------|-------------------------------------------|
| PostgreSQL                 | localhost:15432 (template / template123)   |
| Redis                      | Inside cluster only (redis-master:6379)   |
| Kafka                      | localhost:19092                            |
| LocalStack (S3, SQS, DDB) | http://localhost:14566                     |
| OpenSearch                 | http://localhost:19200                     |

### Infrastructure

- Spring Cloud Gateway (auth, rate limiting, tracing, circuit breaker)
- Keycloak (OAuth2 / JWT authentication)
- PostgreSQL + Redis + Kafka + OpenSearch
- LocalStack (S3, SQS, DynamoDB)
- Prometheus + Grafana + Loki (observability)
- NGINX Ingress Controller

## Scripts

| Script                          | What it does                          |
|---------------------------------|---------------------------------------|
| `./scripts/start-infra.sh`     | Start everything                      |
| `./scripts/stop-infra.sh`      | Stop everything (data preserved)      |
| `./scripts/stop-infra.sh --clean` | Stop + wipe all data               |

## Create Your First Service

1. Open http://localhost:13001 (DevConsole)
2. Click "Create Service"
3. Pick a name, choose dependencies, configure
4. Download ZIP
5. Extract, open in your IDE
6. Write your code
7. Run: `./build.sh 1.0.0`
8. Back in DevConsole — Deploy — pick your image tag
9. Your service is live

## Repo Structure

```
microservice-platform/
├── services/
│   ├── devconsole/          ← Management UI (Spring Boot + React)
│   ├── api-gateway/         ← Spring Cloud Gateway
│   └── template/            ← Source template for scaffolding
├── infrastructure/
│   ├── helm/                ← Helm charts
│   ├── kubernetes/          ← K8s manifests
│   ├── kind/                ← Kind cluster config
│   └── config/              ← Registry config
├── scripts/
│   ├── start-infra.sh
│   └── stop-infra.sh
├── data/                    ← Persistent data (gitignored)
├── PLAN.md                  ← Full build plan
├── PROGRESS.md              ← Build progress tracking
└── README.md
```

## Data Persistence

Data survives cluster restarts:

```bash
./scripts/stop-infra.sh          # data saved in ./data/
./scripts/start-infra.sh         # picks up where you left off
```

Fresh start:

```bash
./scripts/stop-infra.sh --clean  # wipes ./data/
./scripts/start-infra.sh         # brand new
```

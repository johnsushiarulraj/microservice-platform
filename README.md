<div align="center">

# JavaBackend

**Your local production backend.**

A complete microservice platform running on your machine. PostgreSQL, Kafka, Redis, S3, OpenSearch, Keycloak, Grafana — all wired together in Kubernetes. Just deploy your service.

[Create a Service](http://localhost:18090/devconsole/create) · [Tutorial](http://localhost:18090/devconsole/tutorial) · [Documentation](http://localhost:18090/devconsole/learn)

</div>

---

## Why?

In companies, infrastructure teams wire everything together. You just write your service and deploy.

**JavaBackend gives you that same setup locally.**

- No months of infrastructure configuration
- No Docker Compose files to maintain
- No "works on my machine" — it runs in Kubernetes, just like production
- Create a service from the template, build, deploy. Everything else is ready.

Think **LocalStack** meets **Spring Initializr** — but for the full backend stack.

## Quick Start

```bash
git clone https://github.com/johnsushiarulraj/microservice-platform
cd microservice-platform
./scripts/start-infra.sh
```

Open **http://localhost:18090/devconsole/** — your platform is ready.

### Create Your First Service

1. Go to [Create Service](http://localhost:18090/devconsole/create)
2. Enter a name (e.g., `order-service`)
3. Select dependencies (PostgreSQL, Kafka, Redis, etc.)
4. Download the ZIP
5. Extract, build, deploy:

```bash
unzip order-service.zip && cd order-service
./scripts/build.sh 1.0.0
# Sign in to DevConsole → Services → Deploy
```

Your service is live in Kubernetes — connected to all infrastructure.

## What's Included

### Infrastructure (runs in a 3-node Kind cluster)

| Service | Purpose | Port |
|---------|---------|------|
| **PostgreSQL** | Relational database | `localhost:15432` |
| **Redis** | In-memory cache | cluster internal |
| **Kafka** (Strimzi) | Event streaming | `localhost:19092` |
| **S3 / SQS / DynamoDB** (LocalStack) | AWS services | `localhost:14566` |
| **OpenSearch** | Full-text search | `localhost:19200` |
| **Keycloak** | Auth & SSO (OAuth2/JWT) | `localhost:18081` |
| **Spring Cloud Gateway** | API routing, rate limiting, circuit breaking | `localhost:18090` |
| **Prometheus + Grafana** | Metrics & dashboards | `localhost:13000` |
| **Loki** | Log aggregation | cluster internal |

### Management UIs

| UI | URL | Credentials |
|----|-----|-------------|
| **JavaBackend** (DevConsole) | http://localhost:18090/devconsole/ | testuser / password |
| Keycloak Admin | http://localhost:18081 | admin / admin |
| Grafana | http://localhost:13000 | admin / admin |
| Prometheus | http://localhost:19090 | — |
| pgAdmin | http://localhost:15050 | admin@admin.com / admin |
| Kafka UI | http://localhost:18002 | — |
| OpenSearch Dashboards | http://localhost:15601 | — |
| DynamoDB Admin | http://localhost:18001 | — |

### Service Template

Every generated service includes:

- **Spring Boot 2.7** with selected dependencies pre-configured
- **Liquibase** database migrations
- **Kafka** consumers/producers (Spring Cloud Stream)
- **AWS SDK v2** for S3, SQS, DynamoDB (via LocalStack)
- **OpenSearch** client for full-text search
- **Keycloak** OAuth2 JWT authentication
- **Resilience4j** circuit breaker, retry, rate limiting
- **Prometheus** metrics + health checks
- **JaCoCo** code coverage
- **Unit tests + Integration tests** (Testcontainers)
- **Dockerfile + build.sh** — build and push with one command
- **rename.sh** — full rename automation (package, classes, topics, DB)

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Docker Desktop | Latest | [docker.com](https://www.docker.com/products/docker-desktop/) |
| Kind | v0.20+ | `brew install kind` / `choco install kind` |
| kubectl | v1.27+ | Comes with Docker Desktop |
| Helm | v3.12+ | `brew install helm` / `choco install kubernetes-helm` |
| Java | 11+ | `brew install openjdk@11` |
| Maven | 3.8+ | `brew install maven` |

> **Memory**: Allocate at least **8GB RAM** to Docker Desktop. 10GB recommended.

## Scripts

| Script | What it does |
|--------|-------------|
| `./scripts/start-infra.sh` | Create Kind cluster + install all infrastructure + start UIs |
| `./scripts/stop-infra.sh` | Stop everything (data preserved in `./data/`) |
| `./scripts/stop-infra.sh --clean` | Stop + wipe all data (fresh start) |

## Data Persistence

```bash
./scripts/stop-infra.sh          # data saved in ./data/
./scripts/start-infra.sh         # picks up where you left off

./scripts/stop-infra.sh --clean  # wipes ./data/ — fresh start
```

## Project Structure

```
microservice-platform/
├── services/
│   ├── devconsole/           # Management console (Spring Boot + React)
│   │   ├── backend/          # REST APIs, Keycloak setup, scaffold
│   │   └── frontend/         # React + Tailwind CSS
│   ├── api-gateway/          # Spring Cloud Gateway
│   └── template/             # Service template + rename script
├── infrastructure/
│   ├── helm/                 # Helm charts
│   ├── kubernetes/           # K8s manifests (Keycloak, Kafka, etc.)
│   └── kind/                 # Kind cluster config
├── scripts/
│   ├── start-infra.sh        # Start everything
│   └── stop-infra.sh         # Stop everything
└── data/                     # Persistent data (gitignored)
```

## Developer Workflow

```
1. Start platform        →  ./scripts/start-infra.sh
2. Create service         →  DevConsole → Create → Download ZIP
3. Write code             →  Open in IDE, implement your logic
4. Build & push image     →  ./scripts/build.sh 1.0.0
5. Deploy                 →  DevConsole → Services → Deploy
6. Test                   →  http://localhost:18090/<your-service>/api/...
7. Monitor                →  Grafana → Explore → Loki/Prometheus
8. Iterate                →  Change code → build.sh → redeploy
```

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Port-forwards die | `kubectl port-forward -n payments svc/api-gateway 18090:8090` |
| LocalStack restarts | Increase Docker memory to 10GB+ |
| Kafka entity operator CrashLoop | `kubectl patch kafka kafka -n payments --type merge -p '{"spec":{"entityOperator":{"topicOperator":{"resources":{"limits":{"memory":"512Mi"}}}}}}'` |
| Login returns "Account not fully set up" | Keycloak users need firstName/lastName/email — run the setup API |

## Contributing

Contributions are welcome! This project is designed to help backend developers learn microservices with a real, production-like setup.

1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT

---

<div align="center">

Built by [@johnsushiarulraj](https://github.com/johnsushiarulraj)

</div>

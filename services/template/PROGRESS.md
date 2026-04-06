# Project Progress
## Phase: 1 - Microservice Template
## Last Updated: 2026-04-05T18:00:00
## Current Step: P1-13 - Final Push and Tag
## Repository: https://github.com/johnsushiarulraj/spring-boot-microservice-template

| Step | Title                          | Status  | Timestamp        |
|------|--------------------------------|---------|------------------|
| P1-1 | Verify Prerequisites           | DONE    | 2026-04-05T00:01 |
| P1-2 | Create GitHub Repository       | DONE    | 2026-04-05T00:02 |
| P1-3 | Create Project Structure       | DONE    | 2026-04-05T01:00 |
| P1-4 | Compile Project                | DONE    | 2026-04-05T02:00 |
| P1-5 | Run Unit Tests (12/12 pass)    | DONE    | 2026-04-05T03:00 |
| P1-6 | Run Integration Tests          | PARTIAL | Blocked: Windows Docker npipe issue |
| P1-7 | Build Docker Image             | DONE    | 2026-04-05T04:00 |
| P1-8 | Create Kind Cluster            | DONE    | 2026-04-05T16:00 |
| P1-9 | Install Infrastructure         | DONE    | 2026-04-05T17:30 |
| P1-10| Deploy to Kind                 | DONE    | 2026-04-05T17:59 |
| P1-11| Verify Endpoints               | DONE    | 2026-04-05T18:00 |
| P1-12| Create Postman Collection      | DONE    | 2026-04-05T18:00 |
| P1-13| Final Push and Tag             | DONE    | 2026-04-05T18:05 |

## Notes
- Integration tests blocked on Windows Docker Desktop npipe issue (testcontainers can't connect)
- Kafka: Strimzi operator (KRaft mode, Kafka 4.1) replacing Bitnami (paywalled since Aug 2025)
- Keycloak: Official quay.io/keycloak/keycloak:24.0 replacing Bitnami (paywalled)
- Liquibase XSD: downgraded from 4.20 to 4.9 (only 4.9 bundled in Spring Boot 2.7.x's Liquibase)
- Resilience4j: downgraded from 1.7.1 to 1.7.0 (Spring Cloud BOM manages 1.7.0)
- AWS SDK: explicit UrlConnectionHttpClient to resolve multiple HTTP impls on classpath
- Redis property: spring.redis.host (not spring.data.redis.host which is Boot 3.x)
- Keycloak 24 health: /health/ready on port 9000 doesn't work in dev mode; use OIDC well-known endpoint
- Grafana: fixed duplicate default datasource by setting grafana.sidecar.datasources.defaultDatasourceEnabled=false
- OpenSearch 3.5.0: requires OPENSEARCH_INITIAL_ADMIN_PASSWORD env var (strong password)

# Architecture Decisions

This document explains the key technical decisions behind the JavaBackend platform — the **why**, not the what.

---

## 1. Why Kind (Kubernetes in Docker), not Minikube or Docker Compose?

**Decision:** Use Kind to run a 3-node Kubernetes cluster locally.

**Why:**
- Production microservices run in Kubernetes. Learning on Docker Compose teaches you Docker, not Kubernetes. The gap between "works on Compose" and "works in production" is weeks of config work.
- Kind runs real Kubernetes (same API, same RBAC, same networking) inside Docker containers. Services discover each other via DNS, deploy via Helm, and get ingress routing — identical to a cloud cluster.
- Minikube runs a single-node VM. Kind is lighter, faster, and supports multi-node clusters for realistic testing.
- Docker Compose doesn't give you: service discovery, rolling deployments, health-based restarts, config maps, secrets, or ingress. Kind does.

**Trade-off:** Kind uses more memory (~8GB recommended) and requires Docker. This is intentional — we want the real thing, not a simulation.

---

## 2. Why Spring Boot 2.7, not 3.x?

**Decision:** Template services use Spring Boot 2.7.18.

**Why:**
- Spring Boot 3.x requires Java 17+. Many developers and organizations still run Java 11. Using 2.7 maximizes compatibility.
- 2.7 is the last LTS release before the Jakarta EE namespace migration. It works with `javax.*` packages, which most libraries and tutorials still reference.
- Spring Cloud Stream, Resilience4j, and the Keycloak adapter all have stable, well-documented 2.7-compatible versions. The 3.x versions had breaking changes at the time this platform was built.
- The concepts (dependency injection, JPA, REST controllers, security filters) are identical. Code written for 2.7 migrates to 3.x with search-and-replace on the namespace.

**Trade-off:** No virtual threads, no native compilation. For a learning/development platform, this doesn't matter.

---

## 3. Why Strimzi for Kafka, not a plain Kafka Helm chart?

**Decision:** Use the Strimzi Kafka operator with KRaft mode (no ZooKeeper).

**Why:**
- Strimzi is the standard way to run Kafka on Kubernetes. It manages the full lifecycle: deployment, scaling, topic creation, user management.
- KRaft mode removes ZooKeeper entirely, which saves ~500MB of memory and eliminates a component that adds complexity without teaching anything useful.
- Strimzi provides the `KafkaTopic` CRD. The platform creates topics by applying YAML manifests (`kubectl apply`), which is the Kubernetes-native way. No Kafka CLI needed.
- The Entity Operator watches for topic/user CRDs and reconciles automatically — topics survive pod restarts without manual intervention.

**Trade-off:** Strimzi's operator needs ~512Mi memory. We patch the default to avoid OOMKills in a constrained local environment.

---

## 4. Why LocalStack, not real AWS?

**Decision:** Use LocalStack 3.0 for S3, SQS, and DynamoDB.

**Why:**
- Real AWS requires an account, credentials, and costs money. This platform should work offline with zero cloud dependencies.
- LocalStack emulates the AWS API locally. The same AWS SDK code (`S3Client`, `SqsClient`, `DynamoDbClient`) works with LocalStack and real AWS — just change the endpoint.
- Services don't know they're talking to LocalStack. The abstraction is at the SDK level, not the application level.

**Trade-off:** LocalStack's free tier doesn't support all AWS services (no Lambda, no Step Functions). For S3/SQS/DynamoDB — which cover 90% of backend use cases — it's complete.

---

## 5. Why Spring Cloud Gateway, not NGINX or Kong?

**Decision:** Use Spring Cloud Gateway as the API gateway.

**Why:**
- The platform is a Java/Spring Boot learning environment. Using a Spring-based gateway means developers can read, modify, and debug the gateway code — it's just another Spring Boot app.
- It provides JWT validation, rate limiting (via Redis), and circuit breaking (Resilience4j) out of the box with Spring configuration, not Lua/NGINX config.
- CookieOrHeaderBearerTokenConverter allows JWT in both `Authorization` header and cookies, which makes browser-based UIs (pgAdmin, Grafana) work seamlessly through the gateway.
- Route configuration is YAML-based and follows the same patterns developers use in their own services.

**Trade-off:** Spring Cloud Gateway is Java — it uses more memory than NGINX. But in a learning environment where everything is Java, consistency is more valuable than memory savings.

---

## 6. Why a flat template structure, not a multi-module Maven project?

**Decision:** Generated services use a single `pom.xml` at the project root. No parent POM, no modules.

**Why:**
- Multi-module projects add cognitive overhead. You need to understand parent POM inheritance, module dependency ordering, and build reactor logic before you can do anything.
- A flat structure means: open in IDE → modify code → `mvn package` → done. There's one build, one JAR, one Dockerfile.
- The `spring-boot-starter-parent` POM provides everything a multi-module parent would (dependency management, plugin configuration). There's no benefit to another layer of indirection.

**Trade-off:** If you're building 10+ tightly-coupled services, a shared parent POM helps with version alignment. For independent microservices (which this platform teaches), a flat structure is better.

---

## 7. Why Keycloak for auth, not a simple JWT issuer?

**Decision:** Run a full Keycloak instance with realm/client/role management.

**Why:**
- In production, identity management is a separate service. Keycloak is the most widely used open-source identity provider in the Java ecosystem.
- It provides OAuth2/OIDC flows, user management, role-based access control, Google SSO integration, and password policies — things that a simple JWT issuer can't.
- Each generated service gets its own Keycloak realm and client. This demonstrates multi-tenant auth patterns that are common in real systems.
- The admin console provides a UI for user/role management that would take weeks to build from scratch.

**Trade-off:** Keycloak is heavy (~1GB memory). We configure it with a PostgreSQL backend (shared with the platform) to reduce overhead.

---

## 8. Why `start-infra.sh` provisions everything, not Terraform/Ansible?

**Decision:** A single bash script handles all infrastructure setup.

**Why:**
- The target audience is developers, not DevOps engineers. A bash script is readable — you can see exactly what happens at each step.
- Terraform requires state management, provider plugins, and HCL knowledge. Ansible requires inventory files and Python. Both add toolchain complexity that distracts from the goal.
- The script is idempotent: running it twice skips already-provisioned resources. Helm `upgrade --install` handles both first-deploy and re-deploy.
- Step-by-step output with numbered stages makes it easy to debug failures: "Step 7 failed" is more actionable than a Terraform plan diff.

**Trade-off:** Bash scripts don't scale to production infrastructure management. But this is a local dev platform — the entire cluster runs on one machine. Bash is the right tool for this scope.

---

## 9. Why NodePort services instead of port-forward for everything?

**Decision:** Key services (Gateway, Keycloak, Grafana, PostgreSQL, Prometheus) use NodePort with stable port mappings. Others use a port-forward watchdog.

**Why:**
- `kubectl port-forward` is fragile: it drops connections, doesn't survive pod restarts, and adds latency. For services accessed constantly (Gateway, Keycloak), this is unacceptable.
- NodePort gives each service a stable, predictable port on localhost. The Gateway is always `:18090`, Keycloak is always `:18081`. No surprises.
- Less-critical services (OpenSearch, LocalStack internal) use port-forward via a watchdog that auto-reconnects on failure.

**Trade-off:** NodePort uses a fixed port range (30000-32767 in Kubernetes). We map these to user-friendly ports via Docker's port publishing on the Kind nodes.

---

## 10. Why auto-redeploy from database on cluster restart?

**Decision:** `start-infra.sh` calls `POST /api/services/redeploy-all` after DevConsole is ready. This reads the `deployed_services` table and redeploys all previously deployed services.

**Why:**
- Kind clusters lose pod state on Docker restart. Without redeploy, users would need to manually re-deploy every service after a machine reboot.
- Storing deployment metadata (name, tag, context path, provision.yml) in PostgreSQL makes the system stateful. The database is the source of truth.
- Redeploy also re-provisions infrastructure (Kafka topics, databases, etc.) ensuring everything is consistent.

**Trade-off:** Redeploy adds time to startup. For a local dev platform that starts once per session, this is acceptable.

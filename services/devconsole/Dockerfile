FROM eclipse-temurin:11-jre-alpine
RUN addgroup -S spring && adduser -S spring -G spring
# Install kubectl, helm, git, sed, find for service management + scaffold
RUN apk add --no-cache curl bash git sed findutils && \
    curl -LO "https://dl.k8s.io/release/v1.34.0/bin/linux/amd64/kubectl" && \
    chmod +x kubectl && mv kubectl /usr/local/bin/ && \
    curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
WORKDIR /app
COPY services/devconsole/backend/target/devconsole-*.jar app.jar
COPY services/template /app/template
COPY infrastructure/helm/microservice-template /app/infrastructure/helm/microservice-template
RUN chown -R spring:spring /app/template && \
    git config --system user.email "scaffold@microservice-platform.dev" && \
    git config --system user.name "Scaffold Generator" && \
    git config --system init.defaultBranch main
USER spring
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]

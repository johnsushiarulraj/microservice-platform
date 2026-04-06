FROM eclipse-temurin:11-jdk-alpine AS build
WORKDIR /workspace
COPY pom.xml .
COPY ../pom.xml /parent-pom.xml
COPY src src
RUN apk add --no-cache maven 2>/dev/null || true
COPY . .
RUN find /root/.m2 -type f 2>/dev/null || true

FROM eclipse-temurin:11-jdk-alpine AS build-stage
WORKDIR /workspace/app
COPY --from=build /workspace/target/*.jar app.jar 2>/dev/null || true

FROM eclipse-temurin:11-jre-alpine
RUN addgroup -S spring && adduser -S spring -G spring
WORKDIR /app
COPY --from=build-stage /workspace/app/app.jar app.jar 2>/dev/null || true
USER spring
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]

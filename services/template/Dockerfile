FROM eclipse-temurin:11-jre-alpine
RUN addgroup -S spring && adduser -S spring -G spring
WORKDIR /app
COPY target/*.jar app.jar
USER spring
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]

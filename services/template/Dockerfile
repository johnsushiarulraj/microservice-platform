FROM eclipse-temurin:11-jre-alpine
RUN addgroup -S spring && adduser -S spring -G spring
WORKDIR /app
COPY microservice-template/target/microservice-template-*.jar app.jar
USER spring
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]

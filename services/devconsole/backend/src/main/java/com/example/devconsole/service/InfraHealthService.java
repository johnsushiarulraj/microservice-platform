package com.example.devconsole.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.sqs.SqsClient;

import javax.sql.DataSource;
import java.sql.Connection;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class InfraHealthService {

    private final DataSource dataSource;
    private final S3Client s3Client;
    private final SqsClient sqsClient;
    private final DynamoDbClient dynamoDbClient;

    @Value("${app.keycloak.host}")
    private String keycloakHost;

    @Value("${app.keycloak.port}")
    private int keycloakPort;

    @Value("${app.opensearch.host}")
    private String opensearchHost;

    @Value("${app.opensearch.port}")
    private int opensearchPort;

    @Value("${app.redis.host}")
    private String redisHost;

    @Value("${app.redis.port}")
    private int redisPort;

    @Value("${app.kafka.bootstrap-servers}")
    private String kafkaServers;

    public Map<String, Object> checkAll() {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("postgresql", checkPostgres());
        result.put("redis", checkRedis());
        result.put("kafka", checkKafka());
        result.put("localstack", checkLocalStack());
        result.put("keycloak", checkKeycloak());
        result.put("opensearch", checkOpenSearch());

        boolean allUp = result.values().stream()
                .allMatch(v -> v instanceof Map && "UP".equals(((Map<?, ?>) v).get("status")));
        result.put("overall", allUp ? "UP" : "DEGRADED");
        return result;
    }

    private Map<String, String> checkPostgres() {
        try (Connection conn = dataSource.getConnection()) {
            conn.createStatement().execute("SELECT 1");
            return Map.of("status", "UP");
        } catch (Exception e) {
            return Map.of("status", "DOWN", "error", e.getMessage());
        }
    }

    private Map<String, String> checkRedis() {
        try {
            java.net.Socket socket = new java.net.Socket();
            socket.connect(new java.net.InetSocketAddress(redisHost, redisPort), 2000);
            socket.close();
            return Map.of("status", "UP");
        } catch (Exception e) {
            return Map.of("status", "DOWN", "error", e.getMessage());
        }
    }

    private Map<String, String> checkKafka() {
        try {
            String[] parts = kafkaServers.split(":");
            java.net.Socket socket = new java.net.Socket();
            socket.connect(new java.net.InetSocketAddress(parts[0], Integer.parseInt(parts[1])), 2000);
            socket.close();
            return Map.of("status", "UP");
        } catch (Exception e) {
            return Map.of("status", "DOWN", "error", e.getMessage());
        }
    }

    private Map<String, String> checkLocalStack() {
        try {
            s3Client.listBuckets();
            return Map.of("status", "UP");
        } catch (Exception e) {
            return Map.of("status", "DOWN", "error", e.getMessage());
        }
    }

    private Map<String, String> checkKeycloak() {
        try {
            RestTemplate rest = new RestTemplate();
            rest.getForObject("http://" + keycloakHost + ":" + keycloakPort + "/auth/realms/template/.well-known/openid-configuration", String.class);
            return Map.of("status", "UP");
        } catch (Exception e) {
            return Map.of("status", "DOWN", "error", e.getMessage());
        }
    }

    private Map<String, String> checkOpenSearch() {
        try {
            java.net.Socket socket = new java.net.Socket();
            socket.connect(new java.net.InetSocketAddress(opensearchHost, opensearchPort), 2000);
            socket.close();
            return Map.of("status", "UP");
        } catch (Exception e) {
            return Map.of("status", "DOWN", "error", e.getMessage());
        }
    }
}

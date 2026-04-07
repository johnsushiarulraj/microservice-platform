package com.example.devconsole.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.yaml.snakeyaml.Yaml;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.sqs.SqsClient;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProvisionService {

    private final DataSource dataSource;
    private final S3Client s3Client;
    private final SqsClient sqsClient;

    @Value("${spring.datasource.url}")
    private String datasourceUrl;

    @Value("${spring.datasource.username}")
    private String datasourceUsername;

    @Value("${spring.datasource.password}")
    private String datasourcePassword;

    @Value("${app.opensearch.host:opensearch-cluster-master.payments.svc.cluster.local}")
    private String opensearchHost;

    @Value("${app.opensearch.port:9200}")
    private int opensearchPort;

    @Value("${app.opensearch.password:Str0ngP@ssw0rd#2026}")
    private String opensearchPassword;

    @Value("${app.keycloak.host}")
    private String keycloakHost;

    @Value("${app.keycloak.port}")
    private int keycloakPort;

    /**
     * Provision all infrastructure from a provision.yml string.
     * Returns a map of what was created vs skipped.
     */
    public Map<String, Object> provision(String yamlContent) {
        Yaml yaml = new Yaml();
        Map<String, Object> config = yaml.load(yamlContent);
        if (config == null) return Map.of("error", "Empty provision.yml");

        List<String> created = new ArrayList<>();
        List<String> skipped = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        String serviceName = (String) config.getOrDefault("service", "unknown");
        String prefix = serviceName.replace("-service", "");

        // Database
        if (config.containsKey("database")) {
            Map<String, Object> db = (Map<String, Object>) config.get("database");
            String dbName = (String) db.getOrDefault("name", prefix);
            String dbUser = (String) db.getOrDefault("user", prefix);
            String dbPassword = dbUser + "123";
            try {
                provisionDatabase(dbName, dbUser, dbPassword);
                created.add("database:" + dbName);
            } catch (Exception e) {
                if (e.getMessage() != null && e.getMessage().contains("already exists")) {
                    skipped.add("database:" + dbName);
                } else {
                    errors.add("database:" + dbName + " — " + e.getMessage());
                }
            }
        }

        // Kafka topics
        if (config.containsKey("kafka")) {
            Map<String, Object> kafka = (Map<String, Object>) config.get("kafka");
            List<String> topics = (List<String>) kafka.getOrDefault("topics", Collections.emptyList());
            for (String topic : topics) {
                try {
                    provisionKafkaTopic(topic);
                    created.add("kafka:" + topic);
                } catch (Exception e) {
                    if (e.getMessage() != null && e.getMessage().contains("already exists")) {
                        skipped.add("kafka:" + topic);
                    } else {
                        errors.add("kafka:" + topic + " — " + e.getMessage());
                    }
                }
            }
        }

        // SQS queues
        if (config.containsKey("sqs")) {
            Map<String, Object> sqs = (Map<String, Object>) config.get("sqs");
            List<String> queues = (List<String>) sqs.getOrDefault("queues", Collections.emptyList());
            for (String queue : queues) {
                try {
                    sqsClient.createQueue(r -> r.queueName(queue));
                    created.add("sqs:" + queue);
                } catch (Exception e) {
                    skipped.add("sqs:" + queue);
                }
            }
        }

        // S3 buckets
        if (config.containsKey("s3")) {
            Map<String, Object> s3 = (Map<String, Object>) config.get("s3");
            List<String> buckets = (List<String>) s3.getOrDefault("buckets", Collections.emptyList());
            for (String bucket : buckets) {
                try {
                    s3Client.createBucket(r -> r.bucket(bucket));
                    created.add("s3:" + bucket);
                } catch (Exception e) {
                    skipped.add("s3:" + bucket);
                }
            }
        }

        // DynamoDB tables
        if (config.containsKey("dynamodb")) {
            Map<String, Object> dynamo = (Map<String, Object>) config.get("dynamodb");
            List<Map<String, Object>> tables = (List<Map<String, Object>>) dynamo.getOrDefault("tables", Collections.emptyList());
            for (Map<String, Object> table : tables) {
                String tableName = (String) table.get("name");
                String pk = (String) table.getOrDefault("partitionKey", "id");
                try {
                    provisionDynamoTable(tableName, pk);
                    created.add("dynamodb:" + tableName);
                } catch (Exception e) {
                    skipped.add("dynamodb:" + tableName);
                }
            }
        }

        // OpenSearch indices
        if (config.containsKey("opensearch")) {
            Map<String, Object> os = (Map<String, Object>) config.get("opensearch");
            List<String> indices = (List<String>) os.getOrDefault("indices", Collections.emptyList());
            for (String index : indices) {
                try {
                    provisionOpenSearchIndex(index);
                    created.add("opensearch:" + index);
                } catch (Exception e) {
                    skipped.add("opensearch:" + index);
                }
            }
        }

        // Keycloak realm
        if (config.containsKey("keycloak")) {
            Map<String, Object> kc = (Map<String, Object>) config.get("keycloak");
            String realm = (String) kc.getOrDefault("realm", prefix);
            String client = (String) kc.getOrDefault("client", serviceName);
            List<String> roles = (List<String>) kc.getOrDefault("roles", Collections.emptyList());
            try {
                provisionKeycloak(realm, client, roles);
                created.add("keycloak:" + realm);
            } catch (Exception e) {
                skipped.add("keycloak:" + realm);
            }
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("service", serviceName);
        result.put("created", created);
        result.put("skipped", skipped);
        if (!errors.isEmpty()) result.put("errors", errors);
        return result;
    }

    /**
     * Connect to the 'postgres' admin database for CREATE DATABASE / CREATE USER.
     * The default DataSource connects to 'template' which may not allow DDL on other DBs.
     */
    private Connection getAdminConnection() throws Exception {
        // Replace the database name in the JDBC URL with 'postgres'
        String adminUrl = datasourceUrl.replaceFirst("/template(\\?.*)?$", "/postgres$1");
        return DriverManager.getConnection(adminUrl, datasourceUsername, datasourcePassword);
    }

    private void provisionDatabase(String dbName, String user, String password) throws Exception {
        try (Connection conn = getAdminConnection(); Statement stmt = conn.createStatement()) {
            conn.setAutoCommit(true);
            try { stmt.execute("CREATE DATABASE \"" + dbName + "\""); } catch (Exception e) {
                if (!e.getMessage().contains("already exists")) throw e;
            }
            try { stmt.execute("CREATE USER \"" + user + "\" WITH PASSWORD '" + password + "'"); } catch (Exception e) {
                if (!e.getMessage().contains("already exists")) throw e;
            }
            try { stmt.execute("GRANT ALL PRIVILEGES ON DATABASE \"" + dbName + "\" TO \"" + user + "\""); } catch (Exception ignored) {}
        }
    }

    /**
     * Deprovision infrastructure created from a provision.yml.
     * Deletes databases, Kafka topics, SQS queues, S3 buckets, DynamoDB tables, OpenSearch indices, Keycloak realms.
     */
    public Map<String, Object> deprovision(String yamlContent) {
        Yaml yaml = new Yaml();
        Map<String, Object> config = yaml.load(yamlContent);
        if (config == null) return Map.of("error", "Empty provision.yml");

        List<String> removed = new ArrayList<>();
        List<String> errors = new ArrayList<>();
        String serviceName = (String) config.getOrDefault("service", "unknown");
        String prefix = serviceName.replace("-service", "");

        // Database
        if (config.containsKey("database")) {
            Map<String, Object> db = (Map<String, Object>) config.get("database");
            String dbName = (String) db.getOrDefault("name", prefix);
            String dbUser = (String) db.getOrDefault("user", prefix);
            try {
                deprovisionDatabase(dbName, dbUser);
                removed.add("database:" + dbName);
            } catch (Exception e) { errors.add("database:" + dbName + " — " + e.getMessage()); }
        }

        // Kafka topics
        if (config.containsKey("kafka")) {
            Map<String, Object> kafka = (Map<String, Object>) config.get("kafka");
            List<String> topics = (List<String>) kafka.getOrDefault("topics", Collections.emptyList());
            for (String topic : topics) {
                try {
                    ProcessBuilder pb = new ProcessBuilder("kubectl", "delete", "kafkatopic", topic, "-n", "payments", "--ignore-not-found");
                    pb.redirectErrorStream(true);
                    Process proc = pb.start();
                    proc.getInputStream().readAllBytes();
                    proc.waitFor();
                    removed.add("kafka:" + topic);
                } catch (Exception e) { errors.add("kafka:" + topic + " — " + e.getMessage()); }
            }
        }

        // SQS queues
        if (config.containsKey("sqs")) {
            Map<String, Object> sqs = (Map<String, Object>) config.get("sqs");
            List<String> queues = (List<String>) sqs.getOrDefault("queues", Collections.emptyList());
            for (String queue : queues) {
                try {
                    String queueUrl = sqsClient.getQueueUrl(r -> r.queueName(queue)).queueUrl();
                    sqsClient.deleteQueue(r -> r.queueUrl(queueUrl));
                    removed.add("sqs:" + queue);
                } catch (Exception e) { errors.add("sqs:" + queue + " — " + e.getMessage()); }
            }
        }

        // S3 buckets
        if (config.containsKey("s3")) {
            Map<String, Object> s3 = (Map<String, Object>) config.get("s3");
            List<String> buckets = (List<String>) s3.getOrDefault("buckets", Collections.emptyList());
            for (String bucket : buckets) {
                try {
                    s3Client.deleteBucket(r -> r.bucket(bucket));
                    removed.add("s3:" + bucket);
                } catch (Exception e) { errors.add("s3:" + bucket + " — " + e.getMessage()); }
            }
        }

        // DynamoDB tables
        if (config.containsKey("dynamodb")) {
            Map<String, Object> dynamo = (Map<String, Object>) config.get("dynamodb");
            List<Map<String, Object>> tables = (List<Map<String, Object>>) dynamo.getOrDefault("tables", Collections.emptyList());
            for (Map<String, Object> table : tables) {
                String tableName = (String) table.get("name");
                try {
                    var dynamoClient = software.amazon.awssdk.services.dynamodb.DynamoDbClient.builder()
                        .endpointOverride(java.net.URI.create("http://localstack.payments.svc.cluster.local:4566"))
                        .region(software.amazon.awssdk.regions.Region.US_EAST_1)
                        .credentialsProvider(software.amazon.awssdk.auth.credentials.StaticCredentialsProvider.create(
                            software.amazon.awssdk.auth.credentials.AwsBasicCredentials.create("test", "test")))
                        .httpClient(software.amazon.awssdk.http.urlconnection.UrlConnectionHttpClient.create())
                        .build();
                    dynamoClient.deleteTable(r -> r.tableName(tableName));
                    removed.add("dynamodb:" + tableName);
                } catch (Exception e) { errors.add("dynamodb:" + tableName + " — " + e.getMessage()); }
            }
        }

        // OpenSearch indices
        if (config.containsKey("opensearch")) {
            Map<String, Object> os = (Map<String, Object>) config.get("opensearch");
            List<String> indices = (List<String>) os.getOrDefault("indices", Collections.emptyList());
            for (String index : indices) {
                try { deleteOpenSearchIndex(index); removed.add("opensearch:" + index); }
                catch (Exception e) { errors.add("opensearch:" + index + " — " + e.getMessage()); }
            }
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("service", serviceName);
        result.put("removed", removed);
        if (!errors.isEmpty()) result.put("errors", errors);
        return result;
    }

    private void deprovisionDatabase(String dbName, String user) throws Exception {
        try (Connection conn = getAdminConnection(); Statement stmt = conn.createStatement()) {
            conn.setAutoCommit(true);
            // Terminate connections to the database first
            try {
                stmt.execute("SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '" + dbName + "' AND pid <> pg_backend_pid()");
            } catch (Exception ignored) {}
            try { stmt.execute("DROP DATABASE IF EXISTS \"" + dbName + "\""); } catch (Exception ignored) {}
            try { stmt.execute("DROP USER IF EXISTS \"" + user + "\""); } catch (Exception ignored) {}
        }
    }

    private void deleteOpenSearchIndex(String index) throws Exception {
        var url = new java.net.URL("https://" + opensearchHost + ":" + opensearchPort + "/" + index);
        var conn = (javax.net.ssl.HttpsURLConnection) url.openConnection();
        conn.setHostnameVerifier((h, s) -> true);
        var ctx = javax.net.ssl.SSLContext.getInstance("TLS");
        ctx.init(null, new javax.net.ssl.TrustManager[]{new javax.net.ssl.X509TrustManager() {
            public void checkClientTrusted(java.security.cert.X509Certificate[] c, String a) {}
            public void checkServerTrusted(java.security.cert.X509Certificate[] c, String a) {}
            public java.security.cert.X509Certificate[] getAcceptedIssuers() { return null; }
        }}, null);
        conn.setSSLSocketFactory(ctx.getSocketFactory());
        String auth = Base64.getEncoder().encodeToString(("admin:" + opensearchPassword).getBytes());
        conn.setRequestProperty("Authorization", "Basic " + auth);
        conn.setRequestMethod("DELETE");
        conn.getResponseCode();
    }

    private void provisionKafkaTopic(String topic) throws Exception {
        // Create a KafkaTopic CR via kubectl
        String yaml = String.format(
            "apiVersion: kafka.strimzi.io/v1beta2\nkind: KafkaTopic\nmetadata:\n  name: %s\n  namespace: payments\n  labels:\n    strimzi.io/cluster: kafka\nspec:\n  partitions: 3\n  replicas: 1",
            topic);
        ProcessBuilder pb = new ProcessBuilder("kubectl", "apply", "-f", "-");
        pb.redirectErrorStream(true);
        Process proc = pb.start();
        proc.getOutputStream().write(yaml.getBytes());
        proc.getOutputStream().close();
        String output = new String(proc.getInputStream().readAllBytes());
        int exit = proc.waitFor();
        if (exit != 0 && !output.contains("unchanged") && !output.contains("already exists")) {
            throw new RuntimeException(output);
        }
    }

    private void provisionDynamoTable(String tableName, String partitionKey) throws Exception {
        // Use AWS SDK
        var dynamoClient = software.amazon.awssdk.services.dynamodb.DynamoDbClient.builder()
            .endpointOverride(java.net.URI.create("http://localstack.payments.svc.cluster.local:4566"))
            .region(software.amazon.awssdk.regions.Region.US_EAST_1)
            .credentialsProvider(software.amazon.awssdk.auth.credentials.StaticCredentialsProvider.create(
                software.amazon.awssdk.auth.credentials.AwsBasicCredentials.create("test", "test")))
            .httpClient(software.amazon.awssdk.http.urlconnection.UrlConnectionHttpClient.create())
            .build();
        dynamoClient.createTable(r -> r
            .tableName(tableName)
            .keySchema(software.amazon.awssdk.services.dynamodb.model.KeySchemaElement.builder()
                .attributeName(partitionKey).keyType(software.amazon.awssdk.services.dynamodb.model.KeyType.HASH).build())
            .attributeDefinitions(software.amazon.awssdk.services.dynamodb.model.AttributeDefinition.builder()
                .attributeName(partitionKey).attributeType(software.amazon.awssdk.services.dynamodb.model.ScalarAttributeType.S).build())
            .billingMode(software.amazon.awssdk.services.dynamodb.model.BillingMode.PAY_PER_REQUEST));
    }

    private void provisionOpenSearchIndex(String index) throws Exception {
        var url = new java.net.URL("https://" + opensearchHost + ":" + opensearchPort + "/" + index);
        var conn = (javax.net.ssl.HttpsURLConnection) url.openConnection();
        // Trust all certs for local dev
        conn.setHostnameVerifier((h, s) -> true);
        var ctx = javax.net.ssl.SSLContext.getInstance("TLS");
        ctx.init(null, new javax.net.ssl.TrustManager[]{new javax.net.ssl.X509TrustManager() {
            public void checkClientTrusted(java.security.cert.X509Certificate[] c, String a) {}
            public void checkServerTrusted(java.security.cert.X509Certificate[] c, String a) {}
            public java.security.cert.X509Certificate[] getAcceptedIssuers() { return null; }
        }}, null);
        conn.setSSLSocketFactory(ctx.getSocketFactory());
        String auth = Base64.getEncoder().encodeToString(("admin:" + opensearchPassword).getBytes());
        conn.setRequestProperty("Authorization", "Basic " + auth);
        conn.setRequestMethod("PUT");
        conn.setDoOutput(true);
        conn.setRequestProperty("Content-Type", "application/json");
        conn.getOutputStream().write("{}".getBytes());
        conn.getResponseCode(); // execute
    }

    private void provisionKeycloak(String realm, String client, List<String> roles) throws Exception {
        // Get admin token
        var tokenUrl = "http://" + keycloakHost + ":" + keycloakPort + "/auth/realms/master/protocol/openid-connect/token";
        var params = "grant_type=password&client_id=admin-cli&username=admin&password=admin";
        var tokenConn = new java.net.URL(tokenUrl).openConnection();
        tokenConn.setDoOutput(true);
        ((java.net.HttpURLConnection) tokenConn).setRequestMethod("POST");
        tokenConn.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");
        tokenConn.getOutputStream().write(params.getBytes());
        var tokenResp = new String(tokenConn.getInputStream().readAllBytes());
        var token = tokenResp.split("\"access_token\":\"")[1].split("\"")[0];

        var baseUrl = "http://" + keycloakHost + ":" + keycloakPort + "/auth/admin/realms";

        // Create realm
        try {
            var realmConn = (java.net.HttpURLConnection) new java.net.URL(baseUrl).openConnection();
            realmConn.setRequestMethod("POST");
            realmConn.setRequestProperty("Authorization", "Bearer " + token);
            realmConn.setRequestProperty("Content-Type", "application/json");
            realmConn.setDoOutput(true);
            realmConn.getOutputStream().write(("{\"realm\":\"" + realm + "\",\"enabled\":true}").getBytes());
            realmConn.getResponseCode();
        } catch (Exception ignored) {} // realm may already exist

        // Create client
        try {
            var clientConn = (java.net.HttpURLConnection) new java.net.URL(baseUrl + "/" + realm + "/clients").openConnection();
            clientConn.setRequestMethod("POST");
            clientConn.setRequestProperty("Authorization", "Bearer " + token);
            clientConn.setRequestProperty("Content-Type", "application/json");
            clientConn.setDoOutput(true);
            clientConn.getOutputStream().write(("{\"clientId\":\"" + client + "\",\"enabled\":true,\"publicClient\":false,\"secret\":\"" + client + "-secret\",\"directAccessGrantsEnabled\":true,\"redirectUris\":[\"*\"],\"webOrigins\":[\"*\"]}").getBytes());
            clientConn.getResponseCode();
        } catch (Exception ignored) {}

        // Create roles
        for (String role : roles) {
            try {
                var roleConn = (java.net.HttpURLConnection) new java.net.URL(baseUrl + "/" + realm + "/roles").openConnection();
                roleConn.setRequestMethod("POST");
                roleConn.setRequestProperty("Authorization", "Bearer " + token);
                roleConn.setRequestProperty("Content-Type", "application/json");
                roleConn.setDoOutput(true);
                roleConn.getOutputStream().write(("{\"name\":\"" + role + "\"}").getBytes());
                roleConn.getResponseCode();
            } catch (Exception ignored) {}
        }

        // Create a test user (testuser / 1Johnsushil) so tokens can be obtained immediately
        try {
            var userConn = (java.net.HttpURLConnection) new java.net.URL(baseUrl + "/" + realm + "/users").openConnection();
            userConn.setRequestMethod("POST");
            userConn.setRequestProperty("Authorization", "Bearer " + token);
            userConn.setRequestProperty("Content-Type", "application/json");
            userConn.setDoOutput(true);
            userConn.getOutputStream().write(("{\"username\":\"testuser\",\"enabled\":true,\"emailVerified\":true," +
                "\"email\":\"testuser@" + realm + ".local\",\"firstName\":\"Test\",\"lastName\":\"User\"," +
                "\"credentials\":[{\"type\":\"password\",\"value\":\"1Johnsushil\",\"temporary\":false}]}").getBytes());
            int userStatus = userConn.getResponseCode();
            if (userStatus == 201) {
                // Assign the first role to the user
                if (!roles.isEmpty()) {
                    var usersConn = (java.net.HttpURLConnection) new java.net.URL(baseUrl + "/" + realm + "/users?username=testuser").openConnection();
                    usersConn.setRequestProperty("Authorization", "Bearer " + token);
                    var usersResp = new String(usersConn.getInputStream().readAllBytes());
                    var userId = usersResp.split("\"id\":\"")[1].split("\"")[0];
                    for (String role : roles) {
                        try {
                            var roleInfoConn = (java.net.HttpURLConnection) new java.net.URL(baseUrl + "/" + realm + "/roles/" + role).openConnection();
                            roleInfoConn.setRequestProperty("Authorization", "Bearer " + token);
                            var roleJson = new String(roleInfoConn.getInputStream().readAllBytes());
                            var assignConn = (java.net.HttpURLConnection) new java.net.URL(baseUrl + "/" + realm + "/users/" + userId + "/role-mappings/realm").openConnection();
                            assignConn.setRequestMethod("POST");
                            assignConn.setRequestProperty("Authorization", "Bearer " + token);
                            assignConn.setRequestProperty("Content-Type", "application/json");
                            assignConn.setDoOutput(true);
                            assignConn.getOutputStream().write(("[" + roleJson + "]").getBytes());
                            assignConn.getResponseCode();
                        } catch (Exception ignored) {}
                    }
                }
                log.info("Created test user in realm {} with all roles", realm);
            }
        } catch (Exception e) {
            log.debug("Test user may already exist in realm {}: {}", realm, e.getMessage());
        }
    }
}

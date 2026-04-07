package com.example.devconsole.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class KubernetesService {

    private final ShellService shell;

    @Value("${app.kubernetes.namespace}")
    private String namespace;

    @Value("${app.registry.org}")
    private String registryOrg;

    @Value("${app.registry.url}")
    private String registryUrl;

    public List<Map<String, String>> listDeployedServices() {
        String output = shell.execute("helm", "list", "-n", namespace, "-o", "json");
        if (output == null || output.isBlank() || output.equals("[]")) {
            return List.of();
        }
        // Parse helm JSON output — each entry has name, status, chart, app_version
        return Arrays.stream(output.split("\\},\\{"))
                .map(entry -> {
                    Map<String, String> m = new LinkedHashMap<>();
                    m.put("name", extractJson(entry, "name"));
                    m.put("status", extractJson(entry, "status"));
                    m.put("chart", extractJson(entry, "chart"));
                    return m;
                })
                .collect(Collectors.toList());
    }

    @Value("${app.gateway.internal-url:http://api-gateway.payments.svc.cluster.local:8090}")
    private String gatewayInternalUrl;

    public Map<String, String> deployService(String name, String tag, String contextPath) {
        String image = name + ":" + tag;
        String helmChart = "/app/infrastructure/helm/microservice-template";

        // Image should already be loaded into Kind by the user's build script.
        // Just deploy with Helm.
        log.info("Deploying {} with image {}", name, image);
        shell.execute("helm", "upgrade", "--install", name, helmChart,
                "-n", namespace,
                "--set", "image.repository=" + name,
                "--set", "image.tag=" + tag,
                "--set", "image.pullPolicy=IfNotPresent",
                "--set", "env.SPRING_PROFILES_ACTIVE=local",
                "--set", "env.SERVER_SERVLET_CONTEXT_PATH=" + contextPath,
                "--wait", "--timeout", "180s");

        // Register a gateway route so the service is accessible through the API gateway
        registerGatewayRoute(name, contextPath);

        return Map.of("name", name, "image", image, "status", "deployed");
    }

    public Map<String, String> destroyService(String name) {
        shell.execute("helm", "uninstall", name, "-n", namespace);
        removeGatewayRoute(name);
        return Map.of("name", name, "status", "destroyed");
    }

    private void registerGatewayRoute(String name, String contextPath) {
        try {
            String routeId = "user-" + name;
            String serviceUrl = "http://" + name + "." + namespace + ".svc.cluster.local:8080";
            String json = "{\"uri\":\"" + serviceUrl + "\",\"predicates\":[{\"name\":\"Path\",\"args\":{\"pattern\":\"" + contextPath + "/**\"}}]}";
            var url = new java.net.URL(gatewayInternalUrl + "/actuator/gateway/routes/" + routeId);
            var conn = (java.net.HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setDoOutput(true);
            conn.getOutputStream().write(json.getBytes());
            int status = conn.getResponseCode();
            log.info("Registered gateway route {} -> {} (status {})", contextPath, serviceUrl, status);
            // Refresh routes
            var refreshUrl = new java.net.URL(gatewayInternalUrl + "/actuator/gateway/refresh");
            var refreshConn = (java.net.HttpURLConnection) refreshUrl.openConnection();
            refreshConn.setRequestMethod("POST");
            refreshConn.setRequestProperty("Content-Type", "application/json");
            refreshConn.getResponseCode();
        } catch (Exception e) {
            log.warn("Failed to register gateway route for {}: {}", name, e.getMessage());
        }
    }

    private void removeGatewayRoute(String name) {
        try {
            String routeId = "user-" + name;
            var url = new java.net.URL(gatewayInternalUrl + "/actuator/gateway/routes/" + routeId);
            var conn = (java.net.HttpURLConnection) url.openConnection();
            conn.setRequestMethod("DELETE");
            int status = conn.getResponseCode();
            log.info("Removed gateway route {} (status {})", routeId, status);
            var refreshUrl = new java.net.URL(gatewayInternalUrl + "/actuator/gateway/refresh");
            var refreshConn = (java.net.HttpURLConnection) refreshUrl.openConnection();
            refreshConn.setRequestMethod("POST");
            refreshConn.setRequestProperty("Content-Type", "application/json");
            refreshConn.getResponseCode();
        } catch (Exception e) {
            log.warn("Failed to remove gateway route for {}: {}", name, e.getMessage());
        }
    }

    public Map<String, String> restartService(String name) {
        shell.execute("kubectl", "rollout", "restart", "deployment/" + name, "-n", namespace);
        return Map.of("name", name, "status", "restarting");
    }

    public Map<String, String> scaleService(String name, int replicas) {
        shell.execute("kubectl", "scale", "deployment/" + name,
                "--replicas=" + replicas, "-n", namespace);
        return Map.of("name", name, "replicas", String.valueOf(replicas));
    }

    public List<Map<String, String>> getPodStatus(String name) {
        // Try Helm label first, then fall back to simple app label
        String output = shell.execute("kubectl", "get", "pods", "-n", namespace,
                "-l", "app.kubernetes.io/instance=" + name,
                "-o", "custom-columns=NAME:.metadata.name,READY:.status.conditions[?(@.type=='Ready')].status,STATUS:.status.phase,RESTARTS:.status.containerStatuses[0].restartCount,AGE:.metadata.creationTimestamp",
                "--no-headers");
        if (output == null || output.isBlank() || output.contains("No resources found")) {
            output = shell.execute("kubectl", "get", "pods", "-n", namespace,
                    "-l", "app=" + name,
                    "-o", "custom-columns=NAME:.metadata.name,READY:.status.conditions[?(@.type=='Ready')].status,STATUS:.status.phase,RESTARTS:.status.containerStatuses[0].restartCount,AGE:.metadata.creationTimestamp",
                    "--no-headers");
        }
        if (output == null || output.isBlank() || output.contains("No resources found")) return List.of();
        return output.lines()
                .filter(l -> !l.isBlank())
                .map(line -> {
                    String[] cols = line.trim().split("\\s+", 5);
                    Map<String, String> m = new LinkedHashMap<>();
                    m.put("name", cols.length > 0 ? cols[0] : "");
                    m.put("ready", cols.length > 1 ? cols[1] : "");
                    m.put("status", cols.length > 2 ? cols[2] : "");
                    m.put("restarts", cols.length > 3 ? cols[3] : "0");
                    m.put("age", cols.length > 4 ? cols[4] : "");
                    return m;
                })
                .collect(Collectors.toList());
    }

    public String getLogs(String name, int lines) {
        String output = shell.execute("kubectl", "logs", "-n", namespace,
                "--selector=app.kubernetes.io/instance=" + name,
                "--tail=" + lines, "--all-containers=true", "--prefix=true");
        if (output == null || output.isBlank() || output.contains("No resources found")) {
            output = shell.execute("kubectl", "logs", "-n", namespace,
                    "--selector=app=" + name,
                    "--tail=" + lines, "--all-containers=true", "--prefix=true");
        }
        return output;
    }

    private String extractJson(String json, String key) {
        int idx = json.indexOf("\"" + key + "\"");
        if (idx < 0) return "";
        int start = json.indexOf("\"", idx + key.length() + 3) + 1;
        int end = json.indexOf("\"", start);
        return (start > 0 && end > start) ? json.substring(start, end) : "";
    }
}

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

    public Map<String, String> deployService(String name, String tag, String contextPath) {
        String image = "ghcr.io/" + registryOrg + "/" + name + ":" + tag;
        String helmChart = "/app/infrastructure/helm/microservice-template";

        // Pull image and load into kind
        log.info("Deploying {} with image {}", name, image);
        shell.execute("docker", "pull", image);
        shell.execute("kind", "load", "docker-image", image, "--name", "template-local");

        // Deploy with helm
        shell.execute("helm", "upgrade", "--install", name, helmChart,
                "-n", namespace,
                "--set", "image.repository=ghcr.io/" + registryOrg + "/" + name,
                "--set", "image.tag=" + tag,
                "--set", "env.SPRING_PROFILES_ACTIVE=local",
                "--set", "env.SERVER_SERVLET_CONTEXT_PATH=" + contextPath,
                "--wait", "--timeout", "180s");

        return Map.of("name", name, "image", image, "status", "deployed");
    }

    public Map<String, String> destroyService(String name) {
        shell.execute("helm", "uninstall", name, "-n", namespace);
        return Map.of("name", name, "status", "destroyed");
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

    private String extractJson(String json, String key) {
        int idx = json.indexOf("\"" + key + "\"");
        if (idx < 0) return "";
        int start = json.indexOf("\"", idx + key.length() + 3) + 1;
        int end = json.indexOf("\"", start);
        return (start > 0 && end > start) ? json.substring(start, end) : "";
    }
}

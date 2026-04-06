package com.example.devconsole.controller;

import com.example.devconsole.service.KeycloakSetupService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/setup")
@RequiredArgsConstructor
public class SetupController {

    private final KeycloakSetupService keycloakSetup;

    /**
     * Set up Keycloak realm with client, roles, and users.
     * Idempotent — safe to call multiple times.
     */
    @PostMapping("/keycloak")
    public Map<String, Object> setupKeycloak(@RequestBody(required = false) Map<String, Object> body) {
        // Defaults for the template realm
        String realm = body != null ? (String) body.getOrDefault("realm", "template") : "template";
        String clientId = body != null ? (String) body.getOrDefault("clientId", "microservice-template") : "microservice-template";
        String clientSecret = body != null ? (String) body.getOrDefault("clientSecret", "template-secret") : "template-secret";

        @SuppressWarnings("unchecked")
        List<String> roles = body != null && body.containsKey("roles")
                ? (List<String>) body.get("roles")
                : List.of("TEMPLATE_ADMIN", "TEMPLATE_USER", "TEMPLATE_VIEWER");

        @SuppressWarnings("unchecked")
        List<Map<String, String>> users = body != null && body.containsKey("users")
                ? (List<Map<String, String>>) body.get("users")
                : List.of(
                    Map.of("username", "testuser", "password", "password", "role", "TEMPLATE_USER"),
                    Map.of("username", "adminuser", "password", "password", "role", "TEMPLATE_ADMIN")
                );

        return keycloakSetup.setupRealm(realm, clientId, clientSecret, roles, users);
    }

    /**
     * Set up Keycloak for a specific service (creates realm, client, roles, users).
     */
    @PostMapping("/keycloak/{serviceName}")
    public Map<String, Object> setupKeycloakForService(@PathVariable String serviceName) {
        String pkg = serviceName.split("-")[0]; // payment-service → payment
        String realm = pkg;
        String clientId = serviceName;
        String clientSecret = pkg + "-secret";
        String rolePrefix = pkg.toUpperCase();

        return keycloakSetup.setupRealm(realm, clientId, clientSecret,
                List.of(rolePrefix + "_ADMIN", rolePrefix + "_USER", rolePrefix + "_VIEWER"),
                List.of(
                    Map.of("username", "testuser", "password", "password", "role", rolePrefix + "_USER"),
                    Map.of("username", "adminuser", "password", "password", "role", rolePrefix + "_ADMIN")
                ));
    }
}

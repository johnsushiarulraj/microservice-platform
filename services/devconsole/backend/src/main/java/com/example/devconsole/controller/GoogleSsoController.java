package com.example.devconsole.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@RestController
@RequestMapping("/api/setup")
@Slf4j
public class GoogleSsoController {

    @Value("${app.keycloak.host}")
    private String keycloakHost;

    @Value("${app.keycloak.port}")
    private int keycloakPort;

    @Value("${app.keycloak.admin-user}")
    private String adminUser;

    @Value("${app.keycloak.admin-password}")
    private String adminPassword;

    private final RestTemplate rest = new RestTemplate();

    @PostMapping("/google-sso")
    public Map<String, Object> configureGoogleSso(@RequestBody Map<String, String> body) {
        String clientId = body.get("clientId");
        String clientSecret = body.get("clientSecret");
        String realm = body.getOrDefault("realm", "template");

        String token = getAdminToken();
        String baseUrl = "http://" + keycloakHost + ":" + keycloakPort;

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> idpConfig = Map.of(
            "alias", "google",
            "providerId", "google",
            "enabled", true,
            "trustEmail", true,
            "firstBrokerLoginFlowAlias", "first broker login",
            "config", Map.of(
                "clientId", clientId,
                "clientSecret", clientSecret,
                "defaultScope", "openid email profile",
                "useJwksUrl", "true"
            )
        );

        try {
            // Try to update existing
            rest.exchange(
                baseUrl + "/auth/admin/realms/" + realm + "/identity-provider/instances/google",
                HttpMethod.PUT, new HttpEntity<>(idpConfig, headers), String.class);
            return Map.of("status", "updated", "message", "Google SSO updated for realm " + realm);
        } catch (HttpClientErrorException.NotFound e) {
            // Create new
            rest.postForEntity(
                baseUrl + "/auth/admin/realms/" + realm + "/identity-provider/instances",
                new HttpEntity<>(idpConfig, headers), String.class);
            return Map.of("status", "created", "message", "Google SSO configured for realm " + realm);
        }
    }

    @GetMapping("/google-sso")
    public Map<String, Object> getGoogleSsoStatus(@RequestParam(defaultValue = "template") String realm) {
        try {
            String token = getAdminToken();
            String baseUrl = "http://" + keycloakHost + ":" + keycloakPort;
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(token);

            rest.exchange(
                baseUrl + "/auth/admin/realms/" + realm + "/identity-provider/instances/google",
                HttpMethod.GET, new HttpEntity<>(headers), Map.class);
            return Map.of("configured", true);
        } catch (Exception e) {
            return Map.of("configured", false);
        }
    }

    private String getAdminToken() {
        var params = new org.springframework.util.LinkedMultiValueMap<String, String>();
        params.add("grant_type", "password");
        params.add("client_id", "admin-cli");
        params.add("username", adminUser);
        params.add("password", adminPassword);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        var resp = rest.postForEntity(
            "http://" + keycloakHost + ":" + keycloakPort + "/auth/realms/master/protocol/openid-connect/token",
            new HttpEntity<>(params, headers), Map.class);
        return (String) resp.getBody().get("access_token");
    }
}

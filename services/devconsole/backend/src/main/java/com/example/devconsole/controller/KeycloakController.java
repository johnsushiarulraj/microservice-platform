package com.example.devconsole.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/keycloak")
@RequiredArgsConstructor
public class KeycloakController {

    @Value("${app.keycloak.host}")
    private String keycloakHost;

    @Value("${app.keycloak.port}")
    private int keycloakPort;

    @Value("${app.keycloak.admin-user}")
    private String adminUser;

    @Value("${app.keycloak.admin-password}")
    private String adminPassword;

    @PostMapping("/token")
    public ResponseEntity<String> getToken(@RequestBody Map<String, String> body) {
        String realm = body.getOrDefault("realm", "template");
        String clientId = body.getOrDefault("clientId", "microservice-template");
        String clientSecret = body.getOrDefault("clientSecret", "template-secret");
        String username = body.get("username");
        String password = body.get("password");

        String tokenUrl = "http://" + keycloakHost + ":" + keycloakPort +
                "/auth/realms/" + realm + "/protocol/openid-connect/token";

        RestTemplate rest = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("grant_type", "password");
        params.add("client_id", clientId);
        params.add("client_secret", clientSecret);
        params.add("username", username);
        params.add("password", password);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);
        ResponseEntity<String> response = rest.postForEntity(tokenUrl, request, String.class);
        return response;
    }

    @PostMapping("/change-password")
    public ResponseEntity<Map<String, String>> changePassword(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String newPassword = body.get("newPassword");
        String realm = body.getOrDefault("realm", "template");

        RestTemplate rest = new RestTemplate();
        String baseUrl = "http://" + keycloakHost + ":" + keycloakPort;

        // Get admin token
        HttpHeaders tokenHeaders = new HttpHeaders();
        tokenHeaders.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        MultiValueMap<String, String> tokenParams = new LinkedMultiValueMap<>();
        tokenParams.add("grant_type", "password");
        tokenParams.add("client_id", "admin-cli");
        tokenParams.add("username", adminUser);
        tokenParams.add("password", adminPassword);
        ResponseEntity<Map> tokenResp = rest.postForEntity(
            baseUrl + "/auth/realms/master/protocol/openid-connect/token",
            new HttpEntity<>(tokenParams, tokenHeaders), Map.class);
        String adminToken = (String) tokenResp.getBody().get("access_token");

        // Find user ID
        HttpHeaders authHeaders = new HttpHeaders();
        authHeaders.setBearerAuth(adminToken);
        authHeaders.setContentType(MediaType.APPLICATION_JSON);
        ResponseEntity<List> usersResp = rest.exchange(
            baseUrl + "/auth/admin/realms/" + realm + "/users?username=" + username + "&exact=true",
            HttpMethod.GET, new HttpEntity<>(authHeaders), List.class);
        List<Map> users = usersResp.getBody();
        if (users == null || users.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "User not found"));
        }
        String userId = (String) users.get(0).get("id");

        // Reset password
        rest.exchange(
            baseUrl + "/auth/admin/realms/" + realm + "/users/" + userId + "/reset-password",
            HttpMethod.PUT,
            new HttpEntity<>(Map.of("type", "password", "value", newPassword, "temporary", false), authHeaders),
            String.class);

        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }
}

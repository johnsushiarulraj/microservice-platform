package com.example.devconsole.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
@Slf4j
public class KeycloakSetupService {

    @Value("${app.keycloak.host}")
    private String keycloakHost;

    @Value("${app.keycloak.port}")
    private int keycloakPort;

    @Value("${app.keycloak.admin-user}")
    private String adminUser;

    @Value("${app.keycloak.admin-password}")
    private String adminPassword;

    private final RestTemplate rest = new RestTemplate();

    private String baseUrl() {
        return "http://" + keycloakHost + ":" + keycloakPort;
    }

    private String getAdminToken() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("grant_type", "password");
        params.add("client_id", "admin-cli");
        params.add("username", adminUser);
        params.add("password", adminPassword);

        HttpEntity<MultiValueMap<String, String>> req = new HttpEntity<>(params, headers);
        ResponseEntity<Map> response = rest.postForEntity(
                baseUrl() + "/realms/master/protocol/openid-connect/token", req, Map.class);
        return (String) response.getBody().get("access_token");
    }

    private HttpHeaders authHeaders(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }

    public Map<String, Object> setupRealm(String realm, String clientId, String clientSecret,
                                           List<String> roles, List<Map<String, String>> users) {
        String token = getAdminToken();
        List<String> results = new ArrayList<>();

        // 1. Create realm if not exists
        try {
            rest.exchange(baseUrl() + "/admin/realms/" + realm, HttpMethod.GET,
                    new HttpEntity<>(authHeaders(token)), String.class);
            results.add("Realm '" + realm + "' already exists");
        } catch (HttpClientErrorException.NotFound e) {
            Map<String, Object> realmBody = Map.of(
                    "realm", realm, "enabled", true, "registrationAllowed", false);
            rest.postForEntity(baseUrl() + "/admin/realms",
                    new HttpEntity<>(realmBody, authHeaders(token)), String.class);
            results.add("Realm '" + realm + "' created");
        }

        // 2. Create client if not exists
        String clientInternalId = findClient(token, realm, clientId);
        if (clientInternalId == null) {
            Map<String, Object> clientBody = Map.of(
                    "clientId", clientId,
                    "enabled", true,
                    "publicClient", false,
                    "directAccessGrantsEnabled", true,
                    "serviceAccountsEnabled", true,
                    "secret", clientSecret,
                    "redirectUris", List.of("*"));
            rest.postForEntity(baseUrl() + "/admin/realms/" + realm + "/clients",
                    new HttpEntity<>(clientBody, authHeaders(token)), String.class);
            results.add("Client '" + clientId + "' created");
        } else {
            results.add("Client '" + clientId + "' already exists");
        }

        // 3. Create roles
        for (String role : roles) {
            try {
                rest.postForEntity(baseUrl() + "/admin/realms/" + realm + "/roles",
                        new HttpEntity<>(Map.of("name", role), authHeaders(token)), String.class);
                results.add("Role '" + role + "' created");
            } catch (HttpClientErrorException.Conflict e) {
                results.add("Role '" + role + "' already exists");
            }
        }

        // 4. Create users with full profile (Keycloak 24 requires firstName/lastName/email)
        for (Map<String, String> user : users) {
            String username = user.get("username");
            String password = user.get("password");
            String role = user.get("role");

            String userId = findUser(token, realm, username);
            if (userId == null) {
                Map<String, Object> userBody = new HashMap<>();
                userBody.put("username", username);
                userBody.put("enabled", true);
                userBody.put("emailVerified", true);
                userBody.put("firstName", capitalize(username));
                userBody.put("lastName", "User");
                userBody.put("email", username + "@example.com");
                userBody.put("credentials", List.of(Map.of(
                        "type", "password", "value", password, "temporary", false)));

                rest.postForEntity(baseUrl() + "/admin/realms/" + realm + "/users",
                        new HttpEntity<>(userBody, authHeaders(token)), String.class);
                userId = findUser(token, realm, username);
                results.add("User '" + username + "' created");
            } else {
                // Update profile to ensure it's complete
                Map<String, Object> updateBody = new HashMap<>();
                updateBody.put("enabled", true);
                updateBody.put("emailVerified", true);
                updateBody.put("firstName", capitalize(username));
                updateBody.put("lastName", "User");
                updateBody.put("email", username + "@example.com");
                updateBody.put("requiredActions", List.of());
                rest.exchange(baseUrl() + "/admin/realms/" + realm + "/users/" + userId,
                        HttpMethod.PUT, new HttpEntity<>(updateBody, authHeaders(token)), String.class);

                // Reset password
                rest.exchange(baseUrl() + "/admin/realms/" + realm + "/users/" + userId + "/reset-password",
                        HttpMethod.PUT, new HttpEntity<>(Map.of("type", "password", "value", password, "temporary", false),
                                authHeaders(token)), String.class);
                results.add("User '" + username + "' already exists — updated");
            }

            // Assign role
            if (role != null && userId != null) {
                try {
                    ResponseEntity<Map> roleMap = rest.exchange(
                            baseUrl() + "/admin/realms/" + realm + "/roles/" + role,
                            HttpMethod.GET, new HttpEntity<>(authHeaders(token)), Map.class);
                    Map<String, Object> roleRep = new HashMap<>(roleMap.getBody());

                    rest.postForEntity(
                            baseUrl() + "/admin/realms/" + realm + "/users/" + userId + "/role-mappings/realm",
                            new HttpEntity<>(List.of(roleRep), authHeaders(token)), String.class);
                    results.add("Role '" + role + "' assigned to '" + username + "'");
                } catch (Exception e) {
                    results.add("Role assignment failed for '" + username + "': " + e.getMessage());
                }
            }
        }

        return Map.of("realm", realm, "results", results);
    }

    private String findClient(String token, String realm, String clientId) {
        try {
            ResponseEntity<List> resp = rest.exchange(
                    baseUrl() + "/admin/realms/" + realm + "/clients?clientId=" + clientId,
                    HttpMethod.GET, new HttpEntity<>(authHeaders(token)), List.class);
            List<Map> clients = resp.getBody();
            if (clients != null && !clients.isEmpty()) {
                return (String) clients.get(0).get("id");
            }
        } catch (Exception e) { }
        return null;
    }

    private String findUser(String token, String realm, String username) {
        try {
            ResponseEntity<List> resp = rest.exchange(
                    baseUrl() + "/admin/realms/" + realm + "/users?username=" + username + "&exact=true",
                    HttpMethod.GET, new HttpEntity<>(authHeaders(token)), List.class);
            List<Map> users = resp.getBody();
            if (users != null && !users.isEmpty()) {
                return (String) users.get(0).get("id");
            }
        } catch (Exception e) { }
        return null;
    }

    private String capitalize(String s) {
        return s.substring(0, 1).toUpperCase() + s.substring(1);
    }
}

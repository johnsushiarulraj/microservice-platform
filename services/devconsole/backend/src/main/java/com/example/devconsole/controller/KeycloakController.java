package com.example.devconsole.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@RestController
@RequestMapping("/api/keycloak")
@RequiredArgsConstructor
public class KeycloakController {

    @Value("${app.keycloak.host}")
    private String keycloakHost;

    @Value("${app.keycloak.port}")
    private int keycloakPort;

    @PostMapping("/token")
    public ResponseEntity<String> getToken(@RequestBody Map<String, String> body) {
        String realm = body.getOrDefault("realm", "template");
        String clientId = body.getOrDefault("clientId", "microservice-template");
        String clientSecret = body.getOrDefault("clientSecret", "template-secret");
        String username = body.get("username");
        String password = body.get("password");

        String tokenUrl = "http://" + keycloakHost + ":" + keycloakPort +
                "/realms/" + realm + "/protocol/openid-connect/token";

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
}

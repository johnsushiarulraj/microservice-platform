package com.example.devconsole.controller;

import com.example.devconsole.entity.DeployedService;
import com.example.devconsole.repository.DeployedServiceRepository;
import com.example.devconsole.service.ProvisionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/api/provision")
@RequiredArgsConstructor
@Slf4j
public class ProvisionController {

    private final ProvisionService provisionService;
    private final DeployedServiceRepository deployedServiceRepository;

    @PostMapping
    public Map<String, Object> provision(@RequestBody Map<String, String> body) {
        String yml = body.get("provisionYml");
        if (yml == null || yml.isBlank()) {
            return Map.of("error", "provisionYml is required");
        }
        return provisionService.provision(yml);
    }
}

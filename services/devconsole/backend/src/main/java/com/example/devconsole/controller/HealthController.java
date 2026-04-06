package com.example.devconsole.controller;

import com.example.devconsole.service.InfraHealthService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/health")
@RequiredArgsConstructor
public class HealthController {

    private final InfraHealthService healthService;

    @GetMapping
    public Map<String, Object> getHealth() {
        return healthService.checkAll();
    }
}

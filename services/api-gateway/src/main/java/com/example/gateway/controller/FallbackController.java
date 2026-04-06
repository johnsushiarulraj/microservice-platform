package com.example.gateway.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.Map;

@RestController
public class FallbackController {

    @RequestMapping("/fallback/template")
    public Mono<ResponseEntity<Map<String, String>>> templateFallback() {
        return Mono.just(ResponseEntity
            .status(HttpStatus.SERVICE_UNAVAILABLE)
            .body(Map.of(
                "status", "503",
                "error", "Service Unavailable",
                "message", "microservice-template is temporarily unavailable. Please try again later.",
                "service", "microservice-template"
            )));
    }
}

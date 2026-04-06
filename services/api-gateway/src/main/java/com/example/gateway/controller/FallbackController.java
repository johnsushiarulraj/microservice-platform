package com.example.gateway.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.net.URI;
import java.time.Instant;
import java.util.Map;

@RestController
public class FallbackController {

    /**
     * Root URL redirect → DevConsole
     */
    @GetMapping("/")
    public Mono<Void> rootRedirect(ServerHttpResponse response) {
        response.setStatusCode(HttpStatus.FOUND);
        response.getHeaders().setLocation(URI.create("/devconsole/"));
        return response.setComplete();
    }

    @RequestMapping("/fallback/{service}")
    public Mono<ResponseEntity<Map<String, String>>> serviceFallback(@PathVariable String service) {
        return Mono.just(ResponseEntity
            .status(HttpStatus.SERVICE_UNAVAILABLE)
            .body(Map.of(
                "status", "503",
                "error", "Service Unavailable",
                "message", service + " is temporarily unavailable. Please try again later.",
                "service", service,
                "timestamp", Instant.now().toString()
            )));
    }
}

package com.example.gateway.config;

import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

import java.net.URI;

/**
 * Redirects browser requests to the login page when they get a 401.
 * API calls (Accept: application/json) still get JSON 401 responses.
 */
@Component
@Order(-1)
public class AuthRedirectFilter implements WebFilter {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        return chain.filter(exchange).then(Mono.defer(() -> {
            ServerHttpResponse response = exchange.getResponse();
            if (response.getStatusCode() == HttpStatus.UNAUTHORIZED) {
                String accept = exchange.getRequest().getHeaders().getFirst("Accept");
                if (accept != null && accept.contains("text/html")) {
                    response.setStatusCode(HttpStatus.FOUND);
                    response.getHeaders().setLocation(URI.create("/devconsole/login"));
                }
            }
            return Mono.empty();
        }));
    }
}

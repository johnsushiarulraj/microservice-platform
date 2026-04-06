package com.example.gateway.config;

import org.springframework.core.annotation.Order;
import org.springframework.http.HttpCookie;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

/**
 * Reads JWT from access_token cookie and adds it as Authorization header.
 * This allows infrastructure UIs (Grafana, pgAdmin, etc.) to work when
 * opened in a new browser tab — the browser sends the cookie automatically.
 */
@Component
@Order(-2)
public class CookieToAuthFilter implements WebFilter {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();

        // Only add if Authorization header is missing
        if (request.getHeaders().containsKey("Authorization")) {
            return chain.filter(exchange);
        }

        // Look for access_token cookie
        HttpCookie cookie = request.getCookies().getFirst("access_token");
        if (cookie != null && !cookie.getValue().isEmpty()) {
            ServerHttpRequest mutated = request.mutate()
                    .header("Authorization", "Bearer " + cookie.getValue())
                    .build();
            return chain.filter(exchange.mutate().request(mutated).build());
        }

        return chain.filter(exchange);
    }
}

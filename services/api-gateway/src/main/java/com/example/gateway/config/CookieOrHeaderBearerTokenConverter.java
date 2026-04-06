package com.example.gateway.config;

import org.springframework.http.HttpCookie;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.server.resource.BearerTokenAuthenticationToken;
import org.springframework.security.web.server.authentication.ServerAuthenticationConverter;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

/**
 * Extracts Bearer token from Authorization header OR access_token cookie.
 * This allows infrastructure UIs (Grafana, pgAdmin, etc.) to work when
 * opened in a new browser tab — the browser sends the cookie automatically.
 */
public class CookieOrHeaderBearerTokenConverter implements ServerAuthenticationConverter {

    @Override
    public Mono<Authentication> convert(ServerWebExchange exchange) {
        // 1. Try Authorization header first
        String authHeader = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (authHeader != null && authHeader.toLowerCase().startsWith("bearer ")) {
            String token = authHeader.substring(7);
            return Mono.just(new BearerTokenAuthenticationToken(token));
        }

        // 2. Fall back to cookie
        HttpCookie cookie = exchange.getRequest().getCookies().getFirst("access_token");
        if (cookie != null && !cookie.getValue().isEmpty()) {
            return Mono.just(new BearerTokenAuthenticationToken(cookie.getValue()));
        }

        return Mono.empty();
    }
}

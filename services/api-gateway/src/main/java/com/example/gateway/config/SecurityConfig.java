package com.example.gateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;

@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    /**
     * User-deployed services: no gateway JWT validation.
     * Services handle their own JWT validation — the gateway just passes traffic through.
     */
    @Bean
    @Order(1)
    public SecurityWebFilterChain userServiceSecurityChain(ServerHttpSecurity http) {
        http
            .csrf(ServerHttpSecurity.CsrfSpec::disable)
            .securityMatcher(exchange -> {
                String path = exchange.getRequest().getURI().getPath();
                // Match paths for user-deployed services (single segment prefix + any path)
                // Exclude known gateway paths: /devconsole, /auth, /grafana, /prometheus, /pgadmin, etc.
                if (path.startsWith("/devconsole") || path.startsWith("/auth") ||
                    path.startsWith("/grafana") || path.startsWith("/prometheus") ||
                    path.startsWith("/pgadmin") || path.startsWith("/kafka-ui") ||
                    path.startsWith("/opensearch") || path.startsWith("/dynamodb") ||
                    path.startsWith("/keycloak-admin") || path.startsWith("/template") ||
                    path.startsWith("/actuator") || path.startsWith("/fallback") ||
                    path.equals("/")) {
                    return org.springframework.security.web.server.util.matcher.ServerWebExchangeMatcher.MatchResult.notMatch();
                }
                return org.springframework.security.web.server.util.matcher.ServerWebExchangeMatcher.MatchResult.match();
            })
            .authorizeExchange(exchanges -> exchanges.anyExchange().permitAll());
        return http.build();
    }

    /**
     * Main security chain: JWT validation for platform routes.
     */
    @Bean
    @Order(2)
    public SecurityWebFilterChain platformSecurityChain(ServerHttpSecurity http) {
        http
            .csrf(ServerHttpSecurity.CsrfSpec::disable)
            .authorizeExchange(exchanges -> exchanges
                // ── PUBLIC: No JWT needed ────────────────────────────────
                .pathMatchers("/").permitAll()
                .pathMatchers("/actuator/**").permitAll()
                .pathMatchers("/fallback/**").permitAll()

                // Keycloak auth endpoints
                .pathMatchers("/auth/**").permitAll()

                // DevConsole: SPA shell + static assets + public pages
                .pathMatchers("/devconsole/").permitAll()
                .pathMatchers("/devconsole/index.html").permitAll()
                .pathMatchers("/devconsole/static/**").permitAll()
                .pathMatchers("/devconsole/favicon.ico").permitAll()
                .pathMatchers("/devconsole/manifest.json").permitAll()
                .pathMatchers("/devconsole/login").permitAll()
                .pathMatchers("/devconsole/learn/**").permitAll()
                .pathMatchers("/devconsole/create").permitAll()
                .pathMatchers("/devconsole/tutorial").permitAll()
                .pathMatchers("/devconsole/dashboard").permitAll()
                .pathMatchers("/devconsole/services").permitAll()
                .pathMatchers("/devconsole/data/**").permitAll()
                .pathMatchers("/devconsole/change-password").permitAll()
                .pathMatchers("/devconsole/actuator/**").permitAll()

                // DevConsole API: public endpoints
                .pathMatchers("/devconsole/api/health").permitAll()
                .pathMatchers("/devconsole/api/scaffold").permitAll()
                .pathMatchers("/devconsole/api/setup/google-sso").permitAll()
                .pathMatchers("/devconsole/api/provision").permitAll()
                .pathMatchers("/devconsole/api/services/deploy").permitAll()
                .pathMatchers("/devconsole/api/services/redeploy-all").permitAll()
                .pathMatchers("/devconsole/api/services/*/infrastructure").permitAll()
                .pathMatchers("/devconsole/api/services/*/pods").permitAll()
                .pathMatchers("/devconsole/api/services/*/logs").permitAll()
                .pathMatchers("/devconsole/api/services/**").permitAll()
                .pathMatchers("/devconsole/logs").permitAll()

                // Prometheus/pgAdmin redirect paths (JWT cookie carries over)
                .pathMatchers("/query/**", "/graph/**", "/targets/**", "/api/v1/**").authenticated()
                .pathMatchers("/browser/**", "/misc/**", "/login/**").authenticated()

                // ── PROTECTED: JWT required (from header OR cookie) ──────
                .anyExchange().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt()
                .and()
                .bearerTokenConverter(new CookieOrHeaderBearerTokenConverter())
            );
        return http.build();
    }
}

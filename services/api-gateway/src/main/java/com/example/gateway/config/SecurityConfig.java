package com.example.gateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;

@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    @Bean
    public SecurityWebFilterChain springSecurityFilterChain(ServerHttpSecurity http) {
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
                .pathMatchers("/devconsole/actuator/**").permitAll()

                // DevConsole API: public endpoints
                .pathMatchers("/devconsole/api/health").permitAll()
                .pathMatchers("/devconsole/api/scaffold").permitAll()
                .pathMatchers("/devconsole/api/setup/google-sso").permitAll()

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

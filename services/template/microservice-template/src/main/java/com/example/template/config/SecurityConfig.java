package com.example.template.config;

import com.example.template.security.KeycloakRoleConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableGlobalMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
@EnableGlobalMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf().disable()
            .authorizeRequests()
                .antMatchers("/actuator/**", "/swagger-ui/**", "/swagger-ui.html",
                             "/v3/api-docs/**", "/v3/api-docs").permitAll()
                .antMatchers(HttpMethod.GET, "/api/v1/templates/**").hasAnyRole("TEMPLATE_USER", "TEMPLATE_ADMIN")
                .antMatchers(HttpMethod.POST, "/api/v1/templates/**").hasAnyRole("TEMPLATE_USER", "TEMPLATE_ADMIN")
                .antMatchers(HttpMethod.DELETE, "/api/v1/templates/**").hasRole("TEMPLATE_ADMIN")
                .antMatchers("/api/v1/saga/**").hasAnyRole("TEMPLATE_USER", "TEMPLATE_ADMIN")
                .antMatchers("/internal/**").hasRole("TEMPLATE_ADMIN")
                .anyRequest().authenticated()
            .and()
            .oauth2ResourceServer()
                .jwt()
                .jwtAuthenticationConverter(jwtAuthenticationConverter());
        return http.build();
    }

    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(new KeycloakRoleConverter());
        return converter;
    }
}

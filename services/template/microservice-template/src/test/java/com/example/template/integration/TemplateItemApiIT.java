package com.example.template.integration;

import com.example.template.controller.dto.CreateTemplateItemRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.http.MediaType;

import java.math.BigDecimal;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@AutoConfigureMockMvc
class TemplateItemApiIT extends BaseIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @WithMockUser(roles = {"TEMPLATE_USER", "TEMPLATE_ADMIN"})
    void happyPath_createAndGetTemplateItem() throws Exception {
        CreateTemplateItemRequest req = new CreateTemplateItemRequest();
        req.setName("Integration Test Item");
        req.setAmount(new BigDecimal("49.99"));
        req.setCurrency("USD");
        req.setDescription("Integration test");

        String responseBody = mockMvc.perform(post("/api/v1/templates")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Integration Test Item"))
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andReturn().getResponse().getContentAsString();

        String id = objectMapper.readTree(responseBody).get("id").asText();

        mockMvc.perform(get("/api/v1/templates/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id));
    }

    @Test
    void unauthenticatedReturns401() throws Exception {
        mockMvc.perform(get("/api/v1/templates"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "TEMPLATE_USER")
    void deleteWithWrongRoleReturns403() throws Exception {
        mockMvc.perform(delete("/api/v1/templates/00000000-0000-0000-0000-000000000001").with(csrf()))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "TEMPLATE_USER")
    void swaggerEndpointAvailable() throws Exception {
        mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "TEMPLATE_USER")
    void listReturnsPaginatedResults() throws Exception {
        mockMvc.perform(get("/api/v1/templates?page=0&size=10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pageable").exists());
    }

    @Test
    @WithMockUser(roles = {"TEMPLATE_USER", "TEMPLATE_ADMIN"})
    void sagaStartAndGet() throws Exception {
        String body = "{\"correlationId\":\"test-corr-1\",\"payload\":\"{}\"}";
        String response = mockMvc.perform(post("/api/v1/saga")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.state").value("INITIATED"))
                .andReturn().getResponse().getContentAsString();

        String sagaId = objectMapper.readTree(response).get("id").asText();

        mockMvc.perform(get("/api/v1/saga/" + sagaId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(sagaId));
    }
}

package com.example.template.controller;

import com.example.template.controller.dto.CreateTemplateItemRequest;
import com.example.template.entity.TemplateItem;
import com.example.template.service.TemplateItemService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(TemplateItemController.class)
class TemplateItemControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private TemplateItemService service;

    @Test
    @WithMockUser(roles = "TEMPLATE_USER")
    void listReturns200() throws Exception {
        TemplateItem item = TemplateItem.builder().id(UUID.randomUUID()).name("Test").status("ACTIVE")
                .amount(BigDecimal.TEN).currency("EUR").build();
        when(service.findAll(any(Pageable.class))).thenReturn(new PageImpl<>(List.of(item)));

        mockMvc.perform(get("/api/v1/templates"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].name").value("Test"));
    }

    @Test
    @WithMockUser(roles = "TEMPLATE_USER")
    void createReturns201() throws Exception {
        TemplateItem item = TemplateItem.builder().id(UUID.randomUUID()).name("New Item").status("ACTIVE")
                .amount(new BigDecimal("9.99")).currency("GBP").build();
        when(service.create(any())).thenReturn(item);

        CreateTemplateItemRequest req = new CreateTemplateItemRequest();
        req.setName("New Item");
        req.setAmount(new BigDecimal("9.99"));
        req.setCurrency("GBP");

        mockMvc.perform(post("/api/v1/templates")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("New Item"));
    }

    @Test
    @WithMockUser(roles = "TEMPLATE_ADMIN")
    void deleteReturns204() throws Exception {
        UUID id = UUID.randomUUID();
        mockMvc.perform(delete("/api/v1/templates/" + id).with(csrf()))
                .andExpect(status().isNoContent());
    }
}

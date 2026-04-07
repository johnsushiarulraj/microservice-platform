package com.example.template.search;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TemplateDocument {
    private String id;
    private String name;
    private String description;
    private BigDecimal amount;
    private String currency;
    private String status;
    private Instant createdAt;
    private Instant updatedAt;
}

package com.example.template.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TemplateItemCreatedEvent {

    private UUID eventId;
    private UUID itemId;
    private String correlationId;
    private String causationId;
    private String eventType;
    private int version;
    private Instant occurredAt;
    private String source;
    private String name;
    private BigDecimal amount;
    private String currency;
    private String status;
}

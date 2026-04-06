package com.example.template.controller.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;

@Data
public class StartSagaRequest {

    @NotBlank(message = "Correlation ID is required")
    private String correlationId;

    @NotBlank(message = "Payload is required")
    private String payload;
}

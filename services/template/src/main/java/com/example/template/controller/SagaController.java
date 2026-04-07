package com.example.template.controller;

import com.example.template.controller.dto.StartSagaRequest;
import com.example.template.entity.TemplateSaga;
import com.example.template.service.SagaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/saga")
@RequiredArgsConstructor
@Tag(name = "Saga", description = "Saga orchestration endpoints")
@SecurityRequirement(name = "bearerAuth")
public class SagaController {

    private final SagaService sagaService;

    @PostMapping
    @Operation(summary = "Start a new saga")
    public ResponseEntity<TemplateSaga> start(@RequestBody @Valid StartSagaRequest request) {
        TemplateSaga saga = sagaService.startSaga(request.getCorrelationId(), request.getPayload());
        return ResponseEntity.status(HttpStatus.CREATED).body(saga);
    }

    @GetMapping("/{sagaId}")
    @Operation(summary = "Get saga status")
    public ResponseEntity<TemplateSaga> getStatus(@PathVariable UUID sagaId) {
        return ResponseEntity.ok(sagaService.findById(sagaId));
    }
}

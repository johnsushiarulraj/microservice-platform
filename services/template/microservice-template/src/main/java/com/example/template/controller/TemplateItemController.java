package com.example.template.controller;

import com.example.template.controller.dto.CreateTemplateItemRequest;
import com.example.template.entity.TemplateItem;
import com.example.template.service.TemplateItemService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/templates")
@RequiredArgsConstructor
@Tag(name = "Template Items", description = "CRUD operations for template items")
@SecurityRequirement(name = "bearerAuth")
public class TemplateItemController {

    private final TemplateItemService service;

    @GetMapping
    @Operation(summary = "List all template items (paginated)")
    public ResponseEntity<Page<TemplateItem>> list(Pageable pageable) {
        return ResponseEntity.ok(service.findAll(pageable));
    }

    @PostMapping
    @Operation(summary = "Create a new template item")
    public ResponseEntity<TemplateItem> create(@RequestBody @Valid CreateTemplateItemRequest request) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a template item by ID")
    public ResponseEntity<TemplateItem> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a template item (TEMPLATE_ADMIN only)")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}

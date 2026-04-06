package com.example.template.exception;

import java.util.UUID;

public class TemplateItemNotFoundException extends RuntimeException {
    public TemplateItemNotFoundException(UUID id) {
        super("Template item not found: " + id);
    }
}

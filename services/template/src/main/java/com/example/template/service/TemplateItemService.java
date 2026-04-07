package com.example.template.service;

import com.example.template.controller.dto.CreateTemplateItemRequest;
import com.example.template.entity.TemplateItem;
import com.example.template.exception.TemplateItemNotFoundException;
import com.example.template.repository.TemplateItemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class TemplateItemService {

    private final TemplateItemRepository repository;

    @Transactional
    public TemplateItem create(CreateTemplateItemRequest request) {
        TemplateItem item = TemplateItem.builder()
                .name(request.getName())
                .description(request.getDescription())
                .amount(request.getAmount())
                .currency(request.getCurrency())
                .status("ACTIVE")
                .build();
        item = repository.save(item);
        log.info("Created item: {}", item.getId());
        return item;
    }

    @Transactional(readOnly = true)
    public TemplateItem findById(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new TemplateItemNotFoundException(id));
    }

    @Transactional(readOnly = true)
    public Page<TemplateItem> findAll(Pageable pageable) {
        return repository.findAll(pageable);
    }

    @Transactional
    public void delete(UUID id) {
        TemplateItem item = repository.findById(id)
                .orElseThrow(() -> new TemplateItemNotFoundException(id));
        repository.delete(item);
        log.info("Deleted item: {}", id);
    }
}

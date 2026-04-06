package com.example.template.service;

import com.example.template.cache.TemplateCacheService;
import com.example.template.controller.dto.CreateTemplateItemRequest;
import com.example.template.entity.OutboxEvent;
import com.example.template.entity.TemplateItem;
import com.example.template.event.TemplateItemCreatedEvent;
import com.example.template.exception.TemplateItemNotFoundException;
import com.example.template.metrics.TemplateMetrics;
import com.example.template.repository.OutboxEventRepository;
import com.example.template.repository.TemplateItemRepository;
import com.example.template.search.TemplateDocument;
import com.example.template.search.TemplateSearchService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class TemplateItemService {

    private final TemplateItemRepository repository;
    private final OutboxEventRepository outboxEventRepository;
    private final TemplateCacheService cacheService;
    private final TemplateSearchService searchService;
    private final TemplateMetrics metrics;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    @Transactional
    public TemplateItem create(CreateTemplateItemRequest request) throws JsonProcessingException {
        return metrics.getItemCreationTimer().record(() -> {
            try {
                TemplateItem item = TemplateItem.builder()
                        .name(request.getName())
                        .description(request.getDescription())
                        .amount(request.getAmount())
                        .currency(request.getCurrency())
                        .status("ACTIVE")
                        .build();
                item = repository.save(item);

                TemplateItemCreatedEvent event = TemplateItemCreatedEvent.builder()
                        .eventId(UUID.randomUUID())
                        .itemId(item.getId())
                        .correlationId(UUID.randomUUID().toString())
                        .causationId(UUID.randomUUID().toString())
                        .eventType("TEMPLATE_ITEM_CREATED")
                        .version(1)
                        .occurredAt(Instant.now())
                        .source("microservice-template")
                        .name(item.getName())
                        .amount(item.getAmount())
                        .currency(item.getCurrency())
                        .status(item.getStatus())
                        .build();

                OutboxEvent outbox = OutboxEvent.builder()
                        .aggregateId(item.getId().toString())
                        .aggregateType("TemplateItem")
                        .eventType("TEMPLATE_ITEM_CREATED")
                        .payload(objectMapper.writeValueAsString(event))
                        .topic("template-events")
                        .published(false)
                        .retryCount(0)
                        .createdAt(Instant.now())
                        .build();
                outboxEventRepository.save(outbox);

                cacheService.put(item);
                searchService.index(TemplateDocument.builder()
                        .id(item.getId().toString())
                        .name(item.getName())
                        .description(item.getDescription())
                        .amount(item.getAmount())
                        .currency(item.getCurrency())
                        .status(item.getStatus())
                        .createdAt(item.getCreatedAt())
                        .build());

                metrics.incrementItemCreated();
                return item;
            } catch (JsonProcessingException e) {
                throw new RuntimeException(e);
            }
        });
    }

    @Transactional(readOnly = true)
    public TemplateItem findById(UUID id) {
        return cacheService.get(id).orElseGet(() ->
                repository.findById(id).orElseThrow(() -> new TemplateItemNotFoundException(id))
        );
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
        cacheService.evict(id);
        metrics.incrementItemDeleted();
    }

    @CircuitBreaker(name = "externalService", fallbackMethod = "externalCallFallback")
    @Retry(name = "externalService")
    public String callExternalService(String url) {
        return restTemplate.getForObject(url, String.class);
    }

    public String externalCallFallback(String url, Exception ex) {
        log.warn("External call failed for url={}, using fallback", url, ex);
        return "fallback-response";
    }
}

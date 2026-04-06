package com.example.template.service;

import com.example.template.cache.TemplateCacheService;
import com.example.template.controller.dto.CreateTemplateItemRequest;
import com.example.template.entity.TemplateItem;
import com.example.template.exception.TemplateItemNotFoundException;
import com.example.template.metrics.TemplateMetrics;
import com.example.template.repository.OutboxEventRepository;
import com.example.template.repository.TemplateItemRepository;
import com.example.template.search.TemplateSearchService;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.micrometer.core.instrument.Timer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class TemplateItemServiceTest {

    @Mock private TemplateItemRepository repository;
    @Mock private OutboxEventRepository outboxEventRepository;
    @Mock private TemplateCacheService cacheService;
    @Mock private TemplateSearchService searchService;
    @Mock private TemplateMetrics metrics;
    @Mock private ObjectMapper objectMapper;
    @Mock private RestTemplate restTemplate;
    @Mock private Timer timer;

    @InjectMocks
    private TemplateItemService service;

    @BeforeEach
    void setUp() {
        when(metrics.getItemCreationTimer()).thenReturn(timer);
        doAnswer(inv -> {
            java.util.function.Supplier<?> supplier = inv.getArgument(0);
            try { return supplier.get(); } catch (Exception e) { throw new RuntimeException(e); }
        }).when(timer).record(any(java.util.function.Supplier.class));
        try { when(objectMapper.writeValueAsString(any())).thenReturn("{}"); }
        catch (com.fasterxml.jackson.core.JsonProcessingException e) { throw new RuntimeException(e); }
    }

    @Test
    void findByIdReturnsCachedValue() {
        UUID id = UUID.randomUUID();
        TemplateItem cached = TemplateItem.builder().id(id).name("Cached").build();
        when(cacheService.get(id)).thenReturn(Optional.of(cached));

        TemplateItem result = service.findById(id);

        assertThat(result.getName()).isEqualTo("Cached");
        verify(repository, never()).findById(any());
    }

    @Test
    void findByIdFallsBackToDatabase() {
        UUID id = UUID.randomUUID();
        TemplateItem dbItem = TemplateItem.builder().id(id).name("DB").build();
        when(cacheService.get(id)).thenReturn(Optional.empty());
        when(repository.findById(id)).thenReturn(Optional.of(dbItem));

        TemplateItem result = service.findById(id);

        assertThat(result.getName()).isEqualTo("DB");
    }

    @Test
    void findByIdThrowsWhenNotFound() {
        UUID id = UUID.randomUUID();
        when(cacheService.get(id)).thenReturn(Optional.empty());
        when(repository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.findById(id))
                .isInstanceOf(TemplateItemNotFoundException.class);
    }

    @Test
    void deleteEvictsFromCache() {
        UUID id = UUID.randomUUID();
        TemplateItem item = TemplateItem.builder().id(id).name("To Delete").build();
        when(repository.findById(id)).thenReturn(Optional.of(item));

        service.delete(id);

        verify(repository).delete(item);
        verify(cacheService).evict(id);
        verify(metrics).incrementItemDeleted();
    }
}

package com.example.template.service;

import com.example.template.controller.dto.CreateTemplateItemRequest;
import com.example.template.entity.TemplateItem;
import com.example.template.exception.TemplateItemNotFoundException;
import com.example.template.repository.TemplateItemRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TemplateItemServiceTest {

    @Mock private TemplateItemRepository repository;
    @InjectMocks private TemplateItemService service;

    @Test
    void createSavesItem() {
        CreateTemplateItemRequest request = new CreateTemplateItemRequest();
        request.setName("Test Item");
        request.setDescription("A test");
        request.setAmount(new BigDecimal("9.99"));
        request.setCurrency("USD");

        TemplateItem saved = TemplateItem.builder()
                .id(UUID.randomUUID()).name("Test Item").status("ACTIVE").build();
        when(repository.save(any())).thenReturn(saved);

        TemplateItem result = service.create(request);

        assertThat(result.getName()).isEqualTo("Test Item");
        assertThat(result.getStatus()).isEqualTo("ACTIVE");
        verify(repository).save(any());
    }

    @Test
    void findByIdReturnsItem() {
        UUID id = UUID.randomUUID();
        TemplateItem item = TemplateItem.builder().id(id).name("Found").build();
        when(repository.findById(id)).thenReturn(Optional.of(item));

        TemplateItem result = service.findById(id);

        assertThat(result.getName()).isEqualTo("Found");
    }

    @Test
    void findByIdThrowsWhenNotFound() {
        UUID id = UUID.randomUUID();
        when(repository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.findById(id))
                .isInstanceOf(TemplateItemNotFoundException.class);
    }

    @Test
    void deleteRemovesItem() {
        UUID id = UUID.randomUUID();
        TemplateItem item = TemplateItem.builder().id(id).name("To Delete").build();
        when(repository.findById(id)).thenReturn(Optional.of(item));

        service.delete(id);

        verify(repository).delete(item);
    }
}

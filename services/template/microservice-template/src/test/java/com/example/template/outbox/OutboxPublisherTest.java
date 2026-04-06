package com.example.template.outbox;

import com.example.template.entity.OutboxEvent;
import com.example.template.metrics.TemplateMetrics;
import com.example.template.repository.OutboxEventRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.clients.producer.RecordMetadata;
import org.apache.kafka.common.TopicPartition;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.util.concurrent.ListenableFuture;
import org.springframework.util.concurrent.SettableListenableFuture;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OutboxPublisherTest {

    @Mock private OutboxEventRepository outboxEventRepository;
    @Mock private KafkaTemplate<String, String> kafkaTemplate;
    @Mock private TemplateMetrics metrics;
    @Mock private ObjectMapper objectMapper;

    @InjectMocks
    private OutboxPublisher publisher;

    @Test
    void publishesUnpublishedEventsAndMarksPublished() {
        OutboxEvent event = OutboxEvent.builder()
                .id(UUID.randomUUID())
                .aggregateId("agg-1")
                .topic("template-events")
                .payload("{}")
                .published(false)
                .retryCount(0)
                .createdAt(Instant.now())
                .build();

        when(outboxEventRepository.findByPublishedFalseAndRetryCountLessThan(anyInt(), any(Pageable.class)))
                .thenReturn(List.of(event));

        SettableListenableFuture<SendResult<String, String>> future = new SettableListenableFuture<>();
        ProducerRecord<String, String> pr = new ProducerRecord<>("template-events", "{}");
        RecordMetadata rm = new RecordMetadata(new TopicPartition("template-events", 0), 0, 0, 0, 0L, 0, 0);
        future.set(new SendResult<>(pr, rm));
        when(kafkaTemplate.send(any(), any(), any())).thenReturn((ListenableFuture) future);

        publisher.publishPendingEvents();

        assertThat(event.isPublished()).isTrue();
        verify(metrics).incrementOutboxPublished();
        verify(outboxEventRepository).save(event);
    }

    @Test
    void incrementsRetryOnKafkaFailure() {
        OutboxEvent event = OutboxEvent.builder()
                .id(UUID.randomUUID())
                .aggregateId("agg-2")
                .topic("template-events")
                .payload("{}")
                .published(false)
                .retryCount(0)
                .createdAt(Instant.now())
                .build();

        when(outboxEventRepository.findByPublishedFalseAndRetryCountLessThan(anyInt(), any(Pageable.class)))
                .thenReturn(List.of(event));
        when(kafkaTemplate.send(any(), any(), any())).thenThrow(new RuntimeException("Kafka down"));

        publisher.publishPendingEvents();

        assertThat(event.getRetryCount()).isEqualTo(1);
        assertThat(event.isPublished()).isFalse();
        verify(metrics).incrementOutboxFailed();
    }
}

package com.example.template.outbox;

import com.example.template.entity.OutboxEvent;
import com.example.template.metrics.TemplateMetrics;
import com.example.template.repository.OutboxEventRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class OutboxPublisher {

    private static final int BATCH_SIZE = 100;
    private static final int MAX_RETRIES = 5;

    private final OutboxEventRepository outboxEventRepository;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final TemplateMetrics metrics;
    private final ObjectMapper objectMapper;

    @Scheduled(fixedDelay = 500)
    @Transactional
    public void publishPendingEvents() {
        List<OutboxEvent> pending = outboxEventRepository
                .findByPublishedFalseAndRetryCountLessThan(MAX_RETRIES, PageRequest.of(0, BATCH_SIZE));

        for (OutboxEvent event : pending) {
            try {
                kafkaTemplate.send(event.getTopic(), event.getAggregateId(), event.getPayload()).get();
                event.setPublished(true);
                event.setPublishedAt(Instant.now());
                metrics.incrementOutboxPublished();
                log.debug("Published outbox event id={} topic={}", event.getId(), event.getTopic());
            } catch (Exception e) {
                event.setRetryCount(event.getRetryCount() + 1);
                metrics.incrementOutboxFailed();
                log.error("Failed to publish outbox event id={} retry={}", event.getId(), event.getRetryCount(), e);
            }
            outboxEventRepository.save(event);
        }
    }
}

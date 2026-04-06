package com.example.template.metrics;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.stereotype.Component;

@Component
public class TemplateMetrics {

    private final Counter itemCreatedCounter;
    private final Counter itemDeletedCounter;
    private final Counter outboxPublishedCounter;
    private final Counter outboxFailedCounter;
    private final Timer itemCreationTimer;

    public TemplateMetrics(MeterRegistry registry) {
        this.itemCreatedCounter = Counter.builder("template.items.created")
                .description("Number of template items created")
                .register(registry);
        this.itemDeletedCounter = Counter.builder("template.items.deleted")
                .description("Number of template items deleted")
                .register(registry);
        this.outboxPublishedCounter = Counter.builder("template.outbox.published")
                .description("Number of outbox events successfully published")
                .register(registry);
        this.outboxFailedCounter = Counter.builder("template.outbox.failed")
                .description("Number of outbox events that failed to publish")
                .register(registry);
        this.itemCreationTimer = Timer.builder("template.item.creation.duration")
                .description("Time to create a template item")
                .register(registry);
    }

    public void incrementItemCreated() { itemCreatedCounter.increment(); }
    public void incrementItemDeleted() { itemDeletedCounter.increment(); }
    public void incrementOutboxPublished() { outboxPublishedCounter.increment(); }
    public void incrementOutboxFailed() { outboxFailedCounter.increment(); }
    public Timer getItemCreationTimer() { return itemCreationTimer; }
}

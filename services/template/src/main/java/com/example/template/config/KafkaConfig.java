package com.example.template.config;

import com.example.template.event.TemplateItemCreatedEvent;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.function.Consumer;
import java.util.function.Supplier;

@Configuration
public class KafkaConfig {

    @Bean
    public Supplier<TemplateItemCreatedEvent> templateEventSupplier() {
        return () -> null;
    }

    @Bean
    public Consumer<TemplateItemCreatedEvent> templateEventConsumer() {
        return event -> {
            if (event != null) {
                org.slf4j.LoggerFactory.getLogger(KafkaConfig.class)
                    .info("Received template event: eventId={} itemId={}", event.getEventId(), event.getItemId());
            }
        };
    }
}

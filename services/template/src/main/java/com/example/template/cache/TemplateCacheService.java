package com.example.template.cache;

import com.example.template.entity.TemplateItem;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class TemplateCacheService {

    private static final String KEY_PREFIX = "template:item:";
    private static final Duration TTL = Duration.ofHours(1);

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    public void put(TemplateItem item) {
        try {
            String json = objectMapper.writeValueAsString(item);
            redisTemplate.opsForValue().set(KEY_PREFIX + item.getId(), json, TTL);
        } catch (Exception e) {
            log.warn("Failed to cache template item id={}", item.getId(), e);
        }
    }

    public Optional<TemplateItem> get(UUID id) {
        try {
            String json = redisTemplate.opsForValue().get(KEY_PREFIX + id);
            if (json != null) {
                return Optional.of(objectMapper.readValue(json, TemplateItem.class));
            }
        } catch (Exception e) {
            log.warn("Failed to read template item from cache id={}", id, e);
        }
        return Optional.empty();
    }

    public void evict(UUID id) {
        redisTemplate.delete(KEY_PREFIX + id);
    }
}

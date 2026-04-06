package com.example.template.service;

import com.example.template.entity.SagaState;
import com.example.template.entity.SagaStateTransition;
import com.example.template.entity.TemplateSaga;
import com.example.template.repository.SagaStateTransitionRepository;
import com.example.template.repository.TemplateSagaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class SagaService {

    private final TemplateSagaRepository sagaRepository;
    private final SagaStateTransitionRepository transitionRepository;

    @Transactional
    public TemplateSaga startSaga(String correlationId, String payload) {
        TemplateSaga saga = TemplateSaga.builder()
                .correlationId(correlationId)
                .state(SagaState.INITIATED)
                .payload(payload)
                .build();
        saga = sagaRepository.save(saga);
        log.info("Saga started id={} correlationId={}", saga.getId(), correlationId);
        return saga;
    }

    @Transactional
    public TemplateSaga transition(UUID sagaId, SagaState newState, String reason) {
        TemplateSaga saga = sagaRepository.findById(sagaId)
                .orElseThrow(() -> new RuntimeException("Saga not found: " + sagaId));
        SagaStateTransition transition = saga.transitionTo(newState, reason);
        transition.setSagaId(sagaId.toString());
        transitionRepository.save(transition);
        saga = sagaRepository.save(saga);
        log.info("Saga transitioned id={} -> {}", sagaId, newState);
        return saga;
    }

    @Transactional(readOnly = true)
    public TemplateSaga findById(UUID sagaId) {
        return sagaRepository.findById(sagaId)
                .orElseThrow(() -> new RuntimeException("Saga not found: " + sagaId));
    }
}

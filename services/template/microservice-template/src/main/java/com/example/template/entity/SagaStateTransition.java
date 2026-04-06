package com.example.template.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "saga_state_transitions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SagaStateTransition {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false)
    private String sagaId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SagaState fromState;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SagaState toState;

    @Column(nullable = false)
    private String reason;

    @Column(nullable = false)
    private Instant occurredAt;
}

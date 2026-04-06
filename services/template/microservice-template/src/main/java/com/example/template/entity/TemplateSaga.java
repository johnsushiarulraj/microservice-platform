package com.example.template.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "saga_state")
@EntityListeners(AuditingEntityListener.class)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TemplateSaga {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false)
    private String correlationId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SagaState state;

    @Column(nullable = false)
    private String payload;

    private String failureReason;

    @Version
    private Long version;

    @CreatedDate
    @Column(updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    @Transient
    @lombok.Builder.Default
    private List<SagaStateTransition> transitions = new ArrayList<>();

    public SagaStateTransition transitionTo(SagaState newState, String reason) {
        SagaStateTransition transition = SagaStateTransition.builder()
                .sagaId(this.id != null ? this.id.toString() : "pending")
                .fromState(this.state)
                .toState(newState)
                .reason(reason)
                .occurredAt(Instant.now())
                .build();
        this.state = newState;
        this.transitions.add(transition);
        return transition;
    }
}

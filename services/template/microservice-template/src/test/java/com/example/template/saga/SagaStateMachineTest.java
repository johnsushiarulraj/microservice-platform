package com.example.template.saga;

import com.example.template.entity.SagaState;
import com.example.template.entity.SagaStateTransition;
import com.example.template.entity.TemplateSaga;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class SagaStateMachineTest {

    @Test
    void transitionToChangesStateAndRecordsTransition() {
        TemplateSaga saga = TemplateSaga.builder()
                .correlationId("corr-1")
                .state(SagaState.INITIATED)
                .payload("{}")
                .build();

        SagaStateTransition transition = saga.transitionTo(SagaState.PROCESSING, "Processing started");

        assertThat(saga.getState()).isEqualTo(SagaState.PROCESSING);
        assertThat(transition.getFromState()).isEqualTo(SagaState.INITIATED);
        assertThat(transition.getToState()).isEqualTo(SagaState.PROCESSING);
        assertThat(transition.getReason()).isEqualTo("Processing started");
        assertThat(saga.getTransitions()).hasSize(1);
    }

    @Test
    void multipleTransitionsRecordsAll() {
        TemplateSaga saga = TemplateSaga.builder()
                .correlationId("corr-2")
                .state(SagaState.INITIATED)
                .payload("{}")
                .build();

        saga.transitionTo(SagaState.PROCESSING, "Step 1");
        saga.transitionTo(SagaState.COMPLETED, "All done");

        assertThat(saga.getState()).isEqualTo(SagaState.COMPLETED);
        assertThat(saga.getTransitions()).hasSize(2);
    }

    @Test
    void compensationTransition() {
        TemplateSaga saga = TemplateSaga.builder()
                .correlationId("corr-3")
                .state(SagaState.PROCESSING)
                .payload("{}")
                .build();

        saga.transitionTo(SagaState.COMPENSATING, "Failure detected");
        saga.transitionTo(SagaState.FAILED, "Compensation complete");

        assertThat(saga.getState()).isEqualTo(SagaState.FAILED);
        assertThat(saga.getTransitions()).hasSize(2);
        assertThat(saga.getTransitions().get(0).getToState()).isEqualTo(SagaState.COMPENSATING);
        assertThat(saga.getTransitions().get(1).getToState()).isEqualTo(SagaState.FAILED);
    }
}

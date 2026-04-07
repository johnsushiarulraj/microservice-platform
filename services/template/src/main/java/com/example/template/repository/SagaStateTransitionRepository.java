package com.example.template.repository;

import com.example.template.entity.SagaStateTransition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface SagaStateTransitionRepository extends JpaRepository<SagaStateTransition, UUID> {
}

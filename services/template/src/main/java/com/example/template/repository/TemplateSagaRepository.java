package com.example.template.repository;

import com.example.template.entity.TemplateSaga;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface TemplateSagaRepository extends JpaRepository<TemplateSaga, UUID> {
}

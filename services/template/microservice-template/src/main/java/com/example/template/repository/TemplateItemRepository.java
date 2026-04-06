package com.example.template.repository;

import com.example.template.entity.TemplateItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface TemplateItemRepository extends JpaRepository<TemplateItem, UUID> {
}

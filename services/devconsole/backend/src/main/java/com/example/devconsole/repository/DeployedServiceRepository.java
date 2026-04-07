package com.example.devconsole.repository;

import com.example.devconsole.entity.DeployedService;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface DeployedServiceRepository extends JpaRepository<DeployedService, UUID> {
    Optional<DeployedService> findByName(String name);
}

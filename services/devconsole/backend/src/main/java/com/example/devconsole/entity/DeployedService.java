package com.example.devconsole.entity;

import lombok.*;
import javax.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "deployed_services", schema = "devconsole")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeployedService {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(unique = true, nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 50)
    private String tag;

    @Column(name = "context_path", length = 100)
    private String contextPath;

    @Column(name = "provision_yml", columnDefinition = "TEXT")
    private String provisionYml;

    @Column(name = "source_path", length = 500)
    private String sourcePath;

    @Column(length = 20)
    @Builder.Default
    private String status = "deployed";

    @Column(name = "deployed_at")
    @Builder.Default
    private Instant deployedAt = Instant.now();

    @Column(name = "updated_at")
    @Builder.Default
    private Instant updatedAt = Instant.now();
}

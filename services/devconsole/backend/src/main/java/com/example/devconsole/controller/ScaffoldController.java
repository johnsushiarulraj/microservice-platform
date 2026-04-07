package com.example.devconsole.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.*;
import java.nio.file.*;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.*;
import java.util.stream.Collectors;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@RestController
@RequestMapping("/api/scaffold")
public class ScaffoldController {

    private static final Logger log = LoggerFactory.getLogger(ScaffoldController.class);
    private static final String TEMPLATE_DIR = "/app/template";

    // Map frontend dep IDs to artifact patterns to strip from pom.xml
    private static final Map<String, List<String>> DEP_ARTIFACTS = new LinkedHashMap<>();
    static {
        DEP_ARTIFACTS.put("postgresql", Arrays.asList("spring-boot-starter-data-jpa", "postgresql", "liquibase-core", "testcontainers:postgresql"));
        DEP_ARTIFACTS.put("redis", Arrays.asList("spring-boot-starter-data-redis", "testcontainers-redis"));
        DEP_ARTIFACTS.put("kafka", Arrays.asList("spring-cloud-starter-stream-kafka", "testcontainers:kafka"));
        DEP_ARTIFACTS.put("sqs", Arrays.asList("sqs"));
        DEP_ARTIFACTS.put("s3", Arrays.asList("s3"));
        DEP_ARTIFACTS.put("dynamodb", Collections.emptyList());
        DEP_ARTIFACTS.put("opensearch", Arrays.asList("opensearch-rest-high-level-client", "testcontainers:elasticsearch"));
        DEP_ARTIFACTS.put("keycloak", Arrays.asList("spring-boot-starter-security", "spring-boot-starter-oauth2-resource-server", "spring-security-test"));
        DEP_ARTIFACTS.put("actuator", Arrays.asList("spring-boot-starter-actuator", "micrometer-registry-prometheus"));
        DEP_ARTIFACTS.put("sleuth", Collections.emptyList());
        DEP_ARTIFACTS.put("resilience4j", Arrays.asList("resilience4j-spring-boot2", "resilience4j-reactor", "spring-boot-starter-aop"));
    }

    @PostMapping
    public ResponseEntity<Resource> scaffold(@RequestBody ScaffoldRequest request) throws Exception {
        String serviceName = request.getName();
        if (serviceName == null || serviceName.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        // Sanitize service name
        serviceName = serviceName.replaceAll("[^a-zA-Z0-9-]", "").toLowerCase();
        log.info("Scaffolding service: {} with deps: {}", serviceName, request.getDependencies());

        // Create temp working directory
        Path tempDir = Files.createTempDirectory("scaffold-");
        try {
            // Copy template to temp dir
            Path templateSrc = Paths.get(TEMPLATE_DIR);
            copyDirectory(templateSrc, tempDir);

            // Run rename.sh
            Path renameScript = tempDir.resolve("scripts/rename.sh");
            if (Files.exists(renameScript)) {
                ProcessBuilder pb = new ProcessBuilder("bash", renameScript.toString(), serviceName);
                pb.directory(tempDir.toFile());
                pb.redirectErrorStream(true);
                Process proc = pb.start();
                String output = new String(proc.getInputStream().readAllBytes());
                int exitCode = proc.waitFor();
                if (exitCode != 0) {
                    log.error("rename.sh failed (exit {}): {}", exitCode, output);
                    return ResponseEntity.internalServerError().build();
                }
                log.info("rename.sh output: {}", output);
            }

            // Apply custom group ID if provided
            String groupId = request.getGroupId() != null ? request.getGroupId().trim() : "";
            if (!groupId.isEmpty() && !groupId.equals("com.example")) {
                String articleName = serviceName.split("-")[0]; // tickets-service → tickets
                String oldPkg = "com.example." + articleName;
                String newPkg = groupId + "." + articleName;
                String oldPkgPath = oldPkg.replace('.', '/');
                String newPkgPath = newPkg.replace('.', '/');

                // 1. Replace in ALL text files (Java, XML, YML, properties)
                try (var stream = Files.walk(tempDir)) {
                    stream.filter(p -> Files.isRegularFile(p)).forEach(f -> {
                        String name = f.getFileName().toString();
                        if (name.endsWith(".java") || name.endsWith(".xml") || name.endsWith(".yml") || name.endsWith(".yaml") || name.endsWith(".properties")) {
                            try {
                                String content = Files.readString(f);
                                content = content.replace("com.example", groupId);
                                Files.writeString(f, content);
                            } catch (Exception e) { log.warn("Failed to update {}", f, e); }
                        }
                    });
                }

                // 2. Replace groupId in pom.xml (in case the broad replace above missed the Spring Boot parent)
                // The parent groupId (org.springframework.boot) should NOT be replaced — fix if it was
                try (var stream = Files.walk(tempDir)) {
                    stream.filter(p -> p.toString().endsWith("pom.xml")).forEach(pom -> {
                        try {
                            String content = Files.readString(pom);
                            content = content.replace("<groupId>" + groupId + ".boot</groupId>", "<groupId>org.springframework.boot</groupId>");
                            Files.writeString(pom, content);
                        } catch (Exception e) {}
                    });
                }

                // 3. Move files from old package dir to new package dir
                for (String base : new String[]{"src/main/java", "src/test/java"}) {
                    Path oldDir = tempDir.resolve(base).resolve(oldPkgPath);
                    Path newDir = tempDir.resolve(base).resolve(newPkgPath);
                    if (Files.exists(oldDir)) {
                        Files.createDirectories(newDir);
                        try (var files = Files.walk(oldDir)) {
                            files.forEach(src -> {
                                try {
                                    Path dest = newDir.resolve(oldDir.relativize(src));
                                    if (Files.isDirectory(src)) {
                                        Files.createDirectories(dest);
                                    } else {
                                        Files.createDirectories(dest.getParent());
                                        Files.move(src, dest, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
                                    }
                                } catch (Exception e) {}
                            });
                        }
                        // Delete old com/example tree
                        deleteDirectory(tempDir.resolve(base).resolve("com/example"));
                    }
                }
            }

            // Strip unchecked dependencies from pom.xml AND source files
            Set<String> selectedDeps = new HashSet<>(request.getDependencies() != null ? request.getDependencies() : Collections.emptyList());
            stripDependencies(tempDir, serviceName, selectedDeps);
            stripSourceFiles(tempDir, selectedDeps);

            // Generate provision.yml based on selected deps
            generateProvisionYml(tempDir, serviceName, selectedDeps);

            // Remove .git dir (rename.sh creates one)
            Path gitDir = tempDir.resolve(".git");
            if (Files.exists(gitDir)) {
                deleteDirectory(gitDir);
            }

            // Create ZIP
            byte[] zipBytes = createZip(tempDir, serviceName);

            ByteArrayResource resource = new ByteArrayResource(zipBytes);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + serviceName + ".zip")
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .contentLength(zipBytes.length)
                    .body(resource);

        } finally {
            deleteDirectory(tempDir);
        }
    }

    private void stripDependencies(Path projectDir, String serviceName, Set<String> selectedDeps) throws IOException {
        // Find the pom.xml in the renamed service directory
        Path pomPath = projectDir.resolve(serviceName + "/pom.xml");
        if (!Files.exists(pomPath)) {
            // Try finding any pom.xml in subdirectory
            try (var stream = Files.walk(projectDir, 2)) {
                pomPath = stream
                        .filter(p -> p.getFileName().toString().equals("pom.xml"))
                        .filter(p -> !p.getParent().equals(projectDir))
                        .findFirst()
                        .orElse(null);
            }
        }
        if (pomPath == null) return;

        String pom = Files.readString(pomPath);

        // Collect all artifact IDs that should be removed
        Set<String> toRemove = new HashSet<>();
        for (Map.Entry<String, List<String>> entry : DEP_ARTIFACTS.entrySet()) {
            if (!selectedDeps.contains(entry.getKey())) {
                toRemove.addAll(entry.getValue());
            }
        }

        // If no SQS and no S3 selected, also remove shared AWS deps
        if (!selectedDeps.contains("sqs") && !selectedDeps.contains("s3")) {
            toRemove.add("url-connection-client");
        }

        // Remove each dependency block
        for (String artifact : toRemove) {
            // Handle "groupId:artifactId" format
            String artId = artifact.contains(":") ? artifact.split(":")[1] : artifact;
            // Remove the entire <dependency>...</dependency> block containing this artifactId
            String pattern = "(?s)\\s*<dependency>\\s*[^<]*<artifactId>" + artId + "</artifactId>.*?</dependency>";
            pom = pom.replaceAll(pattern, "");
        }

        // Also remove empty Spring Cloud dependency management if kafka is removed
        if (!selectedDeps.contains("kafka")) {
            pom = pom.replaceAll("(?s)\\s*<!-- Spring Cloud Stream.*?-->", "");
        }

        Files.writeString(pomPath, pom);
    }

    private void stripSourceFiles(Path projectDir, Set<String> selectedDeps) throws IOException {
        // Map: dep ID → directories/file patterns to DELETE when dep is NOT selected
        // These are relative to the Java source root (e.g., com/example/template/)
        Map<String, List<String>> depSourceFiles = new LinkedHashMap<>();
        depSourceFiles.put("postgresql", Arrays.asList(
            "config/JpaConfig.java", "entity/", "repository/",
            "src/main/resources/db/"
        ));
        depSourceFiles.put("redis", Arrays.asList("cache/"));
        depSourceFiles.put("kafka", Arrays.asList(
            "config/KafkaConfig.java", "event/", "outbox/",
            "entity/OutboxEvent.java", "entity/ProcessedEvent.java",
            "repository/OutboxEventRepository.java", "repository/ProcessedEventRepository.java"
        ));
        depSourceFiles.put("sqs", Arrays.asList("queue/"));
        depSourceFiles.put("s3", Arrays.asList("storage/"));
        depSourceFiles.put("opensearch", Arrays.asList(
            "config/OpenSearchConfig.java", "search/"
        ));
        depSourceFiles.put("actuator", Arrays.asList("metrics/"));
        depSourceFiles.put("resilience4j", Arrays.asList("config/ResilienceConfig.java"));

        // Saga requires both postgresql AND kafka — remove if either is missing
        boolean hasSaga = selectedDeps.contains("postgresql") && selectedDeps.contains("kafka");

        for (Map.Entry<String, List<String>> entry : depSourceFiles.entrySet()) {
            if (!selectedDeps.contains(entry.getKey())) {
                for (String pattern : entry.getValue()) {
                    // Handle resource paths (start with src/)
                    if (pattern.startsWith("src/")) {
                        Path target = projectDir.resolve(pattern);
                        if (Files.exists(target)) deleteDirectory(target);
                        continue;
                    }
                    // Handle Java source paths — find them in the source tree
                    try (var stream = Files.walk(projectDir.resolve("src"))) {
                        stream.filter(p -> {
                            String rel = p.toString().replace('\\', '/');
                            if (pattern.endsWith("/")) {
                                // Directory pattern — match if path contains /pattern
                                return rel.contains("/" + pattern.substring(0, pattern.length() - 1) + "/")
                                    || rel.endsWith("/" + pattern.substring(0, pattern.length() - 1));
                            } else {
                                // File pattern — match exact filename
                                return rel.endsWith("/" + pattern);
                            }
                        }).sorted((a, b) -> b.toString().length() - a.toString().length()) // deepest first
                        .forEach(p -> {
                            try {
                                if (Files.isDirectory(p)) deleteDirectory(p);
                                else Files.deleteIfExists(p);
                            } catch (Exception e) { log.warn("Failed to delete {}", p); }
                        });
                    }
                }
            }
        }

        // Remove saga files if both postgresql and kafka are not selected
        if (!hasSaga) {
            try (var stream = Files.walk(projectDir.resolve("src"))) {
                stream.filter(p -> {
                    String name = p.getFileName().toString();
                    return name.contains("Saga") || name.contains("saga") ||
                           name.contains("Outbox") || name.contains("outbox") ||
                           name.contains("ProcessedEvent");
                }).sorted((a, b) -> b.toString().length() - a.toString().length())
                .forEach(p -> {
                    try {
                        if (Files.isDirectory(p)) deleteDirectory(p);
                        else Files.deleteIfExists(p);
                    } catch (Exception e) {}
                });
            }
        }

        // If no SQS and no S3, remove AwsConfig
        if (!selectedDeps.contains("sqs") && !selectedDeps.contains("s3")) {
            try (var stream = Files.walk(projectDir.resolve("src"))) {
                stream.filter(p -> p.getFileName().toString().equals("AwsConfig.java"))
                    .forEach(p -> { try { Files.deleteIfExists(p); } catch (Exception e) {} });
            }
        }

        // Strip broken imports and references from remaining Java files
        Set<String> deletedPackages = new HashSet<>();
        if (!selectedDeps.contains("redis")) deletedPackages.add("cache");
        if (!selectedDeps.contains("kafka")) { deletedPackages.add("event"); deletedPackages.add("outbox"); }
        // Also mark specific classes as deleted when kafka is removed
        // (OutboxEvent, ProcessedEvent, OutboxEventRepository, ProcessedEventRepository)
        if (!selectedDeps.contains("sqs")) deletedPackages.add("queue");
        if (!selectedDeps.contains("s3")) deletedPackages.add("storage");
        if (!selectedDeps.contains("opensearch")) deletedPackages.add("search");
        if (!hasSaga) { deletedPackages.add("saga"); }

        if (!deletedPackages.isEmpty()) {
            try (var stream = Files.walk(projectDir.resolve("src"))) {
                stream.filter(p -> p.toString().endsWith(".java") && Files.isRegularFile(p)).forEach(javaFile -> {
                    try {
                        List<String> lines = Files.readAllLines(javaFile);
                        List<String> cleaned = new java.util.ArrayList<>();
                        Set<String> removedTypes = new HashSet<>();

                        // Known deleted class names (when kafka is removed)
                        Set<String> deletedClassNames = new HashSet<>();
                        if (!selectedDeps.contains("kafka")) {
                            deletedClassNames.addAll(Arrays.asList("OutboxEvent", "OutboxPublisher", "ProcessedEvent",
                                "OutboxEventRepository", "ProcessedEventRepository"));
                        }

                        // Pass 1: identify imports to remove
                        for (String line : lines) {
                            boolean remove = false;
                            for (String pkg : deletedPackages) {
                                if (line.matches("\\s*import\\s+.*\\." + pkg + "\\..*")) {
                                    remove = true;
                                    String className = line.replaceAll(".*\\.", "").replace(";", "").trim();
                                    removedTypes.add(className);
                                    break;
                                }
                            }
                            // Also remove imports of known deleted classes
                            if (!remove) {
                                for (String cls : deletedClassNames) {
                                    if (line.contains("import ") && line.contains(cls)) {
                                        remove = true;
                                        removedTypes.add(cls);
                                        break;
                                    }
                                }
                            }
                            if (!remove) cleaned.add(line);
                        }

                        // Pass 2: remove field declarations and constructor params that use removed types
                        List<String> finalLines = new java.util.ArrayList<>();
                        for (String line : cleaned) {
                            boolean remove = false;
                            for (String type : removedTypes) {
                                if (line.contains(type) && !line.contains("class ") && !line.contains("interface ")) {
                                    remove = true;
                                    break;
                                }
                            }
                            if (!remove) finalLines.add(line);
                        }

                        Files.write(javaFile, finalLines);
                    } catch (Exception e) { log.warn("Failed to clean imports in {}", javaFile, e); }
                });
            }
        }

        // Clean up empty directories
        try (var stream = Files.walk(projectDir.resolve("src"))) {
            stream.filter(Files::isDirectory)
                .sorted((a, b) -> b.toString().length() - a.toString().length())
                .forEach(dir -> {
                    try {
                        if (Files.list(dir).findAny().isEmpty()) Files.delete(dir);
                    } catch (Exception e) {}
                });
        }
    }

    private void generateProvisionYml(Path projectDir, String serviceName, Set<String> deps) throws IOException {
        String prefix = serviceName.replace("-service", "");
        String upper = prefix.toUpperCase();
        StringBuilder yml = new StringBuilder();
        yml.append("service: ").append(serviceName).append("\n");
        yml.append("context-path: /").append(prefix).append("\n");

        if (deps.contains("postgresql")) {
            yml.append("\ndatabase:\n");
            yml.append("  name: ").append(prefix).append("\n");
        }

        if (deps.contains("kafka")) {
            yml.append("\nkafka:\n");
            yml.append("  topics:\n");
            yml.append("    - ").append(prefix).append("-events\n");
            yml.append("    - ").append(prefix).append("-events-dlq\n");
        }

        if (deps.contains("sqs")) {
            yml.append("\nsqs:\n");
            yml.append("  queues:\n");
            yml.append("    - ").append(prefix).append("-tasks\n");
        }

        if (deps.contains("s3")) {
            yml.append("\ns3:\n");
            yml.append("  buckets:\n");
            yml.append("    - ").append(prefix).append("-documents\n");
        }

        if (deps.contains("dynamodb")) {
            yml.append("\ndynamodb:\n");
            yml.append("  tables:\n");
            yml.append("    - name: ").append(prefix).append("-items\n");
            yml.append("      partitionKey: id\n");
        }

        if (deps.contains("opensearch")) {
            yml.append("\nopensearch:\n");
            yml.append("  indices:\n");
            yml.append("    - ").append(prefix).append("-items\n");
        }

        // Keycloak always included
        yml.append("\nkeycloak:\n");
        yml.append("  realm: ").append(prefix).append("\n");
        yml.append("  client: ").append(serviceName).append("\n");
        yml.append("  roles:\n");
        yml.append("    - ").append(upper).append("_USER\n");
        yml.append("    - ").append(upper).append("_ADMIN\n");

        Files.writeString(projectDir.resolve("provision.yml"), yml.toString());
    }

    private void copyDirectory(Path source, Path target) throws IOException {
        Files.walkFileTree(source, new SimpleFileVisitor<Path>() {
            @Override
            public FileVisitResult preVisitDirectory(Path dir, BasicFileAttributes attrs) throws IOException {
                Path targetDir = target.resolve(source.relativize(dir));
                Files.createDirectories(targetDir);
                return FileVisitResult.CONTINUE;
            }

            @Override
            public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) throws IOException {
                Path targetFile = target.resolve(source.relativize(file));
                Files.copy(file, targetFile, StandardCopyOption.REPLACE_EXISTING);
                // Preserve execute permission for scripts
                if (file.toString().endsWith(".sh")) {
                    targetFile.toFile().setExecutable(true);
                }
                return FileVisitResult.CONTINUE;
            }
        });
    }

    private byte[] createZip(Path dir, String serviceName) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (ZipOutputStream zos = new ZipOutputStream(baos)) {
            Files.walkFileTree(dir, new SimpleFileVisitor<Path>() {
                @Override
                public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) throws IOException {
                    String entryName = serviceName + "/" + dir.relativize(file).toString().replace('\\', '/');
                    zos.putNextEntry(new ZipEntry(entryName));
                    Files.copy(file, zos);
                    zos.closeEntry();
                    return FileVisitResult.CONTINUE;
                }

                @Override
                public FileVisitResult preVisitDirectory(Path d, BasicFileAttributes attrs) throws IOException {
                    if (!d.equals(dir)) {
                        String entryName = serviceName + "/" + dir.relativize(d).toString().replace('\\', '/') + "/";
                        zos.putNextEntry(new ZipEntry(entryName));
                        zos.closeEntry();
                    }
                    return FileVisitResult.CONTINUE;
                }
            });
        }
        return baos.toByteArray();
    }

    private void deleteDirectory(Path dir) throws IOException {
        if (!Files.exists(dir)) return;
        Files.walkFileTree(dir, new SimpleFileVisitor<Path>() {
            @Override
            public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) throws IOException {
                Files.delete(file);
                return FileVisitResult.CONTINUE;
            }

            @Override
            public FileVisitResult postVisitDirectory(Path d, IOException exc) throws IOException {
                Files.delete(d);
                return FileVisitResult.CONTINUE;
            }
        });
    }

    static class ScaffoldRequest {
        private String name;
        private String description;
        private String groupId;
        private String artifactId;
        private List<String> dependencies;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public String getGroupId() { return groupId; }
        public void setGroupId(String groupId) { this.groupId = groupId; }
        public String getArtifactId() { return artifactId; }
        public void setArtifactId(String artifactId) { this.artifactId = artifactId; }
        public List<String> getDependencies() { return dependencies; }
        public void setDependencies(List<String> dependencies) { this.dependencies = dependencies; }
    }
}

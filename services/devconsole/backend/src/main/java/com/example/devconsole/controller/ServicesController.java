package com.example.devconsole.controller;

import com.example.devconsole.entity.DeployedService;
import com.example.devconsole.repository.DeployedServiceRepository;
import com.example.devconsole.service.KubernetesService;
import com.example.devconsole.service.ProvisionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;

@RestController
@RequestMapping("/api/services")
@RequiredArgsConstructor
@Slf4j
public class ServicesController {

    private final KubernetesService kubernetesService;
    private final DeployedServiceRepository deployedServiceRepository;
    private final ProvisionService provisionService;

    @GetMapping
    public List<Map<String, String>> listServices() {
        return kubernetesService.listDeployedServices();
    }

    @PostMapping("/deploy")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> deploy(@RequestBody Map<String, String> body) {
        String name = body.get("name");
        String tag = body.getOrDefault("tag", "latest");
        String contextPath = body.getOrDefault("contextPath", "/" + name.replace("-service", ""));
        String provisionYml = body.get("provisionYml");

        // Check context path conflict
        Optional<DeployedService> existing = deployedServiceRepository.findByName(name);
        for (DeployedService svc : deployedServiceRepository.findAll()) {
            if (!svc.getName().equals(name) && contextPath.equals(svc.getContextPath())) {
                return Map.of("error", "Context path " + contextPath + " is already used by " + svc.getName());
            }
        }

        // Provision infrastructure if provision.yml provided
        Map<String, Object> provisionResult = null;
        if (provisionYml != null && !provisionYml.isBlank()) {
            // Re-provision if yml changed OR if service was previously destroyed (infrastructure was removed)
            boolean wasDestroyed = existing.isPresent() && "destroyed".equals(existing.get().getStatus());
            boolean changed = existing.isEmpty() || wasDestroyed || !provisionYml.equals(existing.get().getProvisionYml());
            if (changed) {
                provisionResult = provisionService.provision(provisionYml);
                log.info("Provisioned for {}: {}", name, provisionResult);
            }
        }

        // Deploy via Helm
        Map<String, String> deployResult = kubernetesService.deployService(name, tag, contextPath);

        // Save to database
        DeployedService svc = existing.orElse(DeployedService.builder().name(name).build());
        svc.setTag(tag);
        svc.setContextPath(contextPath);
        if (provisionYml != null && !provisionYml.isBlank()) svc.setProvisionYml(provisionYml);
        svc.setStatus("deployed");
        svc.setUpdatedAt(Instant.now());
        if (existing.isEmpty()) svc.setDeployedAt(Instant.now());
        deployedServiceRepository.save(svc);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("name", name);
        result.put("tag", tag);
        result.put("status", "deployed");
        if (provisionResult != null) result.put("provisioned", provisionResult);
        return result;
    }

    @PostMapping("/redeploy-all")
    public Map<String, Object> redeployAll() {
        List<DeployedService> services = deployedServiceRepository.findAll();
        List<String> redeployed = new ArrayList<>();
        List<String> failed = new ArrayList<>();

        for (DeployedService svc : services) {
            try {
                // Provision from saved yml
                if (svc.getProvisionYml() != null && !svc.getProvisionYml().isBlank()) {
                    provisionService.provision(svc.getProvisionYml());
                }
                // Redeploy
                kubernetesService.deployService(svc.getName(), svc.getTag(), svc.getContextPath());
                redeployed.add(svc.getName() + ":" + svc.getTag());
            } catch (Exception e) {
                log.error("Failed to redeploy {}: {}", svc.getName(), e.getMessage());
                failed.add(svc.getName() + " — " + e.getMessage());
            }
        }

        return Map.of("redeployed", redeployed, "failed", failed);
    }

    @GetMapping("/{name}/infrastructure")
    public Map<String, Object> getInfrastructure(@PathVariable String name) {
        return deployedServiceRepository.findByName(name)
            .map(svc -> {
                Map<String, Object> result = new LinkedHashMap<>();
                result.put("name", svc.getName());
                result.put("tag", svc.getTag());
                result.put("contextPath", svc.getContextPath());
                result.put("status", svc.getStatus());
                result.put("deployedAt", svc.getDeployedAt());
                if (svc.getProvisionYml() != null) {
                    result.put("provisionYml", svc.getProvisionYml());
                }
                return result;
            })
            .orElse(Map.of("error", "Service not found"));
    }

    @GetMapping("/{name}/pods")
    public List<Map<String, String>> getPods(@PathVariable String name) {
        return kubernetesService.getPodStatus(name);
    }

    @GetMapping("/{name}/logs")
    public Map<String, String> getLogs(@PathVariable String name,
                                       @RequestParam(defaultValue = "200") int lines) {
        String logs = kubernetesService.getLogs(name, lines);
        return Map.of("name", name, "logs", logs != null ? logs : "");
    }

    @DeleteMapping("/{name}")
    public Map<String, Object> destroy(@PathVariable String name,
                                        @RequestParam(defaultValue = "false") boolean deprovision) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.putAll(kubernetesService.destroyService(name));

        if (deprovision) {
            deployedServiceRepository.findByName(name).ifPresent(svc -> {
                if (svc.getProvisionYml() != null && !svc.getProvisionYml().isBlank()) {
                    try {
                        Map<String, Object> deprovResult = provisionService.deprovision(svc.getProvisionYml());
                        result.put("deprovisioned", deprovResult);
                    } catch (Exception e) {
                        result.put("deprovisionError", e.getMessage());
                    }
                }
            });
        }

        deployedServiceRepository.findByName(name).ifPresent(svc -> {
            svc.setStatus("destroyed");
            svc.setUpdatedAt(Instant.now());
            deployedServiceRepository.save(svc);
        });
        return result;
    }

    @PostMapping("/{name}/restart")
    public Map<String, String> restart(@PathVariable String name) {
        return kubernetesService.restartService(name);
    }

    @PatchMapping("/{name}/scale")
    public Map<String, String> scale(@PathVariable String name, @RequestBody Map<String, Integer> body) {
        return kubernetesService.scaleService(name, body.get("replicas"));
    }
}

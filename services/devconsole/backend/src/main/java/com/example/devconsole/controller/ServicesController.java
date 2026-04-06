package com.example.devconsole.controller;

import com.example.devconsole.service.KubernetesService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/services")
@RequiredArgsConstructor
public class ServicesController {

    private final KubernetesService kubernetesService;

    @GetMapping
    public List<Map<String, String>> listServices() {
        return kubernetesService.listDeployedServices();
    }

    @PostMapping("/deploy")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, String> deploy(@RequestBody Map<String, String> body) {
        String name = body.get("name");
        String tag = body.getOrDefault("tag", "latest");
        String contextPath = body.getOrDefault("contextPath", "/" + name.replace("-service", ""));
        return kubernetesService.deployService(name, tag, contextPath);
    }

    @DeleteMapping("/{name}")
    public Map<String, String> destroy(@PathVariable String name) {
        return kubernetesService.destroyService(name);
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

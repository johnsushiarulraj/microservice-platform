package com.example.devconsole.controller;

import com.example.devconsole.service.SqsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sqs/queues")
@RequiredArgsConstructor
public class SqsController {

    private final SqsService sqsService;

    @GetMapping
    public List<Map<String, Object>> listQueues() {
        return sqsService.listQueues();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, String> createQueue(@RequestBody Map<String, String> body) {
        return sqsService.createQueue(body.get("name"));
    }

    @DeleteMapping("/{name}")
    public void deleteQueue(@PathVariable String name) {
        sqsService.deleteQueue(name);
    }

    @PostMapping("/{name}/send")
    public Map<String, String> sendMessage(@PathVariable String name, @RequestBody Map<String, String> body) {
        return sqsService.sendMessage(name, body.get("body"));
    }

    @GetMapping("/{name}/receive")
    public List<Map<String, String>> receiveMessages(@PathVariable String name,
                                                      @RequestParam(defaultValue = "5") int maxMessages) {
        return sqsService.receiveMessages(name, maxMessages);
    }

    @PostMapping("/{name}/purge")
    public void purgeQueue(@PathVariable String name) {
        sqsService.purgeQueue(name);
    }
}

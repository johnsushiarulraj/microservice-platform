package com.example.devconsole.controller;

import com.example.devconsole.service.S3Service;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/s3")
@RequiredArgsConstructor
public class S3Controller {

    private final S3Service s3Service;

    @GetMapping("/buckets")
    public List<Map<String, String>> listBuckets() {
        return s3Service.listBuckets();
    }

    @PostMapping("/buckets")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, String> createBucket(@RequestBody Map<String, String> body) {
        return s3Service.createBucket(body.get("name"));
    }

    @DeleteMapping("/buckets/{name}")
    public void deleteBucket(@PathVariable String name) {
        s3Service.deleteBucket(name);
    }

    @GetMapping("/buckets/{bucket}/objects")
    public List<Map<String, Object>> listObjects(@PathVariable String bucket,
                                                  @RequestParam(defaultValue = "") String prefix) {
        return s3Service.listObjects(bucket, prefix);
    }

    @PostMapping("/buckets/{bucket}/objects")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, String> uploadObject(@PathVariable String bucket,
                                             @RequestParam String key,
                                             @RequestParam("file") MultipartFile file) {
        return s3Service.uploadObject(bucket, key, file);
    }

    @GetMapping("/buckets/{bucket}/objects/{key}")
    public ResponseEntity<InputStreamResource> downloadObject(@PathVariable String bucket,
                                                               @PathVariable String key) {
        var result = s3Service.downloadObject(bucket, key);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + key + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(result);
    }

    @DeleteMapping("/buckets/{bucket}/objects/{key}")
    public void deleteObject(@PathVariable String bucket, @PathVariable String key) {
        s3Service.deleteObject(bucket, key);
    }
}

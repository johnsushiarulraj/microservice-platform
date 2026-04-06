package com.example.devconsole.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.InputStreamResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class S3Service {

    private final S3Client s3Client;

    public List<Map<String, String>> listBuckets() {
        return s3Client.listBuckets().buckets().stream()
                .map(b -> Map.of("name", b.name(), "created", b.creationDate().toString()))
                .collect(Collectors.toList());
    }

    public Map<String, String> createBucket(String name) {
        s3Client.createBucket(CreateBucketRequest.builder().bucket(name).build());
        return Map.of("name", name);
    }

    public void deleteBucket(String name) {
        s3Client.deleteBucket(DeleteBucketRequest.builder().bucket(name).build());
    }

    public List<Map<String, Object>> listObjects(String bucket, String prefix) {
        ListObjectsV2Request.Builder builder = ListObjectsV2Request.builder().bucket(bucket);
        if (!prefix.isEmpty()) {
            builder.prefix(prefix);
        }
        return s3Client.listObjectsV2(builder.build()).contents().stream()
                .map(o -> Map.<String, Object>of(
                        "key", o.key(),
                        "size", o.size(),
                        "lastModified", o.lastModified().toString()
                ))
                .collect(Collectors.toList());
    }

    public Map<String, String> uploadObject(String bucket, String key, MultipartFile file) {
        try {
            s3Client.putObject(
                    PutObjectRequest.builder().bucket(bucket).key(key).build(),
                    RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
            return Map.of("bucket", bucket, "key", key);
        } catch (Exception e) {
            throw new RuntimeException("Upload failed: " + e.getMessage(), e);
        }
    }

    public InputStreamResource downloadObject(String bucket, String key) {
        var response = s3Client.getObject(GetObjectRequest.builder().bucket(bucket).key(key).build());
        return new InputStreamResource(response);
    }

    public void deleteObject(String bucket, String key) {
        s3Client.deleteObject(DeleteObjectRequest.builder().bucket(bucket).key(key).build());
    }
}

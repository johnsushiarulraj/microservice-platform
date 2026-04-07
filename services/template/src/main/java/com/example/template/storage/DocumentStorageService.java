package com.example.template.storage;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.InputStream;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentStorageService {

    @Value("${aws.s3.bucket:template-documents}")
    private String bucket;

    private final S3Client s3Client;

    public void store(String key, byte[] content, String contentType) {
        try {
            s3Client.putObject(
                PutObjectRequest.builder().bucket(bucket).key(key).contentType(contentType).build(),
                RequestBody.fromBytes(content)
            );
            log.info("Stored document key={} bucket={}", key, bucket);
        } catch (Exception e) {
            log.error("Failed to store document key={}", key, e);
            throw new RuntimeException("Failed to store document", e);
        }
    }

    public InputStream retrieve(String key) {
        try {
            return s3Client.getObject(GetObjectRequest.builder().bucket(bucket).key(key).build());
        } catch (Exception e) {
            log.error("Failed to retrieve document key={}", key, e);
            throw new RuntimeException("Failed to retrieve document", e);
        }
    }
}

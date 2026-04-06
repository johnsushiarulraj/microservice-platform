package com.example.devconsole.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.sqs.SqsClient;
import software.amazon.awssdk.services.sqs.model.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class SqsService {

    private final SqsClient sqsClient;

    public List<Map<String, Object>> listQueues() {
        ListQueuesResponse response = sqsClient.listQueues();
        return response.queueUrls().stream().map(url -> {
            String name = url.substring(url.lastIndexOf('/') + 1);
            try {
                GetQueueAttributesResponse attrs = sqsClient.getQueueAttributes(
                        GetQueueAttributesRequest.builder()
                                .queueUrl(url)
                                .attributeNames(QueueAttributeName.APPROXIMATE_NUMBER_OF_MESSAGES,
                                        QueueAttributeName.APPROXIMATE_NUMBER_OF_MESSAGES_NOT_VISIBLE)
                                .build());
                return Map.<String, Object>of(
                        "name", name,
                        "url", url,
                        "messagesAvailable", attrs.attributes().getOrDefault(QueueAttributeName.APPROXIMATE_NUMBER_OF_MESSAGES, "0"),
                        "messagesInFlight", attrs.attributes().getOrDefault(QueueAttributeName.APPROXIMATE_NUMBER_OF_MESSAGES_NOT_VISIBLE, "0")
                );
            } catch (Exception e) {
                return Map.<String, Object>of("name", name, "url", url);
            }
        }).collect(Collectors.toList());
    }

    public Map<String, String> createQueue(String name) {
        CreateQueueResponse response = sqsClient.createQueue(
                CreateQueueRequest.builder().queueName(name).build());
        return Map.of("name", name, "url", response.queueUrl());
    }

    public void deleteQueue(String name) {
        String url = getQueueUrl(name);
        sqsClient.deleteQueue(DeleteQueueRequest.builder().queueUrl(url).build());
    }

    public Map<String, String> sendMessage(String name, String body) {
        String url = getQueueUrl(name);
        SendMessageResponse response = sqsClient.sendMessage(
                SendMessageRequest.builder().queueUrl(url).messageBody(body).build());
        return Map.of("messageId", response.messageId());
    }

    public List<Map<String, String>> receiveMessages(String name, int maxMessages) {
        String url = getQueueUrl(name);
        ReceiveMessageResponse response = sqsClient.receiveMessage(
                ReceiveMessageRequest.builder()
                        .queueUrl(url)
                        .maxNumberOfMessages(maxMessages)
                        .waitTimeSeconds(1)
                        .build());
        return response.messages().stream()
                .map(m -> Map.of("messageId", m.messageId(), "body", m.body()))
                .collect(Collectors.toList());
    }

    public void purgeQueue(String name) {
        String url = getQueueUrl(name);
        sqsClient.purgeQueue(PurgeQueueRequest.builder().queueUrl(url).build());
    }

    private String getQueueUrl(String name) {
        return sqsClient.getQueueUrl(GetQueueUrlRequest.builder().queueName(name).build()).queueUrl();
    }
}

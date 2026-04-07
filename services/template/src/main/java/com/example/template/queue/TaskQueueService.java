package com.example.template.queue;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.sqs.SqsClient;
import software.amazon.awssdk.services.sqs.model.*;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class TaskQueueService {

    @Value("${aws.sqs.task-queue-url:http://localhost:4566/000000000000/template-tasks}")
    private String taskQueueUrl;

    private final SqsClient sqsClient;

    public void enqueue(String messageBody) {
        try {
            SendMessageResponse response = sqsClient.sendMessage(
                SendMessageRequest.builder().queueUrl(taskQueueUrl).messageBody(messageBody).build()
            );
            log.info("Enqueued task messageId={}", response.messageId());
        } catch (Exception e) {
            log.error("Failed to enqueue task", e);
            throw new RuntimeException("Failed to enqueue task", e);
        }
    }

    public List<Message> receive(int maxMessages) {
        ReceiveMessageResponse response = sqsClient.receiveMessage(
            ReceiveMessageRequest.builder().queueUrl(taskQueueUrl).maxNumberOfMessages(maxMessages).build()
        );
        return response.messages();
    }

    public void delete(String receiptHandle) {
        sqsClient.deleteMessage(
            DeleteMessageRequest.builder().queueUrl(taskQueueUrl).receiptHandle(receiptHandle).build()
        );
    }
}

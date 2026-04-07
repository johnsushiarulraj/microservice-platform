#!/bin/bash
# LocalStack init script — runs when LocalStack is ready
echo "Creating S3 buckets..."
awslocal s3 mb s3://template-documents

echo "Creating SQS queues..."
awslocal sqs create-queue --queue-name template-tasks

echo "Creating DynamoDB tables..."
awslocal dynamodb create-table \
  --table-name template-items \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST

echo "LocalStack init complete."

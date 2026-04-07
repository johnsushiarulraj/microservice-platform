#!/usr/bin/env bash
# test.sh — Run unit tests
cd "$(dirname "$0")"
echo "Running tests..."
mvn test

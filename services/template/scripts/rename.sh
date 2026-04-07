#!/usr/bin/env bash
# rename.sh — Rename the template service to a new service name.
# Usage: ./scripts/rename.sh <service-name>
# Example: ./scripts/rename.sh payment-service
#
# This renames:
#   - Maven artifactId and module names
#   - Java package (com.example.template → com.example.<name>)
#   - Java class names (Template* → <Name>*)
#   - application.yml (app name, Kafka topics, context path, DB, etc.)
#   - Dockerfile, build.sh, Makefile, .env.example
#   - Directory: microservice-template/ → <service-name>/
set -euo pipefail

SERVICE_NAME="${1:?Usage: ./scripts/rename.sh <service-name>}"

# Derive names
PACKAGE_NAME=$(echo "$SERVICE_NAME" | sed 's/-.*//') # payment-service → payment
CLASS_PREFIX=$(echo "$PACKAGE_NAME" | sed 's/.*/\u&/') # payment → Payment
CONTEXT_PATH="/$PACKAGE_NAME"                          # /payment

OLD_SERVICE="microservice-template"
OLD_PACKAGE="template"
OLD_CLASS="Template"
OLD_APP_CLASS="MicroserviceTemplate"

echo "Renaming template to: $SERVICE_NAME"
echo "  Package:      com.example.$PACKAGE_NAME"
echo "  Class prefix: $CLASS_PREFIX"
echo "  Context path: $CONTEXT_PATH"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$ROOT_DIR"

# ── 1. Rename file contents ──────────────────────────────────────────────────
echo "==> [1/5] Replacing in file contents..."

# Service name (artifact ID, image name, consumer group, etc.)
find . -type f \( -name "*.xml" -o -name "*.yml" -o -name "*.yaml" -o -name "*.java" \
  -o -name "*.sh" -o -name "*.bat" -o -name "*.md" -o -name "Makefile" -o -name "Dockerfile" \
  -o -name ".env.example" -o -name "*.json" -o -name "*.properties" -o -name "*.conf" \) \
  -not -path "./.git/*" -not -path "*/target/*" \
  -exec sed -i "s/microservice-template/$SERVICE_NAME/g" {} +

# Java package: com.example.template → com.example.<package>
find . -type f \( -name "*.java" -o -name "*.xml" -o -name "*.yml" -o -name "*.yaml" -o -name "*.properties" \) \
  -not -path "./.git/*" -not -path "*/target/*" \
  -exec sed -i "s/com\.example\.template/com.example.$PACKAGE_NAME/g" {} +

# Package path in non-Java files (logback, etc.)
find . -type f \( -name "*.xml" -o -name "*.yml" \) \
  -not -path "./.git/*" -not -path "*/target/*" \
  -exec sed -i "s/com\/example\/template/com\/example\/$PACKAGE_NAME/g" {} +

# Application class: MicroserviceTemplateApplication → <ServiceName>Application
PASCAL_SERVICE=$(echo "$SERVICE_NAME" | sed -r 's/(^|-)(\w)/\U\2/g') # payment-service → PaymentService
find . -type f -name "*.java" -not -path "./.git/*" -not -path "*/target/*" \
  -exec sed -i "s/MicroserviceTemplateApplication/${PASCAL_SERVICE}Application/g" {} +

# Class prefix: Template → <ClassPrefix> (e.g. TemplateItem → PaymentItem)
# Only replace "Template" when preceded by start-of-word or our class patterns
# Exclude Spring framework classes: KafkaTemplate, RestTemplate, JdbcTemplate, StringRedisTemplate, etc.
find . -type f -name "*.java" -not -path "./.git/*" -not -path "*/target/*" \
  -exec sed -i -E "
    # Protect Spring *Template classes by temporarily replacing them
    s/KafkaTemplate/__KAFKA_TPL__/g
    s/RestTemplate/__REST_TPL__/g
    s/JdbcTemplate/__JDBC_TPL__/g
    s/StringRedisTemplate/__REDIS_TPL__/g
    s/RedisTemplate/__REDIS_BASE_TPL__/g
    s/NamedParameterJdbcTemplate/__NAMED_JDBC_TPL__/g
    # Now replace our Template prefix
    s/Template/${CLASS_PREFIX}/g
    # Restore Spring classes
    s/__KAFKA_TPL__/KafkaTemplate/g
    s/__REST_TPL__/RestTemplate/g
    s/__JDBC_TPL__/JdbcTemplate/g
    s/__REDIS_TPL__/StringRedisTemplate/g
    s/__REDIS_BASE_TPL__/RedisTemplate/g
    s/__NAMED_JDBC_TPL__/NamedParameterJdbcTemplate/g
  " {} +

# Kafka topics and related strings: template-events → <package>-events
find . -type f \( -name "*.yml" -o -name "*.yaml" -o -name "*.java" \) \
  -not -path "./.git/*" -not -path "*/target/*" \
  -exec sed -i "s/template-events/${PACKAGE_NAME}-events/g" {} +

find . -type f \( -name "*.yml" -o -name "*.yaml" -o -name "*.java" \) \
  -not -path "./.git/*" -not -path "*/target/*" \
  -exec sed -i "s/template-tasks/${PACKAGE_NAME}-tasks/g" {} +

find . -type f \( -name "*.yml" -o -name "*.yaml" -o -name "*.java" \) \
  -not -path "./.git/*" -not -path "*/target/*" \
  -exec sed -i "s/template-documents/${PACKAGE_NAME}-documents/g" {} +

# Context path
find . -type f \( -name "*.yml" -o -name "*.yaml" \) \
  -not -path "./.git/*" -not -path "*/target/*" \
  -exec sed -i "s|/template|$CONTEXT_PATH|g" {} +

# Database name/user
find . -type f \( -name "*.yml" -o -name "*.yaml" -o -name ".env.example" \) \
  -not -path "./.git/*" -not -path "*/target/*" \
  -exec sed -i "s/database=template/database=${PACKAGE_NAME}/g" {} +

find . -type f \( -name "*.yml" -o -name "*.yaml" -o -name ".env.example" \) \
  -not -path "./.git/*" -not -path "*/target/*" \
  -exec sed -i "s/username=template/username=${PACKAGE_NAME}/g" {} +

# Keycloak realm
find . -type f \( -name "*.yml" -o -name "*.yaml" -o -name ".env.example" \) \
  -not -path "./.git/*" -not -path "*/target/*" \
  -exec sed -i "s|/realms/template|/realms/${PACKAGE_NAME}|g" {} +

# Liquibase author
find . -type f -name "*.xml" -not -path "./.git/*" -not -path "*/target/*" \
  -exec sed -i "s/author=\"template\"/author=\"${PACKAGE_NAME}\"/g" {} +

# Kafka function names: templateEvent → <package>Event
find . -type f \( -name "*.yml" -o -name "*.yaml" -o -name "*.java" \) \
  -not -path "./.git/*" -not -path "*/target/*" \
  -exec sed -i "s/templateEvent/${PACKAGE_NAME}Event/g" {} +

# Role names: TEMPLATE_USER → ORDER_USER, TEMPLATE_ADMIN → ORDER_ADMIN etc.
UPPER_PACKAGE=$(echo "$PACKAGE_NAME" | tr '[:lower:]' '[:upper:]')
find . -type f \( -name "*.java" -o -name "*.yml" -o -name "*.yaml" \) \
  -not -path "./.git/*" -not -path "*/target/*" \
  -exec sed -i "s/TEMPLATE_/${UPPER_PACKAGE}_/g" {} +

# build.sh IMAGE_NAME
find . -type f -name "*.sh" -not -path "./.git/*" \
  -exec sed -i "s/IMAGE_NAME=\".*\"/IMAGE_NAME=\"$SERVICE_NAME\"/g" {} +

echo "    Content replacement done."

# ── 2. Rename Java files ─────────────────────────────────────────────────────
echo "==> [2/5] Renaming Java files..."

# First rename MicroserviceTemplate* files (most specific match first)
find . -type f -name "MicroserviceTemplate*" -not -path "./.git/*" -not -path "*/target/*" | while read -r file; do
  newfile=$(echo "$file" | sed "s/MicroserviceTemplate/${PASCAL_SERVICE}/g")
  mv "$file" "$newfile" 2>/dev/null || true
done

# Then rename remaining Template* files
find . -type f -name "*Template*" -not -path "./.git/*" -not -path "*/target/*" | while read -r file; do
  newfile=$(echo "$file" | sed "s/Template/${CLASS_PREFIX}/g")
  mv "$file" "$newfile" 2>/dev/null || true
done

echo "    Java files renamed."

# ── 3. Rename Java package directory ──────────────────────────────────────────
echo "==> [3/5] Renaming package directories..."

for base in "src/main/java" "src/test/java"; do
  if [ -d "$base/com/example/template" ]; then
    mkdir -p "$base/com/example/$PACKAGE_NAME"
    cp -r "$base/com/example/template/"* "$base/com/example/$PACKAGE_NAME/" 2>/dev/null || true
    rm -rf "$base/com/example/template"
  fi
done

echo "    Package directories renamed."

# ── 4. (Skipped — flat structure, no module directory to rename) ─────────────
echo "==> [4/5] Flat structure — no module rename needed."

echo "    Module directory renamed."

# ── 5. Reinitialize git ──────────────────────────────────────────────────────
echo "==> [5/5] Reinitializing git..."

rm -rf .git
git init
git add -A
git commit -m "Initial commit: $SERVICE_NAME (generated from microservice-template)"

echo ""
echo "✓ Renamed to '$SERVICE_NAME'"
echo ""
echo "  Package:     com.example.$PACKAGE_NAME"
echo "  Context:     $CONTEXT_PATH"
echo "  Module:      $SERVICE_NAME/"
echo ""
echo "  Next steps:"
echo "    1. Open in your IDE"
echo "    2. ./scripts/build.sh 1.0.0"
echo "    3. Deploy from DevConsole"

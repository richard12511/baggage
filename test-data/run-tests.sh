#!/bin/bash

BASE_URL="http://localhost:3000"
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "========================================="
echo "  BAGgage API Test Suite"
echo "========================================="
echo ""

echo -e "${BLUE}Test 1: Health Check${NC}"
curl -s "$BASE_URL/health" | jq
echo ""
echo ""

echo -e "${BLUE}Test 2: Valid Normal Priority Log Event${NC}"
curl -s -X POST "$BASE_URL/v1/events" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "logging.event",
    "priority": "NORMAL",
    "metadata": {
      "eventId": "550e8400-e29b-41d4-a716-446655440000",
      "timestamp": "2025-11-15T21:00:00.000Z",
      "source": "test-script",
      "version": "1.0"
    },
    "payload": {
      "level": "ERROR",
      "message": "Test from bash script",
      "errorCode": "TEST_ERROR"
    }
  }' | jq
echo ""
echo ""

echo -e "${BLUE}Test 3: Valid High Priority Log Event${NC}"
curl -s -X POST "$BASE_URL/v1/events" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "logging.event",
    "priority": "HIGH",
    "metadata": {
      "eventId": "660e8400-e29b-41d4-a716-446655440001",
      "timestamp": "2025-11-15T21:00:00.000Z",
      "source": "test-script",
      "version": "1.0"
    },
    "payload": {
      "level": "ERROR",
      "message": "Critical test from bash script"
    }
  }' | jq
echo ""
echo ""

echo -e "${BLUE}Test 4: Valid License Create Event${NC}"
curl -s -X POST "$BASE_URL/v1/events" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "licensing.create",
    "priority": "HIGH",
    "metadata": {
      "eventId": "770e8400-e29b-41d4-a716-446655440002",
      "timestamp": "2025-11-15T21:00:00.000Z",
      "source": "test-script",
      "version": "1.0"
    },
    "payload": {
      "licenseType": "SOFTWARE_LICENSE",
      "customerId": "CUST-TEST-123",
      "productCodes": ["premium-features"],
      "featureCodes": ["advanced-analytics"],
      "expirationDate": "2026-12-31T23:59:59.000Z",
      "email": "test@example.com",
      "xmlPayload": "<license>test</license>"
    }
  }' | jq
echo ""
echo ""

echo -e "${BLUE}Test 5: Invalid Event - Bad UUID (should fail)${NC}"
curl -s -X POST "$BASE_URL/v1/events" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "logging.event",
    "priority": "NORMAL",
    "metadata": {
      "eventId": "not-a-uuid",
      "timestamp": "2025-11-15T21:00:00.000Z",
      "source": "test-script",
      "version": "1.0"
    },
    "payload": {
      "level": "ERROR",
      "message": "This should fail"
    }
  }' | jq
echo ""
echo ""

echo -e "${BLUE}Test 6: Invalid Event - Missing message (should fail)${NC}"
curl -s -X POST "$BASE_URL/v1/events" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "logging.event",
    "priority": "NORMAL",
    "metadata": {
      "eventId": "880e8400-e29b-41d4-a716-446655440003",
      "timestamp": "2025-11-15T21:00:00.000Z",
      "source": "test-script",
      "version": "1.0"
    },
    "payload": {
      "level": "ERROR"
    }
  }' | jq
echo ""
echo ""

echo -e "${BLUE}Test 7: Sending 5 events in quick succession${NC}"
for i in {1..5}; do
  UUID=$(uuidgen 2>/dev/null || cat /proc/sys/kernel/random/uuid 2>/dev/null || echo "990e8400-e29b-41d4-a716-44665544000$i")
  echo "  Sending event $i..."
  curl -s -X POST "$BASE_URL/v1/events" \
    -H "Content-Type: application/json" \
    -d "{
      \"type\": \"logging.event\",
      \"priority\": \"NORMAL\",
      \"metadata\": {
        \"eventId\": \"$UUID\",
        \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%S.000Z)\",
        \"source\": \"test-script-batch\",
        \"version\": \"1.0\"
      },
      \"payload\": {
        \"level\": \"INFO\",
        \"message\": \"Batch test message $i\"
      }
    }" > /dev/null
done
echo -e "${GREEN}  ✓ Sent 5 events${NC}"
echo ""
echo ""

echo -e "${BLUE}Test 8: Checking Metrics${NC}"
echo "Request metrics:"
curl -s "$BASE_URL/metrics" | grep "http_requests_total"
echo ""
echo "Publish metrics:"
curl -s "$BASE_URL/metrics" | grep "queue_publish_total"
echo ""
echo "Connection status:"
curl -s "$BASE_URL/metrics" | grep "rabbitmq_connection_status"
echo ""
echo ""

echo "========================================="
echo -e "${GREEN}  Test Suite Complete!${NC}"
echo "========================================="

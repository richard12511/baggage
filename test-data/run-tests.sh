#!/bin/bash

# BAGgage API Test Script
# Runs various test scenarios against the API

BASE_URL="http://localhost:3000"
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================="
echo "  BAGgage API Test Suite"
echo "========================================="
echo ""

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}Warning: jq not found. Install with: brew install jq (macOS) or apt-get install jq (Linux)${NC}"
    echo -e "${YELLOW}Responses will be shown without formatting.${NC}"
    echo ""
    USE_JQ=false
else
    USE_JQ=true
fi

# Function to display response
display_response() {
    if [ "$USE_JQ" = true ]; then
        echo "$1" | jq
    else
        echo "$1"
    fi
}

# Function to check if server is running
check_server() {
    if ! curl -s -f "$BASE_URL/health" > /dev/null 2>&1; then
        echo -e "${RED}Error: Cannot connect to $BASE_URL${NC}"
        echo -e "${YELLOW}Make sure the server is running: npm run dev${NC}"
        exit 1
    fi
}

# Check server is running
echo -e "${BLUE}Checking if server is running...${NC}"
check_server
echo -e "${GREEN}✓ Server is responding${NC}"
echo ""

# Test 1: Health Check
echo "========================================="
echo -e "${BLUE}Test 1: Health Check${NC}"
echo "========================================="
RESPONSE=$(curl -s "$BASE_URL/health")
display_response "$RESPONSE"
echo ""

# Test 2: Valid Normal Priority Log Event
echo "========================================="
echo -e "${BLUE}Test 2: Valid Normal Priority Log Event${NC}"
echo "========================================="
RESPONSE=$(curl -s -X POST "$BASE_URL/v1/events" \
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
  }')
display_response "$RESPONSE"

# Check if success
if echo "$RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ Test passed${NC}"
else
    echo -e "${RED}✗ Test failed${NC}"
fi
echo ""

# Test 3: Valid High Priority Log Event
echo "========================================="
echo -e "${BLUE}Test 3: Valid High Priority Log Event${NC}"
echo "========================================="
RESPONSE=$(curl -s -X POST "$BASE_URL/v1/events" \
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
  }')
display_response "$RESPONSE"

if echo "$RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ Test passed${NC}"
else
    echo -e "${RED}✗ Test failed${NC}"
fi
echo ""

# Test 4: Valid License Create Event
echo "========================================="
echo -e "${BLUE}Test 4: Valid License Create Event${NC}"
echo "========================================="
RESPONSE=$(curl -s -X POST "$BASE_URL/v1/events" \
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
  }')
display_response "$RESPONSE"

if echo "$RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ Test passed${NC}"
else
    echo -e "${RED}✗ Test failed${NC}"
fi
echo ""

# Test 5: Invalid Event - Bad UUID
echo "========================================="
echo -e "${BLUE}Test 5: Invalid Event - Bad UUID (should fail)${NC}"
echo "========================================="
RESPONSE=$(curl -s -X POST "$BASE_URL/v1/events" \
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
  }')
display_response "$RESPONSE"

if echo "$RESPONSE" | grep -q '"success":false'; then
    echo -e "${GREEN}✓ Test passed (correctly rejected)${NC}"
else
    echo -e "${RED}✗ Test failed (should have been rejected)${NC}"
fi
echo ""

# Test 6: Invalid Event - Missing Required Field
echo "========================================="
echo -e "${BLUE}Test 6: Invalid Event - Missing message (should fail)${NC}"
echo "========================================="
RESPONSE=$(curl -s -X POST "$BASE_URL/v1/events" \
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
  }')
display_response "$RESPONSE"

if echo "$RESPONSE" | grep -q '"success":false'; then
    echo -e "${GREEN}✓ Test passed (correctly rejected)${NC}"
else
    echo -e "${RED}✗ Test failed (should have been rejected)${NC}"
fi
echo ""

# Test 7: Send Multiple Events
echo "========================================="
echo -e "${BLUE}Test 7: Sending 5 events in quick succession${NC}"
echo "========================================="
SUCCESS_COUNT=0
for i in {1..5}; do
  # Generate UUID (cross-platform compatible)
  if command -v uuidgen &> /dev/null; then
    UUID=$(uuidgen)
  elif [ -f /proc/sys/kernel/random/uuid ]; then
    UUID=$(cat /proc/sys/kernel/random/uuid)
  else
    UUID="990e8400-e29b-41d4-a716-44665544000$i"
  fi
  
  echo "  Sending event $i..."
  RESPONSE=$(curl -s -X POST "$BASE_URL/v1/events" \
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
    }")
  
  if echo "$RESPONSE" | grep -q '"success":true'; then
    ((SUCCESS_COUNT++))
    echo -e "    ${GREEN}✓ Event $i succeeded${NC}"
  else
    echo -e "    ${RED}✗ Event $i failed${NC}"
    echo "    Response: $RESPONSE"
  fi
done
echo -e "${GREEN}✓ Sent 5 events ($SUCCESS_COUNT succeeded)${NC}"
echo ""

# Test 8: Check Metrics
echo "========================================="
echo -e "${BLUE}Test 8: Checking Metrics${NC}"
echo "========================================="
echo ""
echo "Request metrics:"
curl -s "$BASE_URL/metrics" | grep "http_requests_total{" | head -5
echo ""
echo "Publish metrics:"
curl -s "$BASE_URL/metrics" | grep "queue_publish_total{" | head -5
echo ""
echo "Validation errors:"
curl -s "$BASE_URL/metrics" | grep "validation_errors_total"
echo ""
echo "Connection status:"
curl -s "$BASE_URL/metrics" | grep "rabbitmq_connection_status"
echo ""
echo "Retries:"
curl -s "$BASE_URL/metrics" | grep "queue_publish_retries_total"
echo ""

echo "========================================="
echo -e "${GREEN}  Test Suite Complete!${NC}"
echo "========================================="
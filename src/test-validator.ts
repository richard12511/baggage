import { validateEvent } from "./utils/validators";
import { LogLevel } from "./schemas/events";

// =============================================================================
// VALID EVENT TESTS
// =============================================================================

console.log("=== Testing Valid Log Event ===");
const validLogEvent = {
  type: "logging.event",
  priority: "NORMAL",
  metadata: {
    eventId: "550e8400-e29b-41d4-a716-446655440000",
    timestamp: new Date().toISOString(),
    source: "test-app",
    version: "1.0",
  },
  payload: {
    level: "ERROR" as const,
    message: "Test error message",
    errorCode: "TEST_ERROR",
  },
};

const result1 = validateEvent(validLogEvent);
console.log("Valid:", result1.valid);
if (!result1.valid) {
  console.log("Errors:", result1.errors);
}

// =============================================================================
// INVALID EVENT TESTS
// =============================================================================

console.log("\n=== Testing Invalid Event (bad UUID) ===");
const invalidEvent1 = {
  ...validLogEvent,
  metadata: {
    ...validLogEvent.metadata,
    eventId: "not-a-uuid",
  },
};

const result2 = validateEvent(invalidEvent1);
console.log("Valid:", result2.valid);
if (!result2.valid) {
  console.log("Errors:", result2.errors);
}

console.log("\n=== Testing Invalid Event (missing required field) ===");
const invalidEvent2 = {
  type: "logging.event",
  priority: "NORMAL",
  metadata: {
    eventId: "550e8400-e29b-41d4-a716-446655440000",
    timestamp: new Date().toISOString(),
    source: "test-app",
    version: "1.0",
  },
  payload: {
    level: "ERROR",
    // Missing required 'message' field
  },
};

const result3 = validateEvent(invalidEvent2);
console.log("Valid:", result3.valid);
if (!result3.valid) {
  console.log("Errors:", result3.errors);
}

console.log("\n=== Testing Invalid Event (wrong enum value) ===");
const invalidEvent3 = {
  ...validLogEvent,
  payload: {
    ...validLogEvent.payload,
    level: "CRITICAL", // Not in LogLevel enum
  },
};

const result4 = validateEvent(invalidEvent3);
console.log("Valid:", result4.valid);
if (!result4.valid) {
  console.log("Errors:", result4.errors);
}

console.log("\n=== Testing Invalid Event (array too short) ===");
const invalidEvent4 = {
  type: "licensing.create",
  priority: "HIGH",
  metadata: {
    eventId: "550e8400-e29b-41d4-a716-446655440000",
    timestamp: new Date().toISOString(),
    source: "test-app",
    version: "1.0",
  },
  payload: {
    licenseType: "SOFTWARE_LICENSE",
    customerId: "CUST-123",
    productCodes: [], // Empty array - should fail .min(1)
    featureCodes: ["FEATURE-1"],
    expirationDate: new Date().toISOString(),
    email: "test@example.com",
    xmlPayload: "<license></license>",
  },
};

const result5 = validateEvent(invalidEvent4);
console.log("Valid:", result5.valid);
if (!result5.valid) {
  console.log("Errors:", result5.errors);
}

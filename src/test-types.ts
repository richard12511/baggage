import {
  Event,
  EventType,
  Priority,
  LogLevel,
  LicenseType,
  EventTypeSchema,
  PrioritySchema,
  LogLevelSchema,
  LicenseTypeSchema,
} from "./schemas/events";

const logEvent: Event = {
  type: "logging.event",
  priority: "HIGH",
  metadata: {
    eventId: "550e8400-e29b-41d4-a716-446655440000",
    timestamp: new Date().toISOString(),
    source: "customer-portal",
    correlationId: "abc-123-def-456",
    version: "1.0",
  },
  payload: {
    level: "ERROR",
    message: "Failed to connect to database",
    stackTrace: "Error: ECONNREFUSED\n  at Database.connect(...)",
    errorCode: "DATABASE_CONNECTION_ERROR",
    context: {
      host: "db.example.com",
      port: 5432,
    },
  },
};

const licenseEvent: Event = {
  type: "licensing.create",
  priority: "HIGH",
  metadata: {
    eventId: "660e8400-e29b-41d4-a716-446655440001",
    timestamp: new Date().toISOString(),
    source: "admin-dashboard",
    version: "1.0",
  },
  payload: {
    licenseType: "SOFTWARE_LICENSE",
    customerId: "CUST-12345",
    productCodes: ["premium-features"],
    featureCodes: ["advanced-analytics", "api-access"],
    expirationDate: new Date(
      Date.now() + 365 * 24 * 60 * 60 * 1000
    ).toISOString(),
    email: "customer@example.com",
    xmlPayload: "<license>...</license>",
  },
};

/**
 * Function demonstrating discriminated union type narrowing
 */
function processEvent(event: Event): void {
  console.log(`Processing ${event.type} event from ${event.metadata.source}`);

  if (event.type === "logging.event") {
    console.log(`  Log level: ${event.payload.level}`);
    console.log(`  Message: ${event.payload.message}`);
    if (event.payload.errorCode) {
      console.log(`  Error code: ${event.payload.errorCode}`);
    }
  } else if (event.type === "licensing.create") {
    console.log(`  Customer: ${event.payload.customerId}`);
    console.log(`  License type: ${event.payload.licenseType}`);
    console.log(`  Products: ${event.payload.productCodes.join(", ")}`);
    console.log(`  Features: ${event.payload.featureCodes.join(", ")}`);
  } else if (event.type === "licensing.updateidentities") {
    console.log(`  Key ID: ${event.payload.keyId}`);
    console.log(`  Number of identities: ${event.payload.identities.length}`);
  }
}

// Test the function
console.log("\n=== Testing Log Event ===");
processEvent(logEvent);

console.log("\n=== Testing License Event ===");
processEvent(licenseEvent);

import {
  Event,
  EventType,
  Priority,
  LogLevel,
  LicenseType,
} from "./types/events";

const logEvent: Event = {
  type: EventType.LOG,
  priority: Priority.NORMAL,
  metadata: {
    eventId: "550e8400-e29b-41d4-a716-446655440000",
    timestamp: new Date().toISOString(),
    source: "customer-portal",
    correlationId: "abc-123-def-456",
    version: "1.0",
  },
  payload: {
    level: LogLevel.ERROR,
    message: "Failed to connect to database",
    stackTrace: "Error: ECONNREFUSED\n at Database.connect()",
    errorCode: "DATABASE_CONNECTION_ERROR",
    context: {
      host: "db.example.com",
      port: 5432,
    },
  },
};

const expirationDate = new Date();
expirationDate.setDate(expirationDate.getDate() + 30);
const licenseEvent: Event = {
  type: EventType.LICENSE_CREATE,
  priority: Priority.HIGH,
  metadata: {
    eventId: "660e8400-e29b-41d4-a716-446655440001",
    timestamp: new Date().toISOString(),
    source: "admin-dashboard",
    version: "1.0",
  },
  payload: {
    licenseType: LicenseType.CL,
    customerId: "CUST-12345",
    productCodes: ["181", "182"],
    featureCodes: ["232", "233"],
    expirationDate: expirationDate.toISOString(),
    email: "richard.schmidt@htri.net",
    xmlPayload: "<xml>Test payload</xml>",
  },
};

function processEvent(event: Event): void {
  console.log(`Processing ${event.type} event from ${event.metadata.source}`);

  if (event.type === EventType.LOG) {
    console.log(`   Log level: ${event.payload.level}`);
    console.log(`   Message: ${event.payload.message}`);
    if (event.payload.errorCode) {
      console.log(`   Error code: ${event.payload.errorCode}`);
    }
  } else if (event.type === EventType.LICENSE_CREATE) {
    console.log(`  Customer: ${event.payload.customerId}`);
    console.log(`  License type: ${event.payload.licenseType}`);
    console.log(`  Products: ${event.payload.productCodes}`);
  }
}

console.log("\n=== Testing Log Event ===");
processEvent(logEvent);

console.log("\n=== Testing License Event ===");
processEvent(licenseEvent);

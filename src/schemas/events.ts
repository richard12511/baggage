/**
 * Event Queue Schema Definitions (Zod)
 *
 * This file defines validation schemas for all event types.
 * TypeScript types are automatically inferred from these schemas.
 *
 * Single source of truth - schemas define both validation AND types.
 */
import { error } from "console";
import { success, z } from "zod";

// ==============================================================================
// ENUMS
// ==============================================================================
export const PrioritySchema = z.enum(["HIGH", "NORMAL"]);
export type Priority = z.infer<typeof PrioritySchema>;

export const EventTypeSchema = z.enum([
  "logging.event",
  "licensing.create",
  "licensing.updateidentities",
]);
export type EventType = z.infer<typeof EventTypeSchema>;

export const LogLevelSchema = z.enum(["ERROR", "WARN", "INFO", "DEBUG"]);
export type LogLevel = z.infer<typeof LogLevelSchema>;

export const LicenseTypeSchema = z.enum([
  "HARDWARE_LICENSE",
  "SOFTWARE_LICENSE",
  "CLOUD_LICENSE",
]);
export type LicenseType = z.infer<typeof LicenseTypeSchema>;

// ==============================================================================
// EVENT METADATA
// ==============================================================================
export const EventMetadataSchema = z.object({
  eventId: z.string().uuid(),
  timestamp: z.string().datetime(),
  source: z.string().min(1).max(100),
  correlationId: z.string().uuid().optional(),
  version: z.string().regex(/^\d+\.\d+$/),
  additionalContext: z.record(z.string(), z.string()).optional(),
});
export type EventMetadata = z.infer<typeof EventMetadataSchema>;

// ==============================================================================
// LOG EVENT
// ==============================================================================
export const LogEventPayloadSchema = z.object({
  level: LogLevelSchema,
  message: z.string().min(1).max(5000),
  stackTrace: z.string().max(50000).optional(),
  errorCode: z.string().max(100).optional(),
  context: z.record(z.string(), z.any()).optional(),
});
export type LogEventPayload = z.infer<typeof LogEventPayloadSchema>;

export const LogEventSchema = z.object({
  type: z.literal("logging.event"),
  priority: PrioritySchema,
  metadata: EventMetadataSchema,
  payload: LogEventPayloadSchema,
});
export type LogEvent = z.infer<typeof LogEventSchema>;

// ==============================================================================
// LICENSE CREATE EVENT
// ==============================================================================
export const LicenseCreateEventPayloadSchema = z.object({
  licenseType: LicenseTypeSchema,
  customerId: z.string().min(1).max(100),
  productCodes: z.array(z.string().min(1).max(100)).min(1),
  featureCodes: z.array(z.string().min(1).max(100)).min(1),
  expirationDate: z.string().datetime(),
  email: z.string().email(),
  xmlPayload: z.string().min(1),
});
export type LicenseCreateEventPayload = z.infer<
  typeof LicenseCreateEventPayloadSchema
>;

export const LicenseCreateEventSchema = z.object({
  type: z.literal("licensing.create"),
  priority: PrioritySchema,
  metadata: EventMetadataSchema,
  payload: LicenseCreateEventPayloadSchema,
});
export type LicenseCreateEvent = z.infer<typeof LicenseCreateEventSchema>;

// =============================================================================
// UPDATE IDENTITIES EVENT
// =============================================================================
export const ClientIdentitySchema = z.object({
  issuedTo: z.string().min(1).max(200),
  identityString: z.string().min(1).max(500),
  allowRemote: z.boolean(),
  allowDetach: z.boolean(),
  allowConcurrency: z.boolean(),
  limitTo: z.string().max(200),
  maxNumberOfAutoRegisteredMachines: z.number().int().min(0),
  expirationDate: z.string().datetime(),
});
export type ClientIdentity = z.infer<typeof ClientIdentitySchema>;

export const UpdateIdentitiesEventPayloadSchema = z.object({
  keyId: z.string().min(1).max(100),
  identities: z.array(ClientIdentitySchema).min(1),
});
export type UpdateIdentitiesEventPayload = z.infer<
  typeof UpdateIdentitiesEventPayloadSchema
>;

export const UpdateIdentitiesEventSchema = z.object({
  type: z.literal("licensing.updateidentities"),
  priority: PrioritySchema,
  metadata: EventMetadataSchema,
  payload: UpdateIdentitiesEventPayloadSchema,
});
export type UpdateIdentitiesEvent = z.infer<typeof UpdateIdentitiesEventSchema>;

export const EventSchema = z.discriminatedUnion("type", [
  LogEventSchema,
  LicenseCreateEventSchema,
  UpdateIdentitiesEventSchema,
]);
export type Event = z.infer<typeof EventSchema>;

// =============================================================================
// API REQUEST/RESPONSE TYPES
// =============================================================================
export const PushEventRequestSchema = EventSchema;
export type PushEventRequest = Event;

export const PushEventResponseSchema = z.object({
  success: z.literal(true),
  eventId: z.string().uuid(),
  message: z.string(),
});
export type PushEventResponse = z.infer<typeof PushEventResponseSchema>;

export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    field: z.string().optional(),
    details: z.any().optional(),
  }),
});
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

// =============================================================================
// VALIDATION RESULT
// =============================================================================
export type ValidationResult =
  | { valid: true }
  | { valid: false; errors: string[] };

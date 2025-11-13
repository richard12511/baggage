/**
 * Event Queue Type Definitions
 *
 * This file defines all event types, payloads, and related structures
 * for the BAGgage event queue system.
 */

export enum Priority {
  HIGH = "HIGH",
  NORMAL = "NORMAL",
}

export enum EventType {
  LOG = "logging.event",
  LICENSE_CREATE = "licensing.create",
  UPDATE_IDENTITIES = "licensing.updateidentities",
}

export enum LogLevel {
  ERROR = "ERROR",
  WARN = "WARN",
  INFO = "INFO",
  DEBUG = "DEBUG",
}

export enum LicenseType {
  HL = "HARDWARE_LICENSE",
  SL = "SOFTWARE_LICENSE",
  CL = "CLOUD_LICENSE",
}

interface EventMetadata {
  eventId: string;
  timestamp: string;
  source: string;
  correlationId?: string;
  version: string;
  additionalContext?: Record<string, string>;
}

interface BaseEvent {
  type: EventType;
  priority: Priority;
  metadata: EventMetadata;
}

interface LogEventPayload {
  level: LogLevel;
  message: string;
  stackTrace?: string;
  errorCode?: string;
  context?: Record<string, any>;
}

interface LicenseCreateEventPayload {
  licenseType: LicenseType;
  customerId: string;
  productCodes: string[];
  featureCodes: string[];
  expirationDate: string;
  email: string;
  xmlPayload: string;
}

interface ClientIdentity {
  issuedTo: string;
  identityString: string;
  allowRemote: boolean;
  allowDetach: boolean;
  allowConcurrency: boolean;
  limitTo: string;
  maxNumberOfAutoRegisteredMachines: number;
  expirationDate: string;
}

interface UpdateIdentitiesEventPayload {
  keyId: string;
  identities: ClientIdentity[];
}

interface LogEvent extends BaseEvent {
  type: EventType.LOG;
  payload: LogEventPayload;
}

interface UpdateIdentitiesEvent extends BaseEvent {
  type: EventType.UPDATE_IDENTITIES;
  payload: UpdateIdentitiesEventPayload;
}

interface LicenseCreateEvent extends BaseEvent {
  type: EventType.LICENSE_CREATE;
  payload: LicenseCreateEventPayload;
}

type Event = LogEvent | LicenseCreateEvent | UpdateIdentitiesEvent;

type PushEventRequest = Event;

interface PushEventResponse {
  success: true;
  eventId: string;
  message: string;
}

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    field?: string; //Which field caused the error
    details?: any;
  };
}

interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

export type {
  // Core event types
  Event,
  BaseEvent,
  LogEvent,
  LicenseCreateEvent,
  UpdateIdentitiesEvent,

  // Payload types
  LogEventPayload,
  LicenseCreateEventPayload,
  UpdateIdentitiesEventPayload,
  ClientIdentity,
  EventMetadata,

  // API types
  PushEventRequest,
  PushEventResponse,
  ErrorResponse,
  ValidationResult,
};

// export type {
//   Event,
//   LogEvent,
//   LicenseCreateEvent,
//   UpdateIdentitiesEvent,
//   LogEventPayload,
//   LicenseCreateEventPayload,
//   ClientIdentity,
//   UpdateIdentitiesEventPayload,
//   EventMetadata,
//   PushEventRequest,
//   PushEventResponse,
//   ErrorResponse,
//   ValidationResult,
// };

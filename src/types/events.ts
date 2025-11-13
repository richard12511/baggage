export enum Priority {
  HIGH = "HIGH",
  NORMAL = "NORMAL",
}

interface EventMetadata {
  eventId: string;
  timestamp: string;
  source: string;
  correlationId?: string;
  version: string;
  payload:
    | LogEventPayload
    | LicenseCreateEventPayload
    | UpdateIdentitiesEventPayload;
  additionalContext?: Record<string, string>;
}

export enum EventType {
  LOG = "logging.event",
  LICENSE_CREATE = "licensingcreate.event",
}

interface BaseEvent {
  type: EventType;
  priority: Priority;
  metadata: EventMetadata;
}

export enum LogLevel {
  ERROR = "ERROR",
  WARN = "WARN",
  INFO = "INFO",
  DEBUG = "DEBUG",
}

interface LogEventPayload {
  level: LogLevel;
  message: string;
  stackTrace?: string;
  errorCode: string;
  context?: Record<string, any>;
}

export enum LicenseType {
  HL = "HARDWARE_LICENSE",
  SL = "SOFTWARE_LICENSE",
  CL = "CLOUD_LICENSE",
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

interface LicenseCreateEvent extends BaseEvent {
  type: EventType.LICENSE_CREATE;
  payload: LicenseCreateEventPayload;
}

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
  Event,
  LogEvent,
  LicenseCreateEvent,
  LogEventPayload,
  LicenseCreateEventPayload,
  ClientIdentity,
  UpdateIdentitiesEventPayload,
  EventMetadata,
  PushEventRequest,
  PushEventResponse,
  ErrorResponse,
  ValidationResult,
};

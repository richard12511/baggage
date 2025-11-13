export enum Priority {
  HIGH = "HIGH",
  NORMAL = "NORMAL",
}

export interface EventMetadata {
  /**
   * Unique id for this event
   * Used for deduplication and idempotency checks
   */
  eventId: string;

  /**
   * ISO 8601 timestamp
   * Format "2025-11-13T15:30:00.000Z"
   */
  timestamp: string;

  /**
   * Name of the application that produced this event
   */
  source: string;

  /**
   * Correlation ID for tracing related events across services
   */
  correlationId?: string;

  /**
   * Schema version for this event type
   */
  version: string;

  /**
   * Optional key-value pairs for additional context
   */
  additionalContext?: Record<string, string>;
}

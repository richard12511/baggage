import { EventSchema, ValidationResult } from "../schemas/events";

export function validateEvent(event: unknown): ValidationResult {
  const result = EventSchema.safeParse(event);

  if (!result.success) {
    const errors = result.error.issues.map((issue) => {
      const path = issue.path.join(".");
      return path ? `${path}: ${issue.message}` : issue.message;
    });

    return {
      valid: false,
      errors,
    };
  }

  return {
    valid: true,
  };
}

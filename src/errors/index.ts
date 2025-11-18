import { AppError } from "./AppError";
import {
  VALIDATION_ERROR,
  AUTHENTICATION_ERROR,
  AUTHORIZATION_ERROR,
  NOT_FOUND_ERROR,
  RATE_LIMIT_ERROR,
  INTERNAL_ERROR,
  SERVICE_UNAVAILABLE_ERROR,
} from "./strConsts";

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, VALIDATION_ERROR, true, details);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 401, AUTHENTICATION_ERROR, true, details);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 403, AUTHORIZATION_ERROR, true, details);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 404, NOT_FOUND_ERROR, true, details);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 429, RATE_LIMIT_ERROR, true, details);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class InternalError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 500, INTERNAL_ERROR, true, details);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 503, SERVICE_UNAVAILABLE_ERROR, true, details);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export { AppError };

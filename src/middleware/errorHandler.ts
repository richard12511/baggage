import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors";
import { metricsService } from "../services/metrics.service";
import {
  AUTHENTICATION_ERROR,
  AUTHORIZATION_ERROR,
  INTERNAL_ERROR,
  INVALID_JSON,
  NOT_FOUND_ERROR,
  VALIDATION_ERROR,
} from "../errors/strConsts";
import { ZodError } from "zod";
import { RequestWithId } from "./requestId";

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    requestId?: string;
    timestamp: string;
    stack?: string;
    originalError?: Error;
  };
}

function isOperational(error: any): error is AppError {
  return error instanceof AppError && error.isOperational;
}

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const requestId = (req as RequestWithId).requestId || "Unknown";
  console.error(`${requestId} Error caught by global handler:`);
  console.error(`${requestId} Message: ${err.message}`);
  console.error(`${requestId} Stack: ${err.stack}`);

  if (err instanceof AppError && err.originalError) {
    console.error(`${requestId} Inside Error Handler. Original Error:`);
    console.error(`${requestId} Message: ${err.originalError.message}`);
    console.error(`${requestId} Stack: ${err.originalError.stack}`);
  }

  let statusCode = 500;
  let errorCode = INTERNAL_ERROR;
  let details: any = undefined;

  if (isOperational(err)) {
    statusCode = err.statusCode;
    errorCode = err.code;
    details = err.details;
  } else if (err.name === "ValidationError" || err instanceof ZodError) {
    statusCode = 400;
    errorCode = VALIDATION_ERROR;
  } else if (err.name === "UnauthorizedError") {
    statusCode = 401;
    errorCode = AUTHENTICATION_ERROR;
  } else if (err.name === "SyntaxError" && err.message.includes("JSON")) {
    statusCode = 400;
    errorCode = INVALID_JSON;
    details = "Request body contains invalid json";
  }

  // metricsService.httpRequestsTotal.inc({
  //   method: req.method,
  //   path: req.path,
  //   status: statusCode.toString(),
  // });

  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      code: errorCode,
      requestId: requestId,
      message: err.message || "An unexpected error occurred",
      timestamp: new Date().toISOString(),
    },
  };

  if (details !== undefined) {
    errorResponse.error.details = details;
  }

  if (err instanceof AppError && err.originalError) {
    errorResponse.error.originalError = err.originalError;
  }

  if (process.env.NODE_ENV === "development") {
    errorResponse.error.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
}

export function notFoundHandler(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const requestId = (req as RequestWithId).requestId || "Unknown";

  const error: ErrorResponse = {
    success: false,
    error: {
      code: NOT_FOUND_ERROR,
      requestId: requestId,
      message: `Route ${req.method} ${req.path} not found`,
      timestamp: new Date().toISOString(),
    },
  };

  res.status(404).json(error);
}

import { stat } from "fs";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: any;
  public readonly originalError?: Error;

  constructor(
    message: string,
    statusCode: number,
    code: string,
    isOperational = true,
    details?: any,
    originalError?: any
  ) {
    super(message);

    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;
    this.originalError = originalError;

    Error.captureStackTrace(this, this.constructor);

    //Not entirely sure why I had to add this, but TS apparently needs it.
    //const error = new ValidationError("ex input")
    //console.log(error instanceof ValidationError) //this returns false without this setPrototypeOf call
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

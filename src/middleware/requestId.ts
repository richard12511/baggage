import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";

export interface RequestWithId extends Request {
  requestId: string;
}

export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const requestId = `req_${randomUUID}`;
  (req as RequestWithId).requestId = requestId;
  res.setHeader("X-Request-ID", requestId);

  next();
}

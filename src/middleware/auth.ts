import { NextFunction, Request, Response } from "express";
import crypto from "crypto";
import { success } from "zod";

interface AuthenticatedRequest extends Request {
  apiKey?: string;
}

function getValidApiKeys(): Set<string> {
  const apiKeysEnv = process.env.API_KEYS || "";
  const keys = apiKeysEnv
    .split(",")
    .map((key) => key.trim())
    .filter((key) => key.length > 0);

  if (keys.length === 0) {
    console.warn("No API keys configured");
  }

  return new Set(keys);
}

const validApiKeys = getValidApiKeys();

function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  try {
    const eq = crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
    return eq;
  } catch {
    return false;
  }
}

export function requireApiKey(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({
      success: false,
      error: {
        code: "MISSING_API_KEY",
        message: "Authorization header is required",
        details: "Include 'Authorization: Bearer <api-key>' header",
      },
    });
    return;
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    res.status(401).json({
      success: false,
      error: {
        code: "INVALID_AUTH_FORMAT",
        message: "Auth header must be Bearer type",
        details: "Include 'Authorization: Bearer <api-key>' header",
      },
    });
    return;
  }

  const authKey = parts[1];
  let isValid = false;

  for (const validKey of validApiKeys) {
    if (secureCompare(authKey, validKey)) {
      isValid = true;
      console.log("We found a valid key");
      break;
    }
  }

  if (!isValid) {
    console.warn(`Invalid API key attempt from ${req.ip}`);
    res.status(401).json({
      success: false,
      error: {
        code: "INVALID_API_KEY",
        message: "Could not find a valid api key",
        details: "Please include a valid api key",
      },
    });
    return;
  }

  req.apiKey = authKey;
  next();
}

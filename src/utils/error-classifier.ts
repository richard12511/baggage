export function isTransientError(error: any): boolean {
  if (!error) {
    return false;
  }

  if (error.code === "ECONNREFUSED") return true; // rabbitMQ not accepting connections
  if (error.code === "ECONNRESET") return true; // Connection reset by peer
  if (error.code === "ETIMEDOUT") return true; // Connection timeout
  if (error.code === "ENOTFOUND") return true; // DNS lookup failed
  if (error.code === "ENETUNREACH") return true; // Network unreachable

  //Below are RabbitMQ specific errors that are probably transient
  if (error.message?.includes("Channel closed")) return true;
  if (error.message?.includes("Connection closed")) return true;
  if (error.message?.includes("Socket closed")) return true;

  return false;
}

export function isPermanentError(error: any): boolean {
  if (error.code === 403) return true; //ACCESS_REFUSED
  if (error.message?.includes("ACCESS_REFUSED")) return true;
  if (error.message?.includes("authentication")) return true;

  //It will contain 'Invalid' if it fails Zod validation, which is a permanent problem
  if (error.message?.includes("Invalid")) return true;

  return false;
}

export function getErrorMessage(error: any): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Unknown error";
}

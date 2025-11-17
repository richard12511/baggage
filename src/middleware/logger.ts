import { Request, Response, NextFunction } from "express";
import { metricsService } from "../services/metrics.service";

export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = Date.now();
  const durationTimer = metricsService.httpRequestDuration.startTimer();

  console.log(`${req.method} ${req.path}`);

  res.on("finish", () => {
    const duration = Date.now() - start;
    const statusColor = res.statusCode >= 400 ? "🔴" : "🟢";
    console.log(
      `${statusColor} ${req.method} ${req.path} - ${res.statusCode} ${duration}ms`
    );

    metricsService.httpRequestsTotal.inc({
      method: req.method,
      path: req.path,
      status: res.statusCode.toString(),
    });

    durationTimer({
      method: req.method,
      path: req.path,
    });
  });

  next();
}

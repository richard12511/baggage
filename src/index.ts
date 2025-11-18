import "./config/env";

import express, { Request, Response } from "express";
import helmet from "helmet";
import cors from "cors";
import eventRoutes from "./routes/events";
import { queueService } from "./services/queue.service";
import { consumerService } from "./services/consumer.service";
import { metricsService } from "./services/metrics.service";
import { requestLogger } from "./middleware/logger";
import { optionalApiKey, requireApiKey } from "./middleware/auth";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { setupProcessErrorHandlers } from "./utils/processErrorHandlers";

const app = express();
const PORT = process.env.PORT || 3000;

setupProcessErrorHandlers();

//Middleware
app.use(helmet()); //Security headers
app.use(cors());
app.use(express.json()); //Parse JSON request bodies
app.use(requestLogger);

app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "baggage",
  });
});

app.get("/test-error", async (req, res) => {
  await new Promise((resolve) => setTimeout(resolve, 100));
  throw new Error("Test async error");
});

app.get("/metrics", optionalApiKey, (req: Request, res: Response) => {
  metricsService.getMetrics(req, res);
});

app.use("/v1", requireApiKey, eventRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

async function startServer() {
  try {
    await queueService.connect();
    await consumerService.connect();
    await consumerService.startConsuming();
    app.listen(PORT, () => {
      console.log(`BAGgage event queue running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`Event endpoints at: http://localhost:${PORT}/v1/events`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

async function gracefulShutdown(signal: string): Promise<void> {
  console.log(`${signal} received, shutting down gracefully`);

  const shutdownTimeout = setTimeout(() => {
    console.error("Shutdown timeout - forcing exit");
    process.exit(1);
  }, 10000);

  try {
    await consumerService.disconnect();
  } catch (error) {
    console.error("Non-fatal error during consumer shutdown:", error);
  }

  try {
    await queueService.disconnect();
  } catch (error) {
    console.error("Non-fatal error during queue shutdown:", error);
  }

  clearTimeout(shutdownTimeout);
  console.log("Graceful shutdown complete");
  process.exit(0);
}
startServer();

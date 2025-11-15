import express, { Request, Response } from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import eventRoutes from "./routes/events";
import { queueService } from "./services/queue.service";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

//Middleware
app.use(helmet()); //Security headers
app.use(cors());
app.use(express.json()); //Parse JSON request bodies

app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "baggage",
  });
});

app.use("/v1", eventRoutes);

async function startServer() {
  try {
    await queueService.connect();
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

process.on("SIGTERM", async () => {
  console.log("SIGTERM received, disconnecting from queue and shutting down");
  await queueService.disconnect();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, disconnecting from queue and shutting down");
  await queueService.disconnect();
  process.exit(0);
});

startServer();

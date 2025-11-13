import express, { Request, Response } from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";

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

app.listen(PORT, () => {
  console.log(`BAGgage event queue running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

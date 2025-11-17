import { Request, Response } from "express";
import client from "prom-client";

class MetricsService {
  private register: client.Registry;

  public httpRequestsTotal: client.Counter<string>;
  public httpRequestDuration: client.Histogram<string>;

  public validationErrorsTotal: client.Counter<string>;

  public queuePublishTotal: client.Counter<string>;
  public queuePublishDuration: client.Histogram<string>;
  public queuePublishRetriesTotal: client.Counter<string>;

  public rabbitmqConnectionStatus: client.Gauge<string>;
  public rabbitmqReconnectionsTotal: client.Counter<string>;

  public authAttemptsTotal: client.Counter<string>;

  constructor() {
    this.register = new client.Registry();
    client.collectDefaultMetrics({ register: this.register });

    this.httpRequestsTotal = new client.Counter({
      name: "http_requests_total",
      help: "Total number of HTTP requests",
      labelNames: ["method", "path", "status"],
      registers: [this.register],
    });

    this.httpRequestDuration = new client.Histogram({
      name: "http_requests_duration_seconeds",
      help: "Duration of HTTP requests in seconds",
      labelNames: ["method", "path"],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.register],
    });

    this.validationErrorsTotal = new client.Counter({
      name: "validation_errors_total",
      help: "Total number of validation errors",
      labelNames: ["event_type"],
      registers: [this.register],
    });

    this.queuePublishTotal = new client.Counter({
      name: "queue_publish_total",
      help: "Total number of queue publish attempts",
      labelNames: ["status", "event_type", "priority"],
      registers: [this.register],
    });

    this.queuePublishDuration = new client.Histogram({
      name: "queue_publish_duration_seconds",
      help: "Duration of queue publish operations in seconds",
      labelNames: ["event_type", "priority"],
      buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
      registers: [this.register],
    });

    this.queuePublishRetriesTotal = new client.Counter({
      name: "queue_publish_retries_total",
      help: "Total number of queue publish retry attempts",
      labelNames: ["event_type"],
      registers: [this.register],
    });

    // Connection Metrics
    this.rabbitmqConnectionStatus = new client.Gauge({
      name: "rabbitmq_connection_status",
      help: "RabbitMQ connection status (1 = connected, 0 = disconnected)",
      registers: [this.register],
    });

    this.rabbitmqReconnectionsTotal = new client.Counter({
      name: "rabbitmq_reconnections_total",
      help: "Total number of RabbitMQ reconnection attempts",
      registers: [this.register],
    });

    //Auth metrics
    this.authAttemptsTotal = new client.Counter({
      name: "auth_attempts_total",
      help: "Total number of authorization attempts",
      labelNames: ["event_type", "status"],
      registers: [this.register],
    });
  }

  async getMetrics(req: Request, res: Response): Promise<void> {
    try {
      res.set("Content-Type", this.register.contentType);
      const metrics = await this.register.metrics();
      console.log("This is what metrics looks like, metrics:", metrics);
      res.end(metrics);
    } catch (error) {
      res.status(500).end("Error collecting metrics");
    }
  }

  getRegister(): client.Registry {
    return this.register;
  }
}

export const metricsService = new MetricsService();

import amqp, { ChannelModel, Channel } from "amqplib";
import { Event, Priority } from "../schemas/events";
import retry from "async-retry";
import {
  publishRetryConfig,
  connectionRetryConfig,
} from "../config/retry.config";
import {
  isTransientError,
  isPermanentError,
  getErrorMessage,
} from "../utils/error-classifier";

class QueueService {
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;
  private readonly url: string;
  private readonly highPriorityQueue: string;
  private readonly normalPriorityQueue: string;
  private readonly deadLetterQueue: string;
  private isConnecting: boolean = false;

  constructor() {
    this.url = process.env.RABBITMQ_URL || "amqp://localhost:5672";
    console.log("🔍 RabbitMQ URL being used:", this.url);
    this.highPriorityQueue =
      process.env.RABBITMQ_HIGH_PRIORITY_QUEUE || "events-high-priority";
    this.normalPriorityQueue =
      process.env.RABBITMQ_NORMAL_PRIORITY_QUEUE || "events-normal-priority";
    this.deadLetterQueue =
      process.env.RABBITMQ_DEAD_LETTER_QUEUE || "events-dead-letter";
  }

  async connect(): Promise<void> {
    await retry(async (bail) => {
      try {
        console.log("Connecting to baggage queue");
        this.connection = await amqp.connect(this.url);
        console.log("Connected to RabbitMQ");
        this.channel = await this.connection.createChannel();
        await this.setupQueues();

        this.connection.on("error", (err) => {
          console.error("RabbitMQ connection error:", err);
        });

        this.connection.on("close", () => {
          console.log("RabbitMQ connetion closed");
          this.connection = null;
          this.channel = null;
        });
      } catch (error) {
        if (isPermanentError(error)) {
          console.error(
            "Permanent error connecting to RabbitMQ:",
            getErrorMessage(error)
          );
          bail(error as Error);
          return;
        }

        console.warn(
          "Transient error connecting to RabbitMQ, will retry:",
          getErrorMessage(error)
        );
        throw error;
      }
    }, connectionRetryConfig);
  }

  async publishEvent(event: Event): Promise<void> {
    await retry(async (bail) => {
      try {
        await this.ensureConnection();

        if (!this.channel) {
          throw new Error("Channel not available after reconnection attempt");
        }

        const queueName =
          event.priority === "HIGH"
            ? this.highPriorityQueue
            : this.normalPriorityQueue;

        const messageBuffer = Buffer.from(JSON.stringify(event));

        const sent = this.channel.sendToQueue(queueName, messageBuffer, {
          persistent: true,
          contentType: "application/json",
          timestamp: Date.now(),
          messageId: event.metadata.eventId,
        });

        if (!sent) {
          throw new Error("Failed to send message to queue");
        }

        console.log(`Published ${event.type} event to ${queueName}`);
        console.log(`Event ID: ${event.metadata.eventId}`);
      } catch (error) {
        if (isPermanentError(error)) {
          console.error(
            "Permanent error publishing event:",
            getErrorMessage(error)
          );
          bail(error as Error);
          return;
        }

        if (isTransientError(error)) {
          console.warn(
            "Transient error publishing event, will retry:",
            getErrorMessage(error)
          );
          this.connection = null;
          this.channel = null;
          throw error;
        }

        console.warn(
          "Unknown error publishing event, will retry",
          getErrorMessage(error)
        );
        throw error;
      }
    }, publishRetryConfig);
  }

  async disconnect(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
        console.log("Channel closed");
      }

      if (this.connection) {
        await this.connection.close();
        console.log("Connection closed");
      }
    } catch (error) {
      console.error("Error closing RabbitMQ connection:", error);
      throw error;
    }
  }

  private async setupQueues(): Promise<void> {
    if (!this.channel) {
      throw new Error("Channel not initialized");
    }

    //Create the dead letter exchange
    await this.channel.assertExchange("dlx", "direct", { durable: true });

    //Create the dead letter queue
    await this.channel.assertQueue(this.deadLetterQueue, { durable: true });

    //Bind the dead letter queue to the exchange
    await this.channel.bindQueue(this.deadLetterQueue, "dlx", "dead-letter");

    await this.channel.assertQueue(this.highPriorityQueue, {
      durable: true,
      deadLetterExchange: "dlx",
      deadLetterRoutingKey: "dead-letter",
    });

    await this.channel.assertQueue(this.normalPriorityQueue, {
      durable: true,
      deadLetterExchange: "dlx",
      deadLetterRoutingKey: "dead-letter",
    });

    console.log("Finished setting up queues");
  }

  private async ensureConnection(): Promise<void> {
    if (this.connection && this.channel) {
      return;
    }

    //Prevents concurrent reconnection attempts
    if (this.isConnecting) {
      while (this.isConnecting) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      return;
    }

    this.isConnecting = true;
    try {
      await this.connect();
    } finally {
      this.isConnecting = false;
    }
  }
}

//Singleton
export const queueService = new QueueService();

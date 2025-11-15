import amqp, { ChannelModel, Channel } from "amqplib";
import { Event, Priority } from "../schemas/events";

class QueueService {
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;
  private readonly url: string;
  private readonly highPriorityQueue: string;
  private readonly normalPriorityQueue: string;
  private readonly deadLetterQueue: string;

  constructor() {
    this.url = process.env.RABBITMQ_URL || "amqp://localhost:5672";
    this.highPriorityQueue =
      process.env.RABBITMQ_HIGH_PRIORITY_QUEUE || "events-high-priority";
    this.normalPriorityQueue =
      process.env.RABBITMQ_NORMAL_PRIORITY_QUEUE || "events-normal-priority";
    this.deadLetterQueue =
      process.env.RABBITMQ_DEAD_LETTER_QUEUE || "events-dead-letter";
  }

  async connect(): Promise<void> {
    try {
      console.log("Connecting to RabbitMQ...");

      this.connection = await amqp.connect(this.url);
      console.log("Connected to RabbitMQ");

      this.channel = await this.connection.createChannel();
      console.log("Channel created");

      await this.setupQueues();
      console.log("Queues configured");

      this.connection.on("error", (err) => {
        console.error("RabbitMQ connection error:", err);
      });
      this.connection.on("close", () => {
        console.log("RabbitMQ connection closed");
      });
    } catch (error) {
      console.error("Failed to connect to RabbitMQ:", error);
      throw error;
    }
  }

  async publishEvent(event: Event): Promise<void> {
    if (!this.channel) {
      throw new Error("Channel not initialized. Call connect() first.");
    }

    const queueName =
      event.priority === "HIGH"
        ? this.highPriorityQueue
        : this.normalPriorityQueue;

    //Convert event to buffer
    const msgBuffer = Buffer.from(JSON.stringify(event));

    //Publish to queue
    const sent = this.channel.sendToQueue(queueName, msgBuffer, {
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
}

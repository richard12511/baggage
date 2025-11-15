// import amqp, { Channel, ConsumeMessage, ChannelModel } from "amqplib";
import amqp, { ChannelModel, Channel, ConsumeMessage } from "amqplib";
import { Event, EventSchema } from "../schemas/events";

class ConsumerService {
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;
  private readonly url: string;
  private readonly highPriorityQueue: string;
  private readonly normalPriorityQueue: string;

  constructor() {
    this.url = process.env.RABBITMQ_URL || "amqp://localhost:5672";
    this.highPriorityQueue =
      process.env.RABBITMQ_HIGH_PRIORITY_QUEUE || "events-high-priority";
    this.normalPriorityQueue =
      process.env.RABBITMQ_NORMAL_PRIORITY_QUEUE || "events-normal-priority";
  }

  async connect(): Promise<void> {
    try {
      console.log("Consumer connecting to RabbitMQ...");
      this.connection = await amqp.connect(this.url);
      console.log("Consumer connected to RabbitMQ");

      this.channel = await this.connection.createChannel();
      console.log("Consumer channel created");

      //Setting prefetch tells it how many messages to consume at once
      await this.channel.prefetch(1);

      this.connection.on("error", (err) => {
        console.error("Consumer RabbitMQ connection error:", err);
      });

      this.connection.on("close", () => {
        console.log("Consumer connection closed");
      });
    } catch (error) {
      console.error("Consumer failed to connect to RabbitMQ:", error);
      throw error;
    }
  }

  async startConsuming(): Promise<void> {
    await this.startConsumingQueue(this.highPriorityQueue);
    await this.startConsumingQueue(this.normalPriorityQueue);

    console.log("Consumer service started");
  }

  private async startConsumingQueue(queueName: string): Promise<void> {
    if (!this.channel) {
      console.log("Channel not initialized yet");
      throw new Error("Channel not initialized");
    }

    await this.channel.consume(
      queueName,
      async (msg: ConsumeMessage | null) => {
        if (!msg) {
          console.warn("msg is null");
          return;
        }

        try {
          const content = msg.content.toString();
          const eventData = JSON.parse(content);

          const parseResult = EventSchema.safeParse(eventData);
          if (!parseResult.success) {
            console.log(
              "Invalid eventData structure. Failed Zod safeParse. Errors:",
              parseResult.error,
              parseResult.error.issues
            );
            this.channel?.nack(msg, false, false);
            return;
          }

          const event = parseResult.data;
          await this.processEvent(event);

          this.channel?.ack(msg);
        } catch (error) {
          console.log("Error processing message:", error);
          this.channel?.nack(msg, false, false);
        }
      }
    );
  }

  private async processEvent(event: Event): Promise<void> {
    console.log(
      `Consumer processing Event ID: ${event.metadata.eventId}, Type: ${event.type} event, Priority: ${event.priority}, Source: ${event.metadata.source}`
    );

    if (event.type === "logging.event") {
      await this.processLogEvent(event);
    } else if (event.type === "licensing.create") {
      await this.processLicenseCreateEvent(event);
    } else if (event.type === "licensing.updateidentities") {
      await this.processUpdateIdentitiesEvent(event);
    }
  }

  private async processLogEvent(
    event: Event & { type: "logging.event" }
  ): Promise<void> {
    const { payload } = event;

    console.log(`Log Level: ${payload.level}\nMessage: ${payload.message}`);

    if (payload.errorCode) {
      console.log(`Error Code: ${payload.errorCode}`);
    }

    if (payload.stackTrace) {
      console.log(`Stack Trace: ${payload.stackTrace}`);
    }
  }

  private async processLicenseCreateEvent(
    event: Event & { type: "licensing.create" }
  ): Promise<void> {
    const { payload } = event;

    console.log(`   License Type: ${payload.licenseType}`);
    console.log(`   Customer ID: ${payload.customerId}`);
    console.log(`   Products: ${payload.productCodes.join(", ")}`);
    console.log(`   Features: ${payload.featureCodes.join(", ")}`);
    console.log(`   Email: ${payload.email}`);
  }

  private async processUpdateIdentitiesEvent(
    event: Event & { type: "licensing.updateidentities" }
  ): Promise<void> {
    const { payload } = event;

    console.log(`   Key ID: ${payload.keyId}`);
    console.log(`   Identities: ${payload.identities.length}`);

    payload.identities.forEach((identity, index) => {
      console.log(`   Identity ${index + 1}:`);
      console.log(`     Issued To: ${identity.issuedTo}`);
      console.log(`     Identity String: ${identity.identityString}`);
    });
  }
}

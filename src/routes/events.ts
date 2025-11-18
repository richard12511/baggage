import e, { Router, Request, Response } from "express";
import { validateEvent } from "../utils/validators";
import { Event, PushEventResponse, ErrorResponse } from "../schemas/events";
import { queueService } from "../services/queue.service";
import { metricsService } from "../services/metrics.service";
import { RequestWithId } from "../middleware/requestId";

const router = Router();

router.post("/events", async (req: Request, res: Response) => {
  const requestId = (req as RequestWithId).requestId || "Unknown";

  try {
    const validationResult = validateEvent(req.body);
    if (!validationResult.valid) {
      const eventType = req.body.type || "unknown";
      metricsService.validationErrorsTotal.inc({ event_type: eventType });
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Event validation failed",
          details: validationResult.errors,
        },
      };

      return res.status(400).json(errorResponse);
    }

    const event = req.body as Event;
    const publishTimer = metricsService.queuePublishDuration.startTimer();

    try {
      console.log(`${requestId} Publishing event ${event.metadata.eventId}`);
      await queueService.publishEvent(event);

      metricsService.queuePublishTotal.inc({
        status: "success",
        event_type: event.type,
        priority: event.priority,
      });

      publishTimer({ event_type: event.type, priority: event.priority });
    } catch (publishError) {
      metricsService.queuePublishTotal.inc({
        status: "failure",
        event_type: event.type,
        priority: event.priority,
      });

      publishTimer({ event_type: event.type, priority: event.priority });

      console.error(
        `${requestId} Failed to publish event after retries:`,
        publishError
      );
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: "QUEUE_UNAVAILABLE",
          message: "Unable to queue event. Please try again later.",
          requestId: requestId,
          details:
            publishError instanceof Error
              ? publishError.message
              : "Unknown error",
        },
      };

      return res.status(503).json(errorResponse);
    }

    const successResponse: PushEventResponse = {
      success: true,
      eventId: event.metadata.eventId,
      requestId: requestId,
      message: "Event accepted and queued for processing",
    };

    return res.status(202).json(successResponse);
  } catch (error) {
    console.error(`${requestId} Error processing event:`, error);

    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred while processing the event",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    };

    return res.status(500).json(errorResponse);
  }
});

export default router;

import e, { Router, Request, Response } from "express";
import { validateEvent } from "../utils/validators";
import { Event, PushEventResponse, ErrorResponse } from "../schemas/events";
import { queueService } from "../services/queue.service";
import { metricsService } from "../services/metrics.service";
import { RequestWithId } from "../middleware/requestId";
import { ServiceUnavailableError, ValidationError } from "../errors";

const router = Router();

router.post("/events", async (req: Request, res: Response) => {
  const requestId = (req as RequestWithId).requestId || "unknown";

  const validationResult = validateEvent(req.body);
  if (!validationResult.valid) {
    const eventType = req.body.type || "unknown";
    metricsService.validationErrorsTotal.inc({ event_type: eventType });

    throw new ValidationError(
      "Event validation failed",
      validationResult.errors
    );
  }

  const event = req.body as Event;
  const publishTimer = metricsService.queuePublishDuration.startTimer();

  try {
    console.log(`[${requestId}] Publishing event ${event.metadata.eventId}`);
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

    console.error(`[${requestId}] Failed to publish event:`, publishError);

    throw new ServiceUnavailableError(
      "Unable to queue event. Please try again later.",
      { eventType: event.type },
      publishError as Error
    );
  }

  const successResponse: PushEventResponse = {
    success: true,
    eventId: event.metadata.eventId,
    message: "Event accepted and queued for processing",
    requestId: requestId,
  };

  return res.status(202).json(successResponse);
});

export default router;

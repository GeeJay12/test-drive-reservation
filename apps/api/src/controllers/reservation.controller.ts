import type { Request, Response } from "express";
import { ConflictError, ValidationError } from "../lib/errors.js";
import { IdempotencyService } from "../services/idempotency.service.js";
import { ReservationService } from "../services/reservation.service.js";
import { validateCompleteReservationRequest, validateCreateReservationRequest } from "../validators/reservation.validator.js";

export class ReservationController {
  constructor(
    private readonly reservationService = new ReservationService(),
    private readonly idempotencyService = new IdempotencyService(),
  ) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const idempotencyKey = String(req.header("idempotency-key") ?? "").trim();
    if (!idempotencyKey) {
      throw new ValidationError("idempotency-key header is required");
    }

    const payload = validateCreateReservationRequest(req.body);
    const fingerprint = this.idempotencyService.buildFingerprint(payload);
    const idemState = await this.idempotencyService.assertAndRegisterInProgress({
      key: idempotencyKey,
      fingerprint,
    });

    if (idemState.replay) {
      res.status(idemState.responseCode).json(idemState.responseBody);
      return;
    }

    try {
      const created = await this.reservationService.createReservation(payload);
      const responseBody = {
        reservationId: created.id.toString(),
        vehicleId: created.vehicleId,
        status: created.status,
        startTime: created.startTime.toISOString(),
        endTime: created.endTime.toISOString(),
      };
      await this.idempotencyService.markCompleted(idempotencyKey, created.id, responseBody);
      res.status(201).json(responseBody);
    } catch (error: unknown) {
      if (error instanceof ConflictError) {
        await this.idempotencyService.markFailed(idempotencyKey, error.statusCode, {
          error: error.code,
          message: error.message,
          details: error.details,
        });
      }
      throw error;
    }
  };

  complete = async (req: Request, res: Response): Promise<void> => {
    const payload = validateCompleteReservationRequest(req.body);
    const updated = await this.reservationService.completeReservation(payload.reservationId);
    res.status(200).json({
      reservationId: updated.id.toString(),
      status: updated.status,
    });
  };
}

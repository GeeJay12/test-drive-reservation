import type { Request, Response } from "express";
import { ConflictError, ValidationError } from "../lib/errors.js";
import { ReservationService } from "../services/reservation.service.js";
import { validateCompleteReservationRequest, validateCreateReservationRequest } from "../validators/reservation.validator.js";

export class ReservationController {
  constructor(
    private readonly reservationService = new ReservationService(),
  ) {}

  create = async (req: Request, res: Response): Promise<void> => {

    const payload = validateCreateReservationRequest(req.body);

    try {
      const created = await this.reservationService.createReservation(payload);
      const responseBody = {
        reservationId: created.id.toString(),
        vehicleId: created.vehicleId,
        status: created.status,
        startTime: created.startTime.toISOString(),
        endTime: created.endTime.toISOString(),
      };
      res.status(201).json(responseBody);
    } catch (error: unknown) {
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

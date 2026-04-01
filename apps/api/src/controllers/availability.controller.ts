import type { Request, Response } from "express";
import { AvailabilityService } from "../services/availability.service.js";
import { validateAvailabilityRequest } from "../validators/availability.validator.js";

export class AvailabilityController {
  constructor(private readonly service = new AvailabilityService()) {}

  check = async (req: Request, res: Response): Promise<void> => {
    const payload = validateAvailabilityRequest(req.body);
    const result = await this.service.checkAvailability(payload);
    res.status(200).json(result);
  };
}

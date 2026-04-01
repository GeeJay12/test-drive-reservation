import { Router } from "express";
import { AvailabilityController } from "../controllers/availability.controller.js";

const router = Router();
const controller = new AvailabilityController();

router.post("/check", controller.check);

export { router as availabilityRoutes };

import { Router } from "express";
import { ReservationController } from "../controllers/reservation.controller.js";

const router = Router();
const controller = new ReservationController();

router.post("/create", controller.create);

// beyond the scope
router.post("/complete", controller.complete);

export { router as reservationRoutes };

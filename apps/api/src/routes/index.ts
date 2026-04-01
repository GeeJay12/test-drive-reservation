import { Router } from "express";
import { availabilityRoutes } from "./availability.routes.js";
import { reservationRoutes } from "./reservation.routes.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

router.use("/availability", availabilityRoutes);
router.use("/reservations", reservationRoutes);

export { router as apiRoutes };

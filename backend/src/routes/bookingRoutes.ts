// Maps booking URLs to controller functions.
import { Router } from "express";
import type { createBookingController } from "../controllers/bookingController.ts";
import { createBookingRequestSchema } from "../dtos/bookingDtos.ts";
import { validateBody } from "../middlewares/validator.ts";

export function createBookingRoutes(controller: ReturnType<typeof createBookingController>) {
  const router = Router();
  router.post("/bookings", validateBody(createBookingRequestSchema), controller.createBooking);
  router.get("/orders/:orderId/budget", controller.getOrderBudget);
  return router;
}

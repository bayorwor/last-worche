// Maps booking URLs to controller functions.
import { Router } from "express";
import type { createBookingController } from "../controllers/bookingController.ts";
import { createBookingRequestSchema } from "../dtos/bookingDtos.ts";
import type { AuthGuards } from "../middlewares/authentication.ts";
import { validateBody } from "../middlewares/validator.ts";

export function createBookingRoutes(controller: ReturnType<typeof createBookingController>, guards: AuthGuards) {
  const router = Router();
  router.post("/bookings", guards.requireRole("consultant"), validateBody(createBookingRequestSchema), controller.createBooking);
  router.get("/orders", guards.requireAnyRole(), controller.listOrders);
  router.get("/orders/:orderId/budget", controller.getOrderBudget);
  return router;
}

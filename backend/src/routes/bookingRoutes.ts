// Maps booking URLs to controller functions. Every route names the roles allowed to use it, and purchasing
// is not allowed on any route that returns single bookings. Row-level scope is checked in bookingService.
import { Router } from "express";
import type { createBookingController } from "../controllers/bookingController.ts";
import { createBookingRequestSchema } from "../dtos/bookingDtos.ts";
import type { AuthGuards } from "../middlewares/authentication.ts";
import { validateBody } from "../middlewares/validator.ts";

export function createBookingRoutes(controller: ReturnType<typeof createBookingController>, guards: AuthGuards) {
  const router = Router();
  router.post("/bookings", guards.requireRole("consultant"), validateBody(createBookingRequestSchema), controller.createBooking);
  router.post("/bookings/check", guards.requireRole("consultant"), validateBody(createBookingRequestSchema), controller.checkBooking);
  router.get("/orders", guards.requireAnyRole(), controller.listOrders);
  router.get("/orders/:orderId/budget", guards.requireAnyRole(), controller.getOrderBudget);
  router.get("/orders/:orderId/bookings", guards.requireRole("project_lead"), controller.listOrderBookings);
  router.get("/consultants/:consultantId/bookings", guards.requireRole("consultant"), controller.listConsultantBookings);
  return router;
}

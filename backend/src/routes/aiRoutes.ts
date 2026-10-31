// Maps AI URLs to controller functions.
import { Router } from "express";
import type { createAiController } from "../controllers/aiController.ts";
import { parseBookingRequestSchema } from "../dtos/aiDtos.ts";
import type { AuthGuards } from "../middlewares/authentication.ts";
import { validateBody } from "../middlewares/validator.ts";

export function createAiRoutes(controller: ReturnType<typeof createAiController>, guards: AuthGuards) {
  const router = Router();
  router.post("/parse-booking", guards.requireRole("consultant"), validateBody(parseBookingRequestSchema), controller.parseBooking);
  return router;
}

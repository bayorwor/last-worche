// Maps AI URLs to controller functions.
import { Router } from "express";
import type { createAiController } from "../controllers/aiController.ts";
import { parseBookingRequestSchema } from "../dtos/aiDtos.ts";
import { validateBody } from "../middlewares/validator.ts";

export function createAiRoutes(controller: ReturnType<typeof createAiController>) {
  const router = Router();
  router.post("/parse-booking", validateBody(parseBookingRequestSchema), controller.parseBooking);
  return router;
}

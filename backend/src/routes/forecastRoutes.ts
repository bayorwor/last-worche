// Maps forecast and follow-up URLs to controller functions. Which orders a lead may reach is checked in the services.
import { Router } from "express";
import type { createForecastController } from "../controllers/forecastController.ts";
import { createFollowUpSchema } from "../dtos/forecastDtos.ts";
import type { AuthGuards } from "../middlewares/authentication.ts";
import { validateBody } from "../middlewares/validator.ts";

export function createForecastRoutes(controller: ReturnType<typeof createForecastController>, guards: AuthGuards) {
  const router = Router();
  router.get("/orders/:orderId/forecast", guards.requireRole("project_lead"), controller.getForecast);
  router.post("/orders/:orderId/follow-up-requests", guards.requireRole("project_lead"), validateBody(createFollowUpSchema), controller.requestFollowUp);
  router.get("/purchasing/follow-up-requests", guards.requireRole("purchasing"), controller.listFollowUps);
  router.post("/purchasing/follow-up-requests/:id/confirm", guards.requireRole("purchasing"), controller.confirmFollowUp);
  return router;
}

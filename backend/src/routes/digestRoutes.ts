// Maps the weekly digest URLs to controller functions. Only a project lead may turn it on, and only for themselves.
import { Router } from "express";
import type { createDigestController } from "../controllers/digestController.ts";
import { digestSubscriptionSchema } from "../dtos/digestDtos.ts";
import type { AuthGuards } from "../middlewares/authentication.ts";
import { validateBody } from "../middlewares/validator.ts";

export function createDigestRoutes(controller: ReturnType<typeof createDigestController>, guards: AuthGuards) {
  const router = Router();
  router.get("/subscription", guards.requireRole("project_lead"), controller.getSubscription);
  router.put("/subscription", guards.requireRole("project_lead"), validateBody(digestSubscriptionSchema), controller.setSubscription);
  return router;
}

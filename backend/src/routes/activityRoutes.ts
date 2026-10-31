// Maps the activity URL to its controller function. Every role may call it, and activityService limits what each one gets.
import { Router } from "express";
import type { createActivityController } from "../controllers/activityController.ts";
import type { AuthGuards } from "../middlewares/authentication.ts";

export function createActivityRoutes(controller: ReturnType<typeof createActivityController>, guards: AuthGuards) {
  const router = Router();
  router.get("/", guards.requireAnyRole(), controller.list);
  return router;
}

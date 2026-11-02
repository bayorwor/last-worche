// Maps radar URLs to controller functions. Purchasing is refused the order radar here, before any handler,
// because it lists people and days; which orders a lead may reach is checked in the service.
import { Router } from "express";
import type { createRadarController } from "../controllers/radarController.ts";
import type { AuthGuards } from "../middlewares/authentication.ts";

export function createRadarRoutes(controller: ReturnType<typeof createRadarController>, guards: AuthGuards) {
  const router = Router();
  router.get("/orders/:orderId/radar", guards.requireRole("project_lead"), controller.getOrderRadar);
  router.get("/purchasing/radar", guards.requireRole("purchasing"), controller.getSupplierRadar);
  return router;
}

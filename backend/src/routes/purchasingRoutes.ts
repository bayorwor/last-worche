// Maps purchasing URLs to controller functions.
import { Router } from "express";
import type { createPurchasingController } from "../controllers/purchasingController.ts";
import type { AuthGuards } from "../middlewares/authentication.ts";

export function createPurchasingRoutes(controller: ReturnType<typeof createPurchasingController>, guards: AuthGuards) {
  const router = Router();
  router.get("/supplier-overview", guards.requireRole("purchasing"), controller.getSupplierOverview);
  return router;
}

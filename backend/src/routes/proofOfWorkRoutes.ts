// Maps proof of work URLs to controller functions. Which orders a lead may reach is checked in proofOfWorkService.
import { Router } from "express";
import type { createProofOfWorkController } from "../controllers/proofOfWorkController.ts";
import type { AuthGuards } from "../middlewares/authentication.ts";

export function createProofOfWorkRoutes(controller: ReturnType<typeof createProofOfWorkController>, guards: AuthGuards) {
  const router = Router();
  router.get("/orders/:orderId/proofs-of-work", guards.requireRole("project_lead"), controller.list);
  router.get("/orders/:orderId/proofs-of-work/:month/export.csv", guards.requireRole("project_lead"), controller.exportCsv);
  router.post("/orders/:orderId/proofs-of-work/:month/approve", guards.requireRole("project_lead"), controller.approve);
  return router;
}

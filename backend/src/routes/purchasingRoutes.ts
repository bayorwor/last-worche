// Maps purchasing URLs to controller functions.
import { Router } from "express";
import type { createPurchasingController } from "../controllers/purchasingController.ts";
import { invoiceCheckSchema, recordInvoiceSchema } from "../dtos/purchasingDtos.ts";
import type { AuthGuards } from "../middlewares/authentication.ts";
import { validateBody } from "../middlewares/validator.ts";

export function createPurchasingRoutes(controller: ReturnType<typeof createPurchasingController>, guards: AuthGuards) {
  const router = Router();
  router.get("/supplier-overview", guards.requireRole("purchasing"), controller.getSupplierOverview);
  router.get("/framework-agreements", guards.requireRole("purchasing"), controller.listFrameworkAgreements);
  router.post("/invoice-check", guards.requireRole("purchasing"), validateBody(invoiceCheckSchema), controller.checkInvoice);
  router.get("/invoices", guards.requireRole("purchasing"), controller.listInvoices);
  router.post("/invoices", guards.requireRole("purchasing"), validateBody(recordInvoiceSchema), controller.recordInvoice);
  return router;
}

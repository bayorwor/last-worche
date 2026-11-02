// HTTP layer for purchasing.
import type { Request, Response } from "express";
import type { InvoiceCheckRequest, RecordInvoiceBody } from "../dtos/purchasingDtos.ts";
import { currentUser } from "../middlewares/authentication.ts";
import type { PurchasingService } from "../services/purchasingService.ts";

export function createPurchasingController(purchasingService: PurchasingService) {
  return {
    async getSupplierOverview(_req: Request, res: Response) {
      res.json(await purchasingService.getSupplierOverview());
    },

    async listFrameworkAgreements(_req: Request, res: Response) {
      res.json(await purchasingService.listFrameworkAgreements());
    },

    async checkInvoice(req: Request, res: Response) {
      const { orderId, month, invoicedPersonDays } = req.body as InvoiceCheckRequest;
      res.json(await purchasingService.checkInvoice(orderId, month, invoicedPersonDays));
    },

    async recordInvoice(req: Request, res: Response) {
      await purchasingService.recordInvoice(currentUser(req), req.body as RecordInvoiceBody);
      res.status(201).json(await purchasingService.listInvoices());
    },

    async listInvoices(_req: Request, res: Response) {
      res.json(await purchasingService.listInvoices());
    },
  };
}

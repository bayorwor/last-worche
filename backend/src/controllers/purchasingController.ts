// HTTP layer for purchasing.
import type { Request, Response } from "express";
import type { InvoiceCheckRequest } from "../dtos/purchasingDtos.ts";
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
  };
}

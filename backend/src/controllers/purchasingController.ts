// HTTP layer for purchasing.
import type { Request, Response } from "express";
import type { PurchasingService } from "../services/purchasingService.ts";

export function createPurchasingController(purchasingService: PurchasingService) {
  return {
    async getSupplierOverview(_req: Request, res: Response) {
      res.json(await purchasingService.getSupplierOverview());
    },
  };
}

// HTTP layer for the radar of unusual booking patterns.
import type { Request, Response } from "express";
import { currentUser } from "../middlewares/authentication.ts";
import type { RadarService } from "../services/radarService.ts";

export function createRadarController(radarService: RadarService) {
  return {
    async getOrderRadar(req: Request<{ orderId: string }>, res: Response) {
      res.json(await radarService.getOrderRadarFor(currentUser(req), req.params.orderId));
    },

    async getSupplierRadar(_req: Request, res: Response) {
      res.json(await radarService.getSupplierRadar());
    },
  };
}

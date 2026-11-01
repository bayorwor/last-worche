// The interface for suppliers' own time tracking. It needs a supplier key instead of a person's session.
import { Router, type Request, type Response } from "express";
import type { ImportBookingsRequest } from "../dtos/bookingDtos.ts";
import { importBookingsRequestSchema } from "../dtos/bookingDtos.ts";
import { requireSupplierKey } from "../middlewares/supplierKey.ts";
import { validateBody } from "../middlewares/validator.ts";
import type { BookingService } from "../services/bookingService.ts";

export function createIntegrationRoutes(bookingService: BookingService, supplierKeys: { supplierId: string; key: string }[]) {
  const router = Router();
  router.post("/time-tracking/bookings", requireSupplierKey(supplierKeys), validateBody(importBookingsRequestSchema), async (req: Request, res: Response) => {
    const { bookings } = req.body as ImportBookingsRequest;
    res.status(201).json(await bookingService.importBookings(res.locals.supplierId, bookings));
  });
  return router;
}

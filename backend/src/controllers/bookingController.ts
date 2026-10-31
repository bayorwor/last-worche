// HTTP layer: reads the request, calls the service, writes the response. No business logic here.
import type { Request, Response } from "express";
import type { CreateBookingRequest } from "../dtos/bookingDtos.ts";
import type { BookingService } from "../services/bookingService.ts";

export function createBookingController(bookingService: BookingService) {
  return {
    async createBooking(req: Request, res: Response) {
      const booking = await bookingService.createBooking(req.body as CreateBookingRequest);
      res.status(201).json(booking);
    },

    async listOrders(_req: Request, res: Response) {
      res.json(await bookingService.listOrders());
    },

    async listAssignedOrders(req: Request<{ consultantId: string }>, res: Response) {
      res.json(await bookingService.listAssignedOrders(req.params.consultantId));
    },

    async getOrderBudget(req: Request<{ orderId: string }>, res: Response) {
      res.json(await bookingService.getOrderBudget(req.params.orderId));
    },
  };
}

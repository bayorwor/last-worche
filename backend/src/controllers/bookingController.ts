// HTTP layer: reads the request, calls the service, writes the response. No business logic here.
import type { Request, Response } from "express";
import type { CreateBookingRequest } from "../dtos/bookingDtos.ts";
import { currentConsultantId, currentUser } from "../middlewares/authentication.ts";
import type { BookingService } from "../services/bookingService.ts";

export function createBookingController(bookingService: BookingService) {
  return {
    async createBooking(req: Request, res: Response) {
      const request = req.body as CreateBookingRequest;
      const booking = await bookingService.createBooking({ ...request, consultantId: currentConsultantId(req) });
      res.status(201).json(booking);
    },

    async checkBooking(req: Request, res: Response) {
      const request = req.body as CreateBookingRequest;
      res.json(await bookingService.checkBooking({ ...request, consultantId: currentConsultantId(req) }));
    },

    async listOrders(req: Request, res: Response) {
      res.json(await bookingService.listOrdersFor(currentUser(req)));
    },

    async getOrderBudget(req: Request<{ orderId: string }>, res: Response) {
      res.json(await bookingService.getOrderBudgetFor(currentUser(req), req.params.orderId));
    },

    async listOrderBookings(req: Request<{ orderId: string }>, res: Response) {
      res.json(await bookingService.listOrderBookingsFor(currentUser(req), req.params.orderId));
    },

    async listConsultantBookings(req: Request<{ consultantId: string }>, res: Response) {
      res.json(await bookingService.listConsultantBookingsFor(currentUser(req), req.params.consultantId));
    },
  };
}

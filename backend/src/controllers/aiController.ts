// HTTP layer for AI features: forwards the sentence to the service and returns its proposal.
import type { Request, Response } from "express";
import type { ParseBookingRequest } from "../dtos/aiDtos.ts";
import { currentConsultantId } from "../middlewares/authentication.ts";
import { parseBookingSentence } from "../services/bookingAssistantService.ts";
import type { BookingService } from "../services/bookingService.ts";

export function createAiController(bookingService: BookingService) {
  return {
    async parseBooking(req: Request, res: Response) {
      const { sentence, today } = req.body as ParseBookingRequest;
      const assignedOrders = await bookingService.listAssignedOrders(currentConsultantId(req));
      res.json(await parseBookingSentence(sentence, today, assignedOrders));
    },
  };
}

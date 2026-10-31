// HTTP layer for AI features: forwards the sentence to the service and returns its proposal.
import type { Request, Response } from "express";
import type { ParseBookingRequest } from "../dtos/aiDtos.ts";
import { parseBookingSentence } from "../services/bookingAssistantService.ts";

export function createAiController() {
  return {
    async parseBooking(req: Request, res: Response) {
      const { sentence, today } = req.body as ParseBookingRequest;
      res.json(await parseBookingSentence(sentence, today));
    },
  };
}

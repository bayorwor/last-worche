// API DTOs for AI features. The proposal schema also tells the AI model which JSON to return.
import { z } from "zod";

export const parseBookingRequestSchema = z.object({
  sentence: z.string().min(1).max(500),
});

export type ParseBookingRequest = z.infer<typeof parseBookingRequestSchema>;

export const bookingProposalSchema = z.object({
  date: z.string(),
  hours: z.number(),
  description: z.string(),
});

export type BookingProposal = z.infer<typeof bookingProposalSchema>;

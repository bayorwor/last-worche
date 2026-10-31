// API DTOs: the shape of booking data as it crosses HTTP. Kept apart from domain and database types.
import { z } from "zod";

export const createBookingRequestSchema = z.object({
  orderId: z.string().min(1),
  // Sample only: taken from the request until sign-in exists, then it must come from the session.
  consultantId: z.string().min(1),
  date: z.iso.date(),
  hours: z.number().positive().multipleOf(0.01), // the database stores two decimals
  description: z.string().min(1),
});

export type CreateBookingRequest = z.infer<typeof createBookingRequestSchema>;

export type OrderBudgetResponse = {
  orderId: string;
  orderedPersonDays: number;
  usedPersonDays: number;
  freePersonDays: number;
};

// API DTOs: the shape of booking data as it crosses HTTP. Kept apart from domain and database types.
import { z } from "zod";
import { minutesOfDay } from "../domain/booking.ts";

const timeOfDay = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Booking rejected: times must look like 09:00.");

export const createBookingRequestSchema = z
  .object({
    // There is no consultant ID here on purpose: it comes from the session, so nobody can book as someone else.
    orderId: z.string().min(1),
    date: z.iso.date(),
    startTime: timeOfDay,
    endTime: timeOfDay,
    // Can be shorter than start to end, because breaks are not worked. The database stores two decimals.
    hours: z.number().positive("Booking rejected: the duration must be more than zero.").multipleOf(0.01),
    description: z.string().trim().min(1, "Booking rejected: a description of what was done is required."),
  })
  .refine(({ startTime, endTime }) => minutesOfDay(endTime) > minutesOfDay(startTime), {
    message: "Booking rejected: the end time must be after the start time.",
    path: ["endTime"],
  })
  .refine(({ startTime, endTime, hours }) => hours * 60 <= minutesOfDay(endTime) - minutesOfDay(startTime), {
    message: "Booking rejected: the duration does not fit between the start and end time.",
    path: ["hours"],
  });

export type CreateBookingRequest = z.infer<typeof createBookingRequestSchema>;

export type OrderBudgetResponse = {
  orderId: string;
  orderedPersonDays: number;
  usedPersonDays: number;
  freePersonDays: number;
};

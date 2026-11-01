// API DTOs for the forecast and follow-up requests.
import { z } from "zod";

const hasNoEmptyScenario = (query: { extraConsultants?: number; extraFromDate?: string }) =>
  query.extraFromDate === undefined || query.extraConsultants !== undefined;

// A scenario is only a what-if view: it arrives in the query, and nothing about it is stored.
export const forecastQuerySchema = z
  .object({
    extraConsultants: z.coerce.number().int().min(1).max(20).optional(),
    extraFromDate: z.iso.date().optional(),
    projectEndShiftWeeks: z.coerce.number().int().min(1).max(52).optional(),
  })
  .refine(hasNoEmptyScenario, { message: "A start date needs a number of extra consultants.", path: ["extraConsultants"] });

export const createFollowUpSchema = z.object({
  personDays: z.number().positive().max(10_000).multipleOf(0.001),
  neededByDate: z.iso.date(),
});

export const followUpIdSchema = z.coerce.number().int().positive();

export type ForecastQuery = z.infer<typeof forecastQuerySchema>;
export type CreateFollowUpRequest = z.infer<typeof createFollowUpSchema>;

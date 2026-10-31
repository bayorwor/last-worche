// API DTOs for signing in.
import { z } from "zod";

const email = z.string().trim().toLowerCase().pipe(z.email());

export const requestCodeSchema = z.object({
  email,
  language: z.enum(["de", "en"]).default("en"),
});

export const verifyCodeSchema = z.object({
  email,
  code: z.string().regex(/^\d{6}$/),
});

export type RequestCodeRequest = z.infer<typeof requestCodeSchema>;
export type VerifyCodeRequest = z.infer<typeof verifyCodeSchema>;

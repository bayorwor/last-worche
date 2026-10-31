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

// Only the name. The email is how a person signs in, and an unknown field such as a role is dropped here.
export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(100),
});

export type RequestCodeRequest = z.infer<typeof requestCodeSchema>;
export type VerifyCodeRequest = z.infer<typeof verifyCodeSchema>;
export type UpdateProfileRequest = z.infer<typeof updateProfileSchema>;

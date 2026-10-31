// API DTOs for signing in.
import { z } from "zod";

export const signInRequestSchema = z.object({
  userId: z.string().min(1),
});

export type SignInRequest = z.infer<typeof signInRequestSchema>;

// API DTOs for signing in.
import { z } from "zod";

export const signInRequestSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  // The upper limit stops very long passwords from keeping the server busy with hashing.
  password: z.string().min(1).max(200),
});

export type SignInRequest = z.infer<typeof signInRequestSchema>;

// API DTOs for the weekly digest. Subscribing needs an explicit true: a missing or other value is refused,
// so no request can subscribe anyone silently.
import { z } from "zod";

export const digestSubscriptionSchema = z.object({
  subscribed: z.boolean(),
});

export type DigestSubscriptionRequest = z.infer<typeof digestSubscriptionSchema>;

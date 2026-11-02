// HTTP layer for the weekly digest subscription.
import type { Request, Response } from "express";
import type { DigestSubscriptionRequest } from "../dtos/digestDtos.ts";
import { currentUser } from "../middlewares/authentication.ts";
import type { DigestService } from "../services/digestService.ts";

export function createDigestController(digestService: DigestService) {
  return {
    async getSubscription(req: Request, res: Response) {
      res.json(await digestService.getSubscriptionFor(currentUser(req)));
    },

    async setSubscription(req: Request, res: Response) {
      const { subscribed } = req.body as DigestSubscriptionRequest;
      res.json(await digestService.setSubscriptionFor(currentUser(req), subscribed));
    },
  };
}

// HTTP layer for recent activity.
import type { Request, Response } from "express";
import { currentUser } from "../middlewares/authentication.ts";
import type { ActivityService } from "../services/activityService.ts";

export function createActivityController(activityService: ActivityService) {
  return {
    async list(req: Request, res: Response) {
      res.json(await activityService.listFor(currentUser(req)));
    },
  };
}

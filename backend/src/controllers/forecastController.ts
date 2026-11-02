// HTTP layer for the forecast and follow-up requests.
import type { Request, Response } from "express";
import { followUpIdSchema, forecastQuerySchema, type CreateFollowUpRequest } from "../dtos/forecastDtos.ts";
import { currentUser } from "../middlewares/authentication.ts";
import type { FollowUpService } from "../services/followUpService.ts";
import type { ForecastService } from "../services/forecastService.ts";

export function createForecastController(forecastService: ForecastService, followUpService: FollowUpService) {
  return {
    async getForecast(req: Request<{ orderId: string }>, res: Response) {
      const scenario = forecastQuerySchema.parse(req.query);
      res.json(await forecastService.getForecastFor(currentUser(req), req.params.orderId, scenario));
    },

    async requestFollowUp(req: Request<{ orderId: string }>, res: Response) {
      const { personDays, neededByDate } = req.body as CreateFollowUpRequest;
      res.status(201).json(await followUpService.request(currentUser(req), req.params.orderId, personDays, neededByDate));
    },

    async listFollowUps(_req: Request, res: Response) {
      res.json(await followUpService.listAll());
    },

    async confirmFollowUp(req: Request<{ id: string }>, res: Response) {
      await followUpService.confirm(currentUser(req), followUpIdSchema.parse(req.params.id));
      res.json(await followUpService.listAll());
    },

    async declineFollowUp(req: Request<{ id: string }>, res: Response) {
      await followUpService.decline(currentUser(req), followUpIdSchema.parse(req.params.id));
      res.json(await followUpService.listAll());
    },
  };
}

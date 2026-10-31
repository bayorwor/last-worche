// HTTP layer for proofs of work.
import type { Request, Response } from "express";
import { proofMonthSchema } from "../dtos/proofOfWorkDtos.ts";
import { currentUser } from "../middlewares/authentication.ts";
import type { ProofOfWorkService } from "../services/proofOfWorkService.ts";

export function createProofOfWorkController(proofOfWorkService: ProofOfWorkService) {
  return {
    async list(req: Request<{ orderId: string }>, res: Response) {
      res.json(await proofOfWorkService.listFor(currentUser(req), req.params.orderId));
    },

    async approve(req: Request<{ orderId: string; month: string }>, res: Response) {
      const month = proofMonthSchema.parse(req.params.month);
      res.json(await proofOfWorkService.approveFor(currentUser(req), req.params.orderId, month));
    },
  };
}

// HTTP layer for signing in.
import type { Request, Response } from "express";
import type { SignInRequest } from "../dtos/authDtos.ts";
import { currentUser } from "../middlewares/authentication.ts";
import type { AuthService } from "../services/authService.ts";

export function createAuthController(authService: AuthService) {
  return {
    async listDemoUsers(_req: Request, res: Response) {
      res.json(await authService.listDemoUsers());
    },

    async signIn(req: Request, res: Response) {
      const { userId } = req.body as SignInRequest;
      res.json(await authService.signIn(userId));
    },

    getCurrentUser(req: Request, res: Response) {
      res.json(currentUser(req));
    },
  };
}

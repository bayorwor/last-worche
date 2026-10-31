// HTTP layer for signing in.
import type { Request, Response } from "express";
import type { SignInRequest } from "../dtos/authDtos.ts";
import { currentUser } from "../middlewares/authentication.ts";
import type { AuthService } from "../services/authService.ts";

export function createAuthController(authService: AuthService) {
  return {
    async listRoles(_req: Request, res: Response) {
      res.json(await authService.listRoles());
    },

    async listTestAccounts(_req: Request, res: Response) {
      res.json(await authService.listTestAccounts());
    },

    async signIn(req: Request, res: Response) {
      const { email, password } = req.body as SignInRequest;
      res.json(await authService.signIn(email, password));
    },

    getCurrentUser(req: Request, res: Response) {
      res.json(currentUser(req));
    },
  };
}

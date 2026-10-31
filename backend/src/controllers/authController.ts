// HTTP layer for signing in.
import type { Request, Response } from "express";
import type { RequestCodeRequest, UpdateProfileRequest, VerifyCodeRequest } from "../dtos/authDtos.ts";
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

    async requestCode(req: Request, res: Response) {
      const { email, language } = req.body as RequestCodeRequest;
      res.json(await authService.requestCode(email, language));
    },

    async verifyCode(req: Request, res: Response) {
      const { email, code } = req.body as VerifyCodeRequest;
      res.json(await authService.verifyCode(email, code));
    },

    async getCurrentUser(req: Request, res: Response) {
      res.json(await authService.getProfile(currentUser(req).id));
    },

    async updateCurrentUser(req: Request, res: Response) {
      const { name } = req.body as UpdateProfileRequest;
      res.json(await authService.updateProfile(currentUser(req).id, name));
    },
  };
}

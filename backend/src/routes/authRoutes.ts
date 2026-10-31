// Maps sign-in URLs to controller functions. The first three are the only routes open to everyone,
// because nobody has a session before signing in.
import { Router } from "express";
import type { createAuthController } from "../controllers/authController.ts";
import { signInRequestSchema } from "../dtos/authDtos.ts";
import type { AuthGuards } from "../middlewares/authentication.ts";
import { validateBody } from "../middlewares/validator.ts";

export function createAuthRoutes(controller: ReturnType<typeof createAuthController>, guards: AuthGuards) {
  const router = Router();
  router.get("/roles", controller.listRoles);
  router.get("/test-accounts", controller.listTestAccounts);
  router.post("/sign-in", validateBody(signInRequestSchema), controller.signIn);
  router.get("/me", guards.requireAnyRole(), controller.getCurrentUser);
  return router;
}

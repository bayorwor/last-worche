// Maps sign-in URLs to controller functions. The first four are the only routes open to everyone,
// because nobody has a session before signing in.
import { Router } from "express";
import type { createAuthController } from "../controllers/authController.ts";
import { requestCodeSchema, updateProfileSchema, verifyCodeSchema } from "../dtos/authDtos.ts";
import type { AuthGuards } from "../middlewares/authentication.ts";
import { limitPerMinute } from "../middlewares/rateLimit.ts";
import { validateBody } from "../middlewares/validator.ts";

export function createAuthRoutes(controller: ReturnType<typeof createAuthController>, guards: AuthGuards, signInLimitPerMinute: number) {
  const router = Router();
  const signInLimit = limitPerMinute(signInLimitPerMinute);
  router.get("/roles", controller.listRoles);
  router.get("/test-accounts", controller.listTestAccounts);
  router.post("/request-code", signInLimit, validateBody(requestCodeSchema), controller.requestCode);
  router.post("/verify-code", signInLimit, validateBody(verifyCodeSchema), controller.verifyCode);
  router.get("/me", guards.requireAnyRole(), controller.getCurrentUser);
  router.patch("/me", guards.requireAnyRole(), validateBody(updateProfileSchema), controller.updateCurrentUser);
  return router;
}

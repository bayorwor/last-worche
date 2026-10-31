// Permission checks that run before a route's handler. The user and role come only from the signed
// session token, never from the request body. A route with a guard cannot reach its handler without it.
import type { NextFunction, Request, Response } from "express";
import { ForbiddenError, UnauthorizedError } from "../domain/errors.ts";
import { USER_ROLES, type User, type UserRole } from "../domain/user.ts";
import type { AuthService } from "../services/authService.ts";

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export type AuthGuards = ReturnType<typeof createAuthGuards>;

export function createAuthGuards(authService: AuthService) {
  const requireRole =
    (...allowedRoles: UserRole[]) =>
    (req: Request, _res: Response, next: NextFunction) => {
      const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
      if (!token) throw new UnauthorizedError("Please sign in.");

      const user = authService.verifySessionToken(token);
      if (!allowedRoles.includes(user.role)) {
        throw new ForbiddenError(`The role ${user.role} may not do this.`);
      }
      req.user = user;
      next();
    };

  return { requireRole, requireAnyRole: () => requireRole(...USER_ROLES) };
}

// For handlers behind a guard, which has already set the user.
export function currentUser(req: Request): User {
  if (!req.user) throw new UnauthorizedError("Please sign in.");
  return req.user;
}

export function currentConsultantId(req: Request): string {
  const { consultantId } = currentUser(req);
  if (!consultantId) throw new ForbiddenError("This user is not a consultant.");
  return consultantId;
}

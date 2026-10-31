// Checks the request body against a Zod schema before the controller runs.
import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";

export function validateBody(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction) => {
    req.body = schema.parse(req.body); // a ZodError goes to errorHandler
    next();
  };
}

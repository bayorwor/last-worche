// Turns every error into a JSON response, so no layer below has to know about HTTP status codes.
import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { BusinessRuleError, ForbiddenError, NotFoundError, UnauthorizedError } from "../domain/errors.ts";
import { AiServiceError } from "../services/bookingAssistantService.ts";

// Express recognises error middleware by its four parameters, so `_next` must stay.
export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof ZodError) {
    res.status(400).json({ error: error.issues[0]?.message ?? "Invalid request", details: error.issues });
  } else if (error instanceof SyntaxError) {
    res.status(400).json({ error: "The request body is not valid JSON." }); // from express.json()
  } else if (error instanceof UnauthorizedError) {
    res.status(401).json({ error: error.message });
  } else if (error instanceof ForbiddenError) {
    res.status(403).json({ error: error.message });
  } else if (error instanceof NotFoundError) {
    res.status(404).json({ error: error.message });
  } else if (error instanceof BusinessRuleError) {
    res.status(422).json({ error: error.message, rule: error.rule, values: error.values });
  } else if (error instanceof AiServiceError) {
    res.status(503).json({ error: error.message, code: error.code });
  } else {
    console.error(error);
    res.status(500).json({ error: "Something went wrong on the server." });
  }
}

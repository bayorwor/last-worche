// A limit per network address, so nobody can try sign-in codes or addresses by the thousand. It counts in this
// process, which is enough for one server. Several servers would need a shared counter (ADR-0003).
import type { NextFunction, Request, Response } from "express";
import { TooManyRequestsError } from "../domain/errors.ts";

const WINDOW_MS = 60_000;

export function limitPerMinute(maxRequests: number, now: () => number = Date.now) {
  let windowStart = now();
  const counts = new Map<string, number>();

  return (req: Request, _res: Response, next: NextFunction) => {
    if (now() - windowStart >= WINDOW_MS) {
      windowStart = now();
      counts.clear(); // also keeps this from growing without end
    }

    const address = req.ip ?? "unknown";
    const count = (counts.get(address) ?? 0) + 1;
    counts.set(address, count);

    if (count > maxRequests) throw new TooManyRequestsError("Too many attempts. Please wait a minute.");
    next();
  };
}

// Lets a supplier's system call the interface for its own hours. It has no person signing in, so it sends a key,
// and the key decides which supplier it speaks for (ADR-0017). It never comes from the request body.
import { timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { UnauthorizedError } from "../domain/errors.ts";

type SupplierKey = { supplierId: string; key: string };

function isSameKey(first: string, second: string) {
  const firstBytes = Buffer.from(first);
  const secondBytes = Buffer.from(second);
  return firstBytes.length === secondBytes.length && timingSafeEqual(firstBytes, secondBytes);
}

export function requireSupplierKey(supplierKeys: SupplierKey[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const sentKey = req.header("x-api-key") ?? "";
    const supplier = supplierKeys.find(({ key }) => isSameKey(key, sentKey));
    if (!supplier) throw new UnauthorizedError("A valid supplier key is required.");

    res.locals.supplierId = supplier.supplierId;
    next();
  };
}

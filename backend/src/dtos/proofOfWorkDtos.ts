// API DTOs for proofs of work.
import { z } from "zod";

export const proofMonthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);

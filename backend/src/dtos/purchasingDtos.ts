// API DTOs for purchasing.
import { z } from "zod";
import { proofMonthSchema } from "./proofOfWorkDtos.ts";

export const invoiceCheckSchema = z.object({
  orderId: z.string().min(1),
  month: proofMonthSchema,
  invoicedPersonDays: z.number().nonnegative().max(100_000),
});

export const recordInvoiceSchema = invoiceCheckSchema.extend({
  invoiceNumber: z.string().trim().min(1).max(64),
});

export type RecordInvoiceBody = z.infer<typeof recordInvoiceSchema>;
export type InvoiceCheckRequest = z.infer<typeof invoiceCheckSchema>;

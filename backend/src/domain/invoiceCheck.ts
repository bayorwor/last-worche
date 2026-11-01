// Compares what a supplier invoices with the approved proof of work of that order and month (story #35).
import { BusinessRuleError } from "./errors.ts";

const TOLERANCE_PERSON_DAYS = 0.001; // the smallest amount a booking can move a budget by

export type InvoiceCheckResult = {
  status: "consistent" | "over-approved" | "under-approved";
  approvedPersonDays: number;
  invoicedPersonDays: number;
  differencePersonDays: number;
};

export function assertProofApprovedForInvoice(approvedPersonDays: number | null, orderId: string, month: string) {
  if (approvedPersonDays === null) {
    throw new BusinessRuleError(
      "invoice-no-approved-proof",
      `No approved proof of work for order ${orderId}, ${month} — ask the project lead to approve it first.`,
      { orderId, month },
    );
  }
}

export function checkInvoice(approvedPersonDays: number, invoicedPersonDays: number): InvoiceCheckResult {
  const differencePersonDays = Math.round((invoicedPersonDays - approvedPersonDays) * 1000) / 1000;
  const status =
    Math.abs(differencePersonDays) < TOLERANCE_PERSON_DAYS ? "consistent" : differencePersonDays > 0 ? "over-approved" : "under-approved";
  return { status, approvedPersonDays, invoicedPersonDays, differencePersonDays };
}

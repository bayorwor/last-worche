// Compares what a supplier invoices with the approved proof of work of that order and month (story #35).
import { BusinessRuleError } from "./errors.ts";

const TOLERANCE_PERSON_DAYS = 0.001; // the smallest amount a booking can move a budget by

export type InvoiceCheckResult = {
  status: "consistent" | "over-approved" | "under-approved";
  approvedPersonDays: number;
  invoicedPersonDays: number;
  differencePersonDays: number;
};

// A stored invoice. Its month is approved and locked, so the approved amount can no longer change.
export type StoredInvoice = {
  id: number;
  orderId: string;
  orderTitle: string;
  month: string; // YYYY-MM
  invoiceNumber: string;
  invoicedPersonDays: number;
  approvedPersonDays: number;
  recordedAtMs: number;
};

// One invoice per order and month, so one month of work cannot be recorded for payment twice.
export function assertInvoiceNotRecorded(alreadyRecorded: boolean, orderId: string, month: string) {
  if (alreadyRecorded) {
    throw new BusinessRuleError("invoice-already-recorded", `An invoice for order ${orderId}, ${month} is already recorded.`, { orderId, month });
  }
}

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

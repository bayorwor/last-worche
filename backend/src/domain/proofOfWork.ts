// Proof of work (Leistungsnachweis): the hours of one order in one month, approved by its project lead.
// Approval is final, so the month's bookings can no longer change (story #11).
import { HOURS_PER_PERSON_DAY } from "./booking.ts";
import { BusinessRuleError } from "./errors.ts";

export type ProofOfWorkTotals = {
  month: string; // YYYY-MM
  bookedHours: number;
  bookingCount: number;
  consultantCount: number;
  approvedAtMs: number | null;
  approvedByName: string | null;
};

// Expects YYYY-MM-DD.
export function monthOf(date: string) {
  return date.slice(0, 7);
}

export function assertMonthNotApproved(isApproved: boolean) {
  if (isApproved) {
    throw new BusinessRuleError("proof-approved", "Proof of work already approved — contact the project lead.");
  }
}

export function assertProofCanBeApproved(month: string, bookingCount: number, isAlreadyApproved: boolean) {
  if (isAlreadyApproved) {
    throw new BusinessRuleError("proof-already-approved", `The proof of work for ${month} is already approved.`, { month });
  }
  if (bookingCount === 0) {
    throw new BusinessRuleError("proof-empty", `There are no bookings to approve for ${month}.`, { month });
  }
}

export function toProofOfWork({ bookedHours, ...totals }: ProofOfWorkTotals) {
  return {
    ...totals,
    personDays: bookedHours / HOURS_PER_PERSON_DAY,
    status: totals.approvedAtMs === null ? ("open" as const) : ("approved" as const),
  };
}

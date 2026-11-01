// A project lead's request for more budget on an order, which purchasing confirms. This closes the loop
// from the forecast's warning to a higher budget, without the product managing contracts.
import { BusinessRuleError } from "./errors.ts";

export type FollowUpStatus = "open" | "confirmed";

export type FollowUpRequest = {
  id: number;
  orderId: string;
  orderTitle: string;
  personDays: number;
  neededByDate: string;
  status: FollowUpStatus;
  requestedAtMs: number;
};

export function assertNoOpenFollowUp(hasOpenRequest: boolean, orderId: string) {
  if (hasOpenRequest) {
    throw new BusinessRuleError("follow-up-open", `Order ${orderId} already has an open follow-up request.`, { orderId });
  }
}

export function assertFollowUpIsOpen(status: FollowUpStatus) {
  if (status !== "open") {
    throw new BusinessRuleError("follow-up-confirmed", "This follow-up request is already confirmed.");
  }
}

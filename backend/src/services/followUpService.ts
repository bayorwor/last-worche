// A project lead asks purchasing for more budget, and purchasing confirms it. Each step is one transaction
// with its activity entry, and confirming raises the order's budget.
import { ForbiddenError, NotFoundError } from "../domain/errors.ts";
import { assertFollowUpIsOpen, assertNoOpenFollowUp } from "../domain/followUp.ts";
import type { User } from "../domain/user.ts";
import type { BookingRepository } from "../repositories/bookingRepository.ts";

export type FollowUpService = ReturnType<typeof createFollowUpService>;

export function createFollowUpService(repository: BookingRepository, now: () => number = Date.now) {
  return {
    listAll() {
      return repository.listFollowUps();
    },

    async request(user: User, orderId: string, personDays: number, neededByDate: string) {
      if (!(await repository.findOrder(orderId))) throw new NotFoundError(`Order ${orderId} does not exist.`);
      if (user.role !== "project_lead" || !(await repository.isOrderLedBy(user.id, orderId))) {
        throw new ForbiddenError(`You may not request more budget for order ${orderId}.`);
      }

      return repository.transaction(async (transaction) => {
        await transaction.findOrderForUpdate(orderId);
        assertNoOpenFollowUp(await transaction.hasOpenFollowUp(orderId), orderId);

        const requestedAtMs = now();
        const id = await transaction.saveFollowUp({ orderId, requestedByUserId: user.id, personDays, neededByDate, requestedAtMs });
        await transaction.recordActivity({
          type: "follow_up_requested",
          actorUserId: user.id,
          occurredAtMs: requestedAtMs,
          orderId,
          period: neededByDate,
          hours: personDays,
        });
        return { id, orderId, personDays, neededByDate, status: "open" as const, requestedAtMs };
      });
    },

    confirm(user: User, id: number) {
      return repository.transaction(async (transaction) => {
        const request = await transaction.findFollowUpForUpdate(id);
        if (!request) throw new NotFoundError(`Follow-up request ${id} does not exist.`);
        assertFollowUpIsOpen(request.status);

        const confirmedAtMs = now();
        await transaction.confirmFollowUp(id, user.id, confirmedAtMs);
        await transaction.recordActivity({
          type: "follow_up_confirmed",
          actorUserId: user.id,
          occurredAtMs: confirmedAtMs,
          orderId: request.orderId,
          period: null,
          hours: request.personDays,
        });
      });
    },
  };
}

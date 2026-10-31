// Use cases for proofs of work. Only the project lead of an order may read or approve them.
import { ForbiddenError, NotFoundError } from "../domain/errors.ts";
import { assertProofCanBeApproved, toProofOfWork } from "../domain/proofOfWork.ts";
import type { User } from "../domain/user.ts";
import type { BookingRepository } from "../repositories/bookingRepository.ts";

export type ProofOfWorkService = ReturnType<typeof createProofOfWorkService>;

export function createProofOfWorkService(repository: BookingRepository, now: () => number = Date.now) {
  async function assertLeadsOrder(user: User, orderId: string) {
    if (!(await repository.findOrder(orderId))) throw new NotFoundError(`Order ${orderId} does not exist.`);
    if (user.role !== "project_lead" || !(await repository.isOrderLedBy(user.id, orderId))) {
      throw new ForbiddenError(`You may not see the proofs of work of order ${orderId}.`);
    }
  }

  async function listProofs(orderId: string) {
    return (await repository.listProofsOfWork(orderId)).map(toProofOfWork);
  }

  return {
    async listFor(user: User, orderId: string) {
      await assertLeadsOrder(user, orderId);
      return listProofs(orderId);
    },

    // Locks the order first, like a new booking does. A booking and an approval of the same order therefore
    // wait for each other, and a booking cannot slip into a month while it is being approved.
    async approveFor(user: User, orderId: string, month: string) {
      await assertLeadsOrder(user, orderId);

      await repository.transaction(async (transaction) => {
        await transaction.findOrderForUpdate(orderId);
        assertProofCanBeApproved(
          month,
          await transaction.countBookingsInMonth(orderId, month),
          await transaction.isMonthApproved(orderId, month),
        );
        await transaction.approveMonth({ orderId, month, approvedByUserId: user.id, approvedAtMs: now() });
        await transaction.recordActivity({
          type: "proof_approved",
          actorUserId: user.id,
          occurredAtMs: now(),
          orderId,
          period: month,
          hours: null,
        });
      });

      return listProofs(orderId);
    },
  };
}

// The overview for purchasing. It reads only totals per order, so it cannot leak a single booking.
import { NotFoundError } from "../domain/errors.ts";
import { summariseFrameworkAgreements } from "../domain/frameworkAgreement.ts";
import { assertProofApprovedForInvoice, checkInvoice } from "../domain/invoiceCheck.ts";
import { toProofOfWork } from "../domain/proofOfWork.ts";
import { summariseSuppliers } from "../domain/purchasing.ts";
import type { BookingRepository } from "../repositories/bookingRepository.ts";

export type PurchasingService = ReturnType<typeof createPurchasingService>;

export function createPurchasingService(repository: BookingRepository) {
  return {
    async getSupplierOverview() {
      return summariseSuppliers(await repository.listOrderTotals());
    },

    async listFrameworkAgreements() {
      return summariseFrameworkAgreements(await repository.listFrameworkAgreementTotals());
    },

    // Only the total of an approved month is compared, so this reveals no person and no single booking.
    async checkInvoice(orderId: string, month: string, invoicedPersonDays: number) {
      if (!(await repository.findOrder(orderId))) throw new NotFoundError(`Order ${orderId} does not exist.`);

      const proofs = (await repository.listProofsOfWork(orderId)).map(toProofOfWork);
      const approved = proofs.find((proof) => proof.month === month && proof.status === "approved");
      assertProofApprovedForInvoice(approved?.personDays ?? null, orderId, month);
      return checkInvoice(approved?.personDays as number, invoicedPersonDays);
    },
  };
}

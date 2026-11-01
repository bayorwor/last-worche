// The overview for purchasing. It reads only totals per order, so it cannot leak a single booking.
import { NotFoundError } from "../domain/errors.ts";
import { summariseFrameworkAgreements } from "../domain/frameworkAgreement.ts";
import { assertInvoiceNotRecorded, assertProofApprovedForInvoice, checkInvoice } from "../domain/invoiceCheck.ts";
import { toProofOfWork } from "../domain/proofOfWork.ts";
import { summariseSuppliers } from "../domain/purchasing.ts";
import type { User } from "../domain/user.ts";
import type { BookingRepository } from "../repositories/bookingRepository.ts";

export type PurchasingService = ReturnType<typeof createPurchasingService>;

export type RecordInvoiceRequest = { orderId: string; month: string; invoiceNumber: string; invoicedPersonDays: number };

export function createPurchasingService(repository: BookingRepository, now: () => number = Date.now) {
  // Only the total of an approved month is compared, so this reveals no person and no single booking.
  async function findApprovedPersonDays(orderId: string, month: string) {
    if (!(await repository.findOrder(orderId))) throw new NotFoundError(`Order ${orderId} does not exist.`);

    const proofs = (await repository.listProofsOfWork(orderId)).map(toProofOfWork);
    const approved = proofs.find((proof) => proof.month === month && proof.status === "approved");
    assertProofApprovedForInvoice(approved?.personDays ?? null, orderId, month);
    return approved?.personDays as number;
  }

  return {
    async getSupplierOverview() {
      return summariseSuppliers(await repository.listOrderTotals());
    },

    async listFrameworkAgreements() {
      return summariseFrameworkAgreements(await repository.listFrameworkAgreementTotals());
    },

    async checkInvoice(orderId: string, month: string, invoicedPersonDays: number) {
      return checkInvoice(await findApprovedPersonDays(orderId, month), invoicedPersonDays);
    },

    // The order lock makes two saves of one month wait for each other, so the second one finds the first.
    async recordInvoice(user: User, { orderId, month, invoiceNumber, invoicedPersonDays }: RecordInvoiceRequest) {
      const approvedPersonDays = await findApprovedPersonDays(orderId, month);

      await repository.transaction(async (transaction) => {
        await transaction.findOrderForUpdate(orderId);
        assertInvoiceNotRecorded(await transaction.hasInvoice(orderId, month), orderId, month);

        const recordedAtMs = now();
        await transaction.saveInvoice({ orderId, month, invoiceNumber, invoicedPersonDays, approvedPersonDays, recordedByUserId: user.id, recordedAtMs });
        await transaction.recordActivity({
          type: "invoice_recorded",
          actorUserId: user.id,
          occurredAtMs: recordedAtMs,
          orderId,
          period: month,
          hours: invoicedPersonDays,
        });
      });
    },

    async listInvoices() {
      const invoices = await repository.listInvoices();
      return invoices.map((invoice) => ({ ...invoice, ...checkInvoice(invoice.approvedPersonDays, invoice.invoicedPersonDays) }));
    },
  };
}

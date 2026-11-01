// A framework agreement is a long-term contract with a supplier, whose total budget several orders share.
// An order's budget reserves part of it, so the agreement is checked when an order's budget grows. A booking
// never needs this check: the free-budget rule keeps it inside its order, and the order stays inside the agreement.
import { calculateBudget } from "./booking.ts";
import { BusinessRuleError } from "./errors.ts";

export type LockedFrameworkAgreement = { id: string; title: string; totalPersonDays: number };

export type FrameworkAgreementOrderTotals = {
  agreementId: string;
  agreementTitle: string;
  totalPersonDays: number;
  supplierName: string;
  orderId: string;
  title: string;
  orderedPersonDays: number;
  bookedHours: number;
};

// Three decimals, like the database, so adding decimals in binary cannot reject an amount that fits exactly.
function roundPersonDays(personDays: number) {
  return Math.round(personDays * 1000) / 1000;
}

export function assertFitsFrameworkAgreement(agreement: LockedFrameworkAgreement, orderedPersonDays: number, requestedPersonDays: number) {
  const freePersonDays = roundPersonDays(agreement.totalPersonDays - orderedPersonDays);
  if (requestedPersonDays > freePersonDays) {
    throw new BusinessRuleError(
      "framework-budget",
      `Follow-up rejected: framework agreement "${agreement.title}" has only ${freePersonDays} PD free.`,
      { agreement: agreement.title, freePersonDays },
    );
  }
}

// Totals per agreement and order, for purchasing. It holds no person and no single booking.
export function summariseFrameworkAgreements(rows: FrameworkAgreementOrderTotals[]) {
  const agreementIds = [...new Set(rows.map((row) => row.agreementId))];

  return agreementIds.map((agreementId) => {
    const agreementRows = rows.filter((row) => row.agreementId === agreementId);
    const orders = agreementRows.map((row) => {
      const { orderedPersonDays, usedPersonDays } = calculateBudget({ id: row.orderId, orderedPersonDays: row.orderedPersonDays }, row.bookedHours);
      return { orderId: row.orderId, title: row.title, orderedPersonDays, usedPersonDays };
    });
    const orderedPersonDays = roundPersonDays(orders.reduce((total, order) => total + order.orderedPersonDays, 0));
    const first = agreementRows[0] as FrameworkAgreementOrderTotals;

    return {
      id: agreementId,
      title: first.agreementTitle,
      supplierName: first.supplierName,
      totalPersonDays: first.totalPersonDays,
      orderedPersonDays,
      freePersonDays: roundPersonDays(first.totalPersonDays - orderedPersonDays),
      usedPersonDays: orders.reduce((total, order) => total + order.usedPersonDays, 0),
      orders,
    };
  });
}

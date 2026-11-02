# 0018 · Framework agreements and stored invoices

- **Status:** proposed
- **Date:** 2026-11-01
- **Deciders:** Team lastWorche

## Context

The challenge asks to track framework agreements whose budget several orders share, and to check invoices against approved hours and highlight differences. We had left both out, and the invoice check stored nothing. The challenge does not ask for payment, for writing invoices or for managing contract documents, and a real payment would need a paid provider, which the project must not depend on.

## Options considered

**How an agreement's budget is used up:**

1. **An order's budget reserves part of the agreement, checked when a follow-up is confirmed** – the booking path stays as it is, because the free-budget rule keeps a booking inside its order, and the order stays inside the agreement / the agreement must be large enough for all its orders, even if they are not fully booked.
2. **Check every booking against the agreement as well** – shows only hours really used / adds a lock and a rule to every booking, without stopping anything the order's budget does not already stop.
3. **Show totals only, with no rule** – the least code / an agreement could be exceeded with nobody stopped, so it would not steer anything.

**How invoices are kept:**

1. **One stored invoice per order and month, with the approved amount saved next to it** – catches a month being recorded twice, and the difference stays on record / credit notes and part invoices do not fit.
2. **Several invoices per month, added up** – fits part invoices / a double invoice no longer stands out, and needs more rules.
3. **Keep the check only, with no storage** – nothing new to build / the difference is gone once the screen closes.

## Decision

We choose **reservation by the order's budget** and **one stored invoice per order and month**.

- Purchasing's confirmation of a follow-up is rejected when the agreement has too little free. It locks the agreement first, so two confirmations at the same moment cannot use the same free budget.
- Purchasing can now decline a request. Without this, a request the agreement cannot cover would stay open, and the project lead could never ask again.
- An invoice can only be stored for an approved month. Approval locks the month, so the saved approved amount cannot change.
- Purchasing sees totals only, with no person and no day.

We deliberately do not build payment, writing invoices, or contract documents, terms and renewals. They stay outside lastWorche.

## Consequences

- Rules `framework-budget` and `invoice-already-recorded` are new, each with accepting and rejecting tests. Bookings are not changed.
- Agreements are sample data with no screen to edit them, and have no start or end date, because we have no real contract data.
- Declining has no reason text, and a project lead sees it only in recent activity.
- A corrected invoice for a stored month cannot be saved yet, because deleting or replacing one is not built.
- An order without an agreement has no such limit, because `framework_agreement_id` may be empty.
- The sample agreements and the sample request that gets refused ([seedData.ts](../../backend/src/repositories/seedData.ts)) are invented to show the rule, and the team should check them against real contracts.

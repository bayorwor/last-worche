# Pitch

Prepared for the jury presentation (task #31). The brief sets no format here, so adjust the timing to your slot. Everything under *Live demo* was run from a fresh clone, so it works as written.

## The problem

A project lead at a large company buys project work from external suppliers. They only learn how much budget is left when the monthly invoice arrives. By then, the hours are spent, and a booking that broke a rule was found weeks too late.

## Our answer

**lastWorche: every hour you buy, in view.** A consultant books time in one sentence. The server checks the booking against the rules before it is stored, and the project lead sees the effect on the budget at once.

We built it first for the project lead, because that role's daily work improves the most.

## Live demo

Start the app as in the [README](../README.md), and open <http://localhost:5173>. To sign in: enter the email, choose *Send code*, then *Use code*. The test mode box stands in for the email, because these fictional addresses have no mailbox.

| Step | Sign in as | Do this | Point to make |
|---|---|---|---|
| 1 | `l.hoffmann@consultis.example` | Enter `9 bis 5 am Kundenportal, 1 h Mittag`, then *Check proposal* | One sentence becomes a booking the person can correct, and the server shows all 9 rules before anything is saved. |
| 2 | Same | Change the date to `24.12.2026`, then `25.12.2026`, then back to today, and choose *Confirm booking* | **Vacation, then a public holiday.** Each is rejected for this person's calendar and federal state. Then today's hours move towards the 10-hour limit. |
| 3 | Same | Enter the same sentence again, then choose order 4500012346 | **Overlap, then budget:** only 0.5 PD left. An order can no longer be overbooked silently. |
| 4 | `a.weber@client.example` | Open the *Budget* tab of order 4500012345 | Used went from 84 to 84.875 PD at once, not on next month's invoice. **The forecast says when the budget runs out, and to order more in time.** |
| 5 | Same | Enter `1` extra consultant, and *Calculate* | A what-if on the chart, and nothing stored. |
| 6 | Same | Choose *Ask purchasing* | The warning becomes a request. Purchasing confirms it in step 9. |
| 7 | Same | On the *Proofs of work* tab, approve the current month | Approval locks the month, and the file for finance is one click away. |
| 8 | `m.krueger@consultis.example` | Enter the sentence | **Rejected:** "Proof of work already approved — contact the project lead." |
| 9 | `k.vogel@client.example` | Show the supplier overview, then *Follow-up requests*, and confirm | Purchasing sees totals per supplier and order, and no person. Its *Recent activity* shows the approved month with no name. The server enforces this. Confirming raises the budget, and the project lead's warning clears. |
| 10 | Any | Switch between *DE* and *EN* | The product works in both languages, down to the rejection messages. |

Steps 6 and 7 raise the budget request and lock the current month for that order. Rehearse on a working day, because public holidays reject today's bookings. To run the demo again, reset the data as described in the README.

## What makes us different

- **Rules at booking time, on the server:** free budget, assigned orders, order period, approved months, vacation, public holidays per federal state, overlaps, the 10-hour day and 11-hour rest. Each one has tests for accepting and rejecting.
- **The rule check before saving:** the same server rules run on every change, so a consultant sees all problems at once, and what the booking does to the budget.
- **A forecast with its assumptions on screen:** days off count per person, it says "not enough data" rather than invent a date, and a warning turns into a request to purchasing.
- **Book once, not twice:** a supplier's own time tracking can send batches through the same rules, all or nothing.
- **It keeps working without AI:** plain rules read the sentence when the AI service is off or fails.
- **Safe under pressure:** simultaneous bookings cannot get past a rule together. We test this against real MySQL.
- **Privacy by role:** a consultant sees their own bookings, a project lead the orders they lead, and purchasing totals only.
- **Activity by role:** each role sees recent activity next to its work, and the server decides what is in the list.
- **Sign-in with no password:** a 6-digit code by email, so there are no passwords to store or forget.

## Be honest about what is not built

Say these before the jury asks:

- **The forecast assumes a steady pace:** it cannot see a project speeding up or slowing down, and the 4-week lead time for purchasing is an assumption from the story. Purchasing's "Follow-up order needed" is still the simple 10% rule, because a forecast needs single consultants' data that purchasing may not see.
- **The supplier interface** uses a simple key per supplier. Production needs short-lived tokens ([ADR-0017](adr/0017-supplier-interface.md)).
- **The invoice check** compares a figure someone types in. It does not read invoice documents, and we have no finance role yet, so purchasing uses it.
- **Real email sending** is built, but has not been tested against a mail server. The demo uses test mode, and with test mode on, anyone can sign in as anyone.
- **Profile editing** covers the name only. Changing the email address, which people sign in with, is not built.
- **Single sign-on** per customer is our production plan ([ADR-0002](adr/0002-identity-and-sign-in.md)), not part of the demo.

## Questions to expect

| Question | Short answer | Where to show it |
|---|---|---|
| Where do the rules live? | In plain functions in the domain layer, with no framework code | [booking.ts](../backend/src/domain/booking.ts) |
| How do you stop two simultaneous bookings? | One transaction locks the order and the consultant, then checks, then stores | [bookingService.ts](../backend/src/services/bookingService.ts) |
| How do you enforce roles? | Every route names its allowed roles, and the role comes from a signed token | [bookingRoutes.ts](../backend/src/routes/bookingRoutes.ts) |
| Why MySQL, OpenRouter, nodemailer? | Each choice has an ADR with the options we weighed | [ADRs](adr/) |
| What does the AI see? | Only the sentence and today's date, and plain rules read it by default | [ADR-0007](adr/0007-openrouter-ai-gateway.md) |
| How does the forecast work? | It walks through the coming days per consultant, skipping their days off | [forecast.ts](../backend/src/domain/forecast.ts), [ADR-0016](adr/0016-budget-forecast.md) |
| What stops a supplier sending other people's hours? | The key decides the supplier, and any wrong row stores nothing from the batch | [bookingService.ts](../backend/src/services/bookingService.ts), [ADR-0017](adr/0017-supplier-interface.md) |

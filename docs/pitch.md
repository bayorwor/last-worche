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
| 1 | `l.hoffmann@consultis.example` | Enter `9 bis 5 am Kundenportal, 1 h Mittag`, then *Check proposal* and *Confirm booking* | One sentence becomes a booking. The person confirms it, and today's hours move towards the 10-hour limit. |
| 2 | Same | Confirm the same proposal again | **Overlap rejected.** The rule runs on the server, before anything is stored. |
| 3 | Same | Choose order 4500012346, and confirm a proposal | **Budget rejected:** only 0.5 PD left. An order can no longer be overbooked silently. |
| 4 | `a.weber@client.example` | Open order 4500012345 | Used went from 84 to 84.875 PD. The booking is there at once, not on next month's invoice. |
| 5 | Same | Under *Proofs of work*, approve the current month | Approval locks the month. |
| 6 | `m.krueger@consultis.example` | Try to book | **Rejected:** "Proof of work already approved — contact the project lead." |
| 7 | `k.vogel@client.example` | Show the supplier overview | Purchasing sees totals per supplier and order, and no person. The server enforces this. |
| 8 | Any | Switch between *DE* and *EN* | The product works in both languages, down to the rejection messages. |

Steps 5 and 6 lock the current month for that order. To run the demo again, reset the data as described in the README.

## What makes us different

- **Rules at booking time, on the server:** free budget, assigned orders, overlaps, the 10-hour day, 11-hour rest and approved months. Each one has tests for accepting and rejecting.
- **Safe under pressure:** simultaneous bookings cannot get past a rule together. We test this against real MySQL.
- **Privacy by role:** a consultant sees their own bookings, a project lead the orders they lead, and purchasing totals only.
- **Sign-in with no password:** a 6-digit code by email, so there are no passwords to store or forget.

## Be honest about what is not built

Say these before the jury asks:

- **The budget forecast and early warning** (stories #10 and #14) are in our vision but not built. "Follow-up order needed" is a simple stand-in: 10% or less of the budget is free.
- **Vacation, public holidays and the order period** (stories #8 and #12) are not checked yet.
- **Real email sending** is built, but has not been tested against a mail server. The demo uses test mode, and with test mode on, anyone can sign in as anyone.
- **Single sign-on** per customer is our production plan ([ADR-0002](adr/0002-identity-and-sign-in.md)), not part of the demo.

## Questions to expect

| Question | Short answer | Where to show it |
|---|---|---|
| Where do the rules live? | In plain functions in the domain layer, with no framework code | [booking.ts](../backend/src/domain/booking.ts) |
| How do you stop two simultaneous bookings? | One transaction locks the order and the consultant, then checks, then stores | [bookingService.ts](../backend/src/services/bookingService.ts) |
| How do you enforce roles? | Every route names its allowed roles, and the role comes from a signed token | [bookingRoutes.ts](../backend/src/routes/bookingRoutes.ts) |
| Why MySQL, OpenRouter, nodemailer? | Each choice has an ADR with the options we weighed | [ADRs](adr/) |
| What does the AI see? | Only the sentence and today's date, and it runs on a mock by default | [ADR-0007](adr/0007-openrouter-ai-gateway.md) |

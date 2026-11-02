# Product vision

> Filled in on Friday, 30 Oct 2026, in Sprint 1 planning. See the sprint goal in issue #16 of this repository.

## Product name

lastWorche — "Jede Stunde im Blick" (every hour you buy, in view).

## In one sentence

For **project leads at large client companies**, who **only learn how much external-consultant budget is left when the monthly invoice arrives**, our product **lastWorche** is a **time-booking and budget-steering product** that **records every booked hour against its order and shows the effect on the remaining budget immediately, while enforcing the budget and working-time rules at booking time**. Unlike spreadsheets and the old tool, it **checks every booking server-side before it is stored and forecasts when each order's budget will run out**.

## Who we build for first

The **project lead** on the client side — the role whose daily work we improve most: they steer external service-provider budgets and approve proofs of work.

## Roles

| Role | Side (client / supplier) | What they want from the product |
|---|---|---|
| Consultant (Berater) | supplier | Book time on assigned orders in seconds, from anywhere; see their own day limits (ArbZG). |
| Project lead (Projektleitung) | client | Check every booking, approve proofs of work, see and steer the budget of each order. |
| Purchasing (Einkauf) | client | Manage framework agreements and supplier dependency on aggregated numbers only. |

## The core flow

1. A consultant books time in one sentence (e.g. "9 bis 5 am Kundenportal, 1 h Mittag") on one of their assigned orders; the system parses the sentence into a booking proposal the consultant confirms.
2. The server checks the booking against the business rules before storing it: free budget of the order, overlapping bookings of the same person, 10-hour day and 11-hour rest period (ArbZG), approved vacation and public holidays, order period. Rejected bookings show a clear error message and are never stored.
3. The accepted booking appears immediately in the order's booking list and moves the order's used and free person-days.
4. The project lead sees the new budget state at once, plus a forecast of when the budget will be exhausted — including vacations, public holidays and shutdowns — and an early warning to place a follow-up order in time.
5. At month end the project lead approves the proof of work; only approved hours are passed on to finance for payment.

## What makes us special

- **Rules are enforced server-side at booking time**, not discovered at invoice checking: free budget, overlapping bookings, ArbZG 10-hour day, 11-hour rest, vacation/holidays, order period.
- **One-sentence booking**: the consultant types a natural sentence; lastWorche proposes the structured booking and the person only confirms.
- **Budget forecast with early warning**: the project lead knows weeks in advance when a follow-up order is needed.

## What we leave out on purpose

- Writing invoices and payment processing — we check and store what a supplier invoices, and stop there ([ADR-0018](adr/0018-framework-agreements-and-invoices.md)).
- Contract management: documents, terms and renewals — a framework agreement is tracked only as a budget that several orders share.
- Full SSO/IdP integration — seeded test users sign in with a code by email instead (decisions in [ADR-0002](adr/0002-identity-and-sign-in.md) and [ADR-0014](adr/0014-email-code-sign-in.md)).
- Native mobile apps — responsive web is enough.
- Reporting/BI beyond the per-order forecast.

## Our track

Working code (see [guide 1.3](https://github.com/DanielStuewe/article26-hackathon-2026/blob/main/docs/guide.md#13-choose-your-track)). On Friday we shipped the clickable mockup at [mockup/index.html](mockup/index.html). On Saturday the core flow (issues #2, #9, #15) became a walking skeleton. The [status table in the README](../README.md#status) shows what is built and what is planned.

## Our stack

TypeScript throughout: Bun, Express and MySQL on the server, React, Vite, Redux Toolkit and Tailwind CSS in the client, OpenRouter for AI and nodemailer for email. See [ADR-0001](adr/0001-technology-stack.md), [ADR-0006](adr/0006-mysql-database.md), [ADR-0007](adr/0007-openrouter-ai-gateway.md) and [ADR-0008](adr/0008-email-with-nodemailer.md). Constraints from the sprint plan: one language and everything runnable from the README in under 5 minutes. The plan's original choice of SQLite was later replaced by MySQL.

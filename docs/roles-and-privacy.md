# Roles, permissions and data privacy

> Filled in on Friday, 30 Oct 2026 (task #17). See [guide 2.4](https://github.com/DanielStuewe/article26-hackathon-2026/blob/main/docs/guide.md#24-roles-and-privacy). Full points are possible with this concept alone. Implementation is optional.

## Roles

| Role | Side | Description |
|---|---|---|
| Consultant (Berater) | supplier | External person who books own working time on assigned orders. |
| Project lead (Projektleitung) | client | Responsible for one or more orders: checks single bookings, approves proofs of work, steers the budget. |
| Purchasing (Einkauf) | client | Manages framework agreements and supplier dependency; works on aggregated values only. |
| Finance (Buchhaltung) | client | Receives approved proofs of work for invoice checking (expansion stage — no separate screens in the MVP). |

## Role matrix

`✔` = allowed, `–` = not allowed, `Σ` = only aggregated values

| Action or data | Consultant | Project lead | Purchasing |
|---|---|---|---|
| Book own working time | ✔ | – | – |
| See own bookings | ✔ | – | – |
| See single bookings of a project | ✔ (own only) | ✔ (orders they lead) | – |
| See hours per order (aggregated) | ✔ | ✔ | ✔ |
| See per-person daily hours | ✔ (own) | ✔ (their orders) | Σ only |
| Approve proof of work | – | ✔ | – |
| Ask for a follow-up order | – | ✔ (orders they lead) | – |
| Confirm or decline a follow-up order. Confirming raises the budget | – | – | ✔ |
| See framework agreements with their orders | – | – | ✔ (totals only) |
| See the budget forecast | – | ✔ (orders they lead) | – |
| Check and store an invoice against an approved month | – | – | ✔ (totals only) |
| Download an approved month for finance | – | ✔ (orders they lead) | – |
| See recent activity | ✔ (own) | ✔ (own, and their orders) | Own, and approved months and follow-up requests per order, with no names. Stored invoices appear for the person who stored them and for the order's project lead |
| Change own name | ✔ | ✔ | ✔ |
| See consultant name and supplier | ✔ (own) | ✔ | Σ (supplier level only) |

## Personal data

| Data | Why we store it | Who needs it | How long we keep it |
|---|---|---|---|
| Daily hours per person (booking: date, start and end time, duration, description, order, accounting object) | Work checking and legally required proof of work | Consultant (own), project lead (their orders) | 10 years per HGB §257, then anonymised |
| Email of a user, and a hash of their sign-in code | Signing in. There are no passwords, and the code itself is never stored | The sign-in only | Email while the account exists; a code until used or replaced |
| Name and supplier of a consultant | Assignment of bookings and contact | Project lead; purchasing only at supplier level | Duration of the order, then retention above |
| Activity log: who signed in, changed their profile, booked or approved, and when | Showing recent activity | The person themselves; project lead for their orders; purchasing only approved months and follow-up requests, with no name | Not decided yet, and nothing deletes it ([ADR-0015](adr/0015-activity-log.md)) |
| Approved vacation days of a consultant, and their federal state | Rule check: no bookings on vacation or public holidays; forecast | Server (rule engine). A project lead only sees the total number of days in a forecast | Duration of the order |
| Working-time totals per day (ArbZG check) | Legal compliance: 10 h day, 11 h rest | Server (rule engine); project lead as day view | 10 years per HGB §257 |

## Conflicts and how we resolve them

- **Transparency for the project lead vs. privacy of the consultant.** The project lead needs single bookings to check work and approve proofs of work; the consultant should not be exposed more than necessary. Resolution: single bookings are visible to the consultant themselves and to the project lead of the affected order — nobody else. Purchasing and all other roles only see aggregates (Σ). The necessity is documented in the role matrix above.
- **Client insight vs. supplier confidentiality.** The client sees who worked and how much, but never the consultant's internal employment data at the supplier (salary, other clients, internal evaluations).
- **Rule enforcement vs. goodwill.** A rejected booking is never silently softened. The rejection message names the rule that fired, so the parties can solve the situation openly (e.g. move hours to the next day) — the client company stays compliant with the ArbZG.

## How it is enforced

All permission checks run **server-side**, in the domain/API layer, before any write or read of personal data (stories #15 and #13; implementation lands with tasks #24, #25 and the Sunday rule tasks #27–#29):

- Every API route declares its required role; middleware resolves the role from the session and rejects with a permission error (HTTP 403) before the handler runs.
- Row-level restriction: a consultant's query scope is limited to their own bookings; a project lead's to the orders they lead. There is no endpoint that returns single bookings to purchasing — aggregates only.
- Writes pass the rule engine in the same server-side validation step as the permission check, so a manipulated client cannot bypass either.

Status: **built for the demo.** The role and consultant come from the signed session of the email code sign-in ([ADR-0014](adr/0014-email-code-sign-in.md)), each route in [bookingRoutes.ts](../backend/src/routes/bookingRoutes.ts) names its allowed roles, row-level scope is in [bookingService.ts](../backend/src/services/bookingService.ts), and [app.test.ts](../backend/src/app.test.ts) tests the rejections over real HTTP requests. With the default `MAIL_MOCK=true`, the sign-in screen shows the code, so these checks show the design but do not protect real data until real email is on. Purchasing reads only [totals per order and supplier](../backend/src/domain/purchasing.ts). Recent activity takes the user from the session, and [activity.ts](../backend/src/domain/activity.ts) removes other people's names for purchasing. A person can only change their own name: email, role and any other field in the request are ignored. A forecast is built from single consultants' data, so only the order's project lead receives it. The invoice check compares totals of an approved month, so it reveals no person to purchasing, and a stored invoice holds no consultant. [frameworkAgreement.ts](../backend/src/domain/frameworkAgreement.ts) returns totals per agreement and order only. A supplier's key only reaches that supplier's consultants and orders ([ADR-0017](adr/0017-supplier-interface.md)).

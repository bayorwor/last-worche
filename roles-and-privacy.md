# Roles, permissions and data privacy

> Filled in on Friday, 30 Oct 2026 (task #17). See [guide 2.4](guide.md#24-roles-and-privacy). Full points are possible with this concept alone. Implementation is optional.

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
| Trigger follow-up order | – | ✔ | ✔ |
| See consultant name and supplier | ✔ (own) | ✔ | Σ (supplier level only) |

## Personal data

| Data | Why we store it | Who needs it | How long we keep it |
|---|---|---|---|
| Daily hours per person (booking: date, duration, description, order, accounting object) | Work checking and legally required proof of work | Consultant (own), project lead (their orders) | 10 years per HGB §257, then anonymised |
| Name and supplier of a consultant | Assignment of bookings and contact | Project lead; purchasing only at supplier level | Duration of the order, then retention above |
| Approved vacation days of a consultant | Rule check: no bookings on vacation | Server (rule engine), project lead | Duration of the order |
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

Status: **concept complete** (this document); implementation optional and scheduled for Sunday.

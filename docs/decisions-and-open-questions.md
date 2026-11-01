# Decisions on the challenge's tensions, and what is still open

The [challenge](https://github.com/DanielStuewe/article26-hackathon-2026/blob/main/docs/challenge.md) names five tensions a product like this has to resolve. This page records our decision on each, and what we have deliberately not decided yet. Issues #72 and #74 on the board hold the same content.

## The five tensions

| Tension | Our decision | The price we accept | Evidence |
|---|---|---|---|
| **Transparency vs. privacy.** Daily hours and vacation plans are personal data. Who sees what? | Single bookings are visible to the consultant and the project lead of that order. Purchasing sees totals per supplier and order, never a person or a day. In a forecast, the project lead sees the total number of vacation days. | The project lead does see named daily hours, because approving a proof of work needs them. | [Roles and privacy](roles-and-privacy.md), [purchasing.ts](../backend/src/domain/purchasing.ts), [activity.ts](../backend/src/domain/activity.ts), tests in [app.test.ts](../backend/src/app.test.ts) |
| **Control vs. not becoming the employer.** How much detail does the client really need? | The client steers budget in person-days per order, and nothing in the product assigns anyone a time or a task. The 10-hour day and 11-hour rest are checked on the server, so nobody at the client has to enforce them by hand. | Showing named bookings to the project lead is still more detail than person-days per order. We have not had this legally checked. | [Roles and privacy](roles-and-privacy.md), [booking.ts](../backend/src/domain/booking.ts) |
| **Precision vs. effort.** Exact times or half person-days? | Start and end times with a break in minutes, stored as hours with two decimals. The rest periods can only be checked with real times. One-sentence booking keeps the effort low. | A booking takes more input than a half-day tick box. | Migration `004-booking-times` in [migrations.ts](../backend/src/repositories/migrations.ts), [bookingTimes.ts](../client/src/features/bookings/bookingTimes.ts), [bookingSentence.ts](../backend/src/domain/bookingSentence.ts) |
| **One system vs. two.** Do people book twice? | A supplier's own time tracking sends batches through the same rules, all or nothing, so people book once. | Each supplier has to connect to our interface. | [ADR-0017](adr/0017-supplier-interface.md), [bookingService.ts](../backend/src/services/bookingService.ts) |
| **Clear forecast vs. honest uncertainty.** How do you show it without being vague? | The forecast walks through the coming days per consultant, shows its assumptions on screen, and says "not enough data" instead of inventing a date. | A long break in bookings lowers the pace, so a forecast can look better than the real plan. | [ADR-0016](adr/0016-budget-forecast.md), [forecast.test.ts](../backend/src/domain/forecast.test.ts) |

Further conflicts and how we resolve them are in [roles and privacy](roles-and-privacy.md#conflicts-and-how-we-resolve-them).

## What we have deliberately not decided yet

None of these is forgotten. Each has a trigger that would move it forward.

| Open question | Why it is open | What would decide it |
|---|---|---|
| Single sign-on per customer identity provider | Every customer brings a different one, and the demo cannot require one | The first real customer names their provider ([ADR-0002](adr/0002-identity-and-sign-in.md)) |
| OAuth 2.0 client credentials for the supplier interface | A key per supplier is simple to set up, while production needs short-lived tokens | Going live with the first real supplier integration ([ADR-0017](adr/0017-supplier-interface.md)) |
| Sick-leave rules, like the vacation rules | Vacation days are stored, but sick days need a source we don't have yet | A data source for sick days, or the supplier entering them like vacation |
| Budget warnings by email | The email service exists ([ADR-0008](adr/0008-email-with-nodemailer.md)) but has not been tested against a real server | First item of Sprint Two |
| Changing the sign-in email address | It needs a confirmation code sent to the new address, and nothing sends one yet | The profile work after Sprint One |
| Deleting old activity-log entries | Retention for the log is not decided, and nothing deletes it yet | The client's retention policy ([ADR-0015](adr/0015-activity-log.md)) |
| Framework agreements shared by several orders | Purchasing's real contract data is not available in the demo | Real contract structures from purchasing |
| Containers for deployment | Declined for the demo, because the jury runs the product from the README without Docker ([ADR-0011](adr/0011-mysql-without-docker.md)) | A customer requiring containerised deployment |
| Whether to keep the iOS and Android app projects | The [product vision](product-vision.md#what-we-leave-out-on-purpose) rules out native apps, yet the client includes Capacitor projects that wrap the same web client | A team decision, to be recorded as an ADR |

## Left out on purpose

These are not open: invoice payment, contract management, and reporting beyond the forecast. The reasons are in the [product vision](product-vision.md#what-we-leave-out-on-purpose).

# 0015 · An activity log for recent activity

- **Status:** proposed
- **Date:** 2026-10-31
- **Deciders:** Team lastWorche

## Context

Every role should see recent activity next to its dashboard. A booking only stores the day it covers, not when it was made, and a sign-in or profile change is stored nowhere. Each role may see different things, and purchasing must never see a single booking or another person's name ([roles and privacy](../roles-and-privacy.md)).

## Options considered

1. **One `activity_log` table** – one place to read, with true times, and every kind of event fits / a second record to keep in step with the bookings.
2. **Build the list from existing tables** – no new table / bookings would need a new time column, sign-ins and profile changes would still need storing, and each role's list would combine several queries.
3. **Keep the activity in the browser only** – nothing to store / it disappears on another device, and a project lead could not see what consultants did.

## Decision

We choose **one `activity_log` table**.

- A booking and an approval write their entry in the same transaction, so a rejected one is never logged.
- `GET /api/activity` takes the user only from the session. A consultant gets their own entries, a project lead also everything on the orders they lead, and purchasing also approved months per order.
- Purchasing never receives booking entries, and anyone else's name is removed on the server.
- Migration 010 copies existing bookings and approvals into the log, using the end of the booked time as an estimate of when each was made.

## Consequences

- A sign-in is now stored personal data, listed in the [privacy table](../roles-and-privacy.md). How long to keep the log has to be decided before real use; nothing deletes it yet.
- Code that writes a booking or an approval must also write its entry. `bookingService` and `proofOfWorkService` are the only places that do.
- A name change is logged right after it is saved, outside its transaction, so a failure there could lose that one entry. It does not protect a rule, so this is acceptable.

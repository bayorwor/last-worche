# 0019 · Weekly email digest: a command run by the scheduler, with explicit opt-in

- **Status:** proposed
- **Date:** 2026-11-02
- **Deciders:** the team, to confirm

## Context

Issue #64 asks for a weekly email per order to its project lead, with used and free person-days, the forecast's run-out week and any warnings. Something has to start it once a week, and it must never email someone who did not ask for it. [ADR-0003](0003-operation-and-scaling.md) plans for several backend servers, and the jury runs the product from the README with no extra services. Email goes through nodemailer with `MAIL_MOCK` ([ADR-0008](0008-email-with-nodemailer.md)).

## Options considered

1. **A command, `bun run digest`, started by the operating system's scheduler (cron, or a scheduled task)** – no new library and nothing running in the background, easy to start by hand in a demo. Someone has to set up the schedule where the product runs.
2. **A timer inside the backend** – nothing to set up, but every backend server would send the same emails, and a restart at the wrong moment skips a week.
3. **A job queue such as BullMQ** – retries and monitoring, but it needs Redis, which the README run check does not allow.

## Decision

We choose **option 1**. The command sends once and stops. Each sent digest is stored per project lead, order and ISO week (migration `015-weekly-digest`), so a second run in the same week, or two servers starting it, send nothing new. A failed email is not stored, so the next run tries it again.

Sending needs **explicit opt-in**. A project lead turns it on for themselves in their profile, and the server only accepts `{ "subscribed": true }`: a missing or other value is refused with 400, other roles with 403, and the person always comes from the session. Nobody is subscribed by migration or sample data, and turning it off deletes the row.

## Consequences

- Production needs a schedule entry, such as `0 7 * * 1 cd /path/to/backend && bun run digest` (Monday 07:00).
- The email is in German and English, because no language is stored per person yet.
- The digest holds totals per order and no consultant's name, so it shows the lead less than the app does.
- With `MAIL_MOCK=true` the email is printed in the backend's log instead of sent.

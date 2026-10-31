# 0014 · Sign-in with a code sent by email

- **Status:** accepted, replaces the passwords in [ADR-0013](0013-email-and-password-sign-in.md)
- **Date:** 2026-10-31
- **Deciders:** Team lastWorche

## Context

The team wants people to enter their email, receive a 6-digit code and confirm it, with no password. Consultants and project leads then need nothing new to remember, and we store no passwords. The product must still start with no mail server and no paid account, and the seeded test addresses have no mailbox.

## Options considered

1. **A 6-digit code by email** – no passwords to store or reset, and it uses the existing nodemailer setup / it depends on email arriving, and six digits need strict limits against guessing.
2. **A sign-in link by email** – one click / a link opened on another device than the one signing in is awkward, and it does not work well inside the mobile app.
3. **Keep passwords** – no dependency on email / we would keep storing password hashes, and would still need a reset flow that uses email.

## Decision

We choose **a 6-digit code by email**.

- `POST /api/auth/request-code` creates a random code and emails it. It answers the same for an unknown email.
- `POST /api/auth/verify-code` checks the code and returns the signed session token.
- A code is stored only as a keyed hash, is valid for 10 minutes, works once and allows 5 attempts. A new code replaces the old one.
- With real email, a new code can be requested once per minute.

**Test mode:** with `MAIL_MOCK=true`, no email is sent, so the response also contains the code and the sign-in screen shows it. With `MAIL_MOCK=false`, the code only ever goes to the inbox.

## Consequences

- People cannot sign in when email is down. A failed sending is logged but not shown, because showing it would reveal which addresses have an account.
- `MAIL_MOCK=true` lets anyone sign in as any user, so a shared or production server must use `MAIL_MOCK=false` and `TEST_ACCOUNTS_ENABLED=false`.
- The limits apply per code and per account. There is no limit per network address yet, which real use needs, and repeated requests can keep replacing a person's code.
- The first feature to use [ADR-0008](0008-email-with-nodemailer.md) is the sign-in. Real sending needs SMTP settings and real addresses instead of the seeded `.example` ones.
- Roles and users stay in the database, as ADR-0013 decided. The production plan is unchanged: single sign-on per customer, as proposed in [ADR-0002](0002-identity-and-sign-in.md).

# 0008 · Email with nodemailer

- **Status:** accepted for the tool, the features are still open
- **Date:** 2026-10-31
- **Deciders:** Team lastWorche

## Context

Several flows could notify people by email: a budget that is running out, a proof of work waiting for approval, or a rejected booking. Customers are large companies that often run their own mail servers. The jury starts the product without any paid account or mail server.

## Options considered

1. **nodemailer with SMTP** – free, works with any mail server including the customer's own / we run no delivery tracking or templates, and need SMTP details per deployment.
2. **Hosted email API** – delivery tracking and templates included / needs a paid account and sends data to another company.
3. **No email, only messages in the product** – nothing to set up / people only learn about a budget problem when they open the product, which is what lastWorche wants to avoid.

## Decision

We choose **nodemailer**, behind `sendEmail` in `emailService.ts`. `MAIL_MOCK=true` is the default and writes to the server log, so no mail server is needed.

Planned uses, none of them built yet:

- Budget early warning to the project lead
- Proof of work ready for approval, and approved
- Booking rejected, to the consultant
- Emails in the single sign-on process, for example inviting a consultant to sign in for the first time ([ADR-0002](0002-identity-and-sign-in.md))

## Consequences

- No feature sends email yet, because lastWorche has no user records with addresses. Those come with sign-in.
- Emails can carry personal data, so each one must follow [roles-and-privacy.md](../roles-and-privacy.md). For example, an email to purchasing must never name a consultant's daily hours.
- Sending should not make a booking fail. When the first feature is connected, a mail error must be logged, not returned to the user.

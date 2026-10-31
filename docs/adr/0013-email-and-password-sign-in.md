# 0013 · Email and password sign-in

- **Status:** the passwords are replaced by [ADR-0014](0014-email-code-sign-in.md). Roles and users in the database still apply, and this replaced the demo sign-in in [ADR-0002](0002-identity-and-sign-in.md)
- **Date:** 2026-10-31
- **Deciders:** Team lastWorche

## Context

ADR-0002 chose a demo sign-in where people pick a seeded user, with no password. The team wants testers to sign in with real credentials, against user accounts stored in the database, and wants roles and users to come from the backend. The product must still start with no paid account or outside service.

## Options considered

1. **Accounts with passwords in our database** – a real sign-in with no outside service / we store password hashes, and need password reset and login limits before any real use.
2. **Keep picking a demo user** – the least code / testers do not experience a real sign-in, and anyone is anyone.
3. **OpenID Connect now** – the production plan in ADR-0002 / needs an identity provider, so the jury could not start the product with no setup.

## Decision

We choose **accounts with passwords in our database**. `users` holds an email and a password hash, and `roles` holds each role's name and description in German and English. Passwords are hashed with Bun's built-in `Bun.password` (Argon2id), so no new package is needed. A correct password earns the same signed session token as before.

Seeded test accounts share one password, documented in the README. `GET /api/auth/test-accounts` lists them for the sign-in screen, and `TEST_ACCOUNTS_ENABLED=false` switches that off.

## Consequences

- The test password and accounts are public on purpose, so they prove the flow but protect nothing. They must never reach a production deployment, and the users are fictional.
- There is no password reset, account creation, or limit on sign-in attempts yet. Each is needed before real use.
- Role names and descriptions can change in the database, but what a role may do stays in code, in the route guards and `bookingService`. A new role therefore needs code as well as a new row.
- The production plan is unchanged: single sign-on per customer, as proposed in ADR-0002.

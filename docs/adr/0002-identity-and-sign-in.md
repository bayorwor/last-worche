# 0002 · Identity and sign-in

- **Status:** accepted for the demo, proposed for production
- **Date:** 2026-10-31
- **Deciders:** Team lastWorche

## Context

The client is a large company that wants single sign-on with its own identity provider, and each customer may use a different one. Consultants complicate this, because they work for suppliers and are usually not in the client's directory. For the demo, the jury must be able to start the product without any external account. The [product vision](../product-vision.md) leaves full SSO out of the hackathon scope.

## Options considered

1. **Seeded demo users with a simple sign-in** – starts with no setup and shows real role differences / not usable in production.
2. **Own accounts with passwords** – no external dependency / we would store credentials, and large clients want their own sign-in rather than another password.
3. **OpenID Connect with one configuration per customer** – a standard most identity providers support, so a new customer needs configuration rather than code; SAML-only providers can connect through a broker / needs a real provider to test, too much for the demo.

## Decision

- **Demo:** we choose **option 1**: one seeded demo user per role, who signs in and receives a signed session token (`jsonwebtoken`). The server reads the role and user from that token and from nothing else.
- **Production (proposed):** we choose **option 3**, with the issuer and client ID configured per customer. Roles come from the customer's identity provider and from order assignments in lastWorche. Consultants sign in through a guest account in the client's provider or through their supplier's provider; which of these is an open question for the first customer.

## Consequences

- The domain and permission checks only see a user and a role, so replacing the demo sign-in does not change them.
- **Built for the demo:** the sign-in screen lists the seeded demo users, and choosing one starts a session with no password. The token lasts 8 hours and is kept in the browser's `localStorage`, so a script injected into the page could read it. That is acceptable for sample data, not for production.
- Demo users must never reach a production deployment.
- The single sign-on process uses email through nodemailer ([ADR-0008](0008-email-with-nodemailer.md)), for example to invite a consultant to sign in for the first time. The sign-in itself and its security stay with the identity provider, so these emails never carry passwords.

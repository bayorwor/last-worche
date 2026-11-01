# 0017 · How a supplier's time tracking sends hours

- **Status:** proposed
- **Date:** 2026-11-01
- **Deciders:** Team lastWorche

## Context

Consultants should book once, not twice: a supplier's own time tracking should be able to send hours (story #33). Such a system has no person who could confirm an emailed sign-in code. A batch must either be stored completely or not at all, and each row must pass the same rules as a booking made by hand.

## Options considered

1. **A secret key per supplier, in a request header** – simple for a supplier's administrator to set up, and easy to explain / a key lasts until it is replaced, so it needs care, and has no individual rights.
2. **OAuth 2.0 client credentials** – short-lived tokens and the common choice for production / needs an identity provider or much more code, which a demo that must start in 5 minutes cannot require.
3. **A CSV upload by a person** – no secret to manage / someone still does the work twice, which is the problem the story describes.

## Decision

We choose **a secret key per supplier** for now, sent as `X-Api-Key` to `POST /api/integrations/time-tracking/bookings`, with the keys in `SUPPLIER_API_KEYS`.

- The key decides which supplier is speaking, never the request body. Consultants and orders of another supplier are rejected.
- The batch is one transaction. Any rejected row stores nothing from the batch, and the error names the row.
- The same consultant, date, order and duration sent again is rejected as a duplicate.

## Consequences

- The defaults are demo keys and must be replaced on any shared server. For production, this should move to OAuth 2.0 client credentials together with the single sign-on work in [ADR-0002](0002-identity-and-sign-in.md).
- Two real bookings with the same consultant, day, order and duration, one in the morning and one in the afternoon, are rejected as duplicates in a batch, because the story defines a duplicate this way.
- A batch of up to 500 rows holds its locks until it finishes, so bookings on those orders wait briefly.

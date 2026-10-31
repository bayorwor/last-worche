# 0003 · Operation and scaling

- **Status:** proposed
- **Date:** 2026-10-31
- **Deciders:** Team lastWorche (to confirm)

## Context

Customers are large companies. Some accept a hosted product, while others require operation inside their own infrastructure. lastWorche stores daily working hours of named people, which is personal data that must be kept for 10 years ([roles-and-privacy.md](../roles-and-privacy.md)). The expected load is low: even 10,000 bookings per month is only about one booking per minute during working hours. Reads are small aggregates per order.

## Options considered

1. **Shared cloud service for all customers** – easy to update, one operation team / customer data sits together, so every query must separate tenants, and customers who require their own infrastructure are lost.
2. **Installation at the customer only** – full data control for the customer / every update and support case depends on the customer's IT, and there is no hosted offer.
3. **One container image, one isolated instance per customer, hosted by us or by the customer** – the same product in both places, and data stays separated by design / more instances to update and monitor.

## Decision

We propose **option 3**. Each customer gets their own instance and database, hosted in the EU or at the customer's site. The API remains stateless, so an instance can run behind a load balancer if needed.

Each instance uses its own MySQL database ([ADR-0006](0006-mysql-database.md)), which also supports several API processes. Scaling starts with a larger instance, since the expected load does not justify more.

## Consequences

- Tenant separation needs no extra code, and a customer's data can be exported or deleted as a whole.
- We must automate updates and monitoring across instances, and automate backups for the 10-year retention.
- Rolling out schema changes across instances needs a migration tool, which we do not have yet.
- **Not built yet.** There is no container image for the application. The Compose file starts only the database.

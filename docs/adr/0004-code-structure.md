# 0004 · Code structure

- **Status:** accepted
- **Date:** 2026-10-31
- **Deciders:** Team lastWorche

## Context

Business rules must live in one place in the domain and be testable without a server. API objects, domain objects and persistence must be recognisably apart. Several people change the code at the same time, and each must be able to explain every file to the jury. Each role should download only its own screen.

## Options considered

1. **Layered backend and feature-based client** – each rule and screen has an obvious place, and rules can be tested without Express or a database / more files and some passing of data between layers, even for simple cases.
2. **Flat structure, with one folder per file type and logic in the route handlers** – fastest to start / rules spread across handlers, which is what the jury marks down, and they can only be tested through HTTP.
3. **Full hexagonal architecture** – the strictest separation / many more interfaces and adapters than a four-day project needs, and harder for juniors to explain.

## Decision

We choose **option 1**.

- **Backend:** `routes → controllers → services → domain`, with services using storage through the interface in `repositories/`. `dtos/` holds what crosses HTTP. `domain/` imports no framework or database code. See the [backend README](../../backend/README.md).
- **Client:** `features/<feature>/` holds pages, components, API calls and state for one area, and `shared/` holds what several features use. Features do not import each other. Each page loads with `lazy()`, so each role gets its own chunk. See the [client README](../../client/README.md).
- **Size limit:** no client file may exceed 450 lines. `bun run lint` fails if one does.

## Consequences

- Rules are tested as plain functions, and tests of the service run against an in-memory repository, with no database.
- A new endpoint touches several files, even when it does little.
- Only the size limit is checked automatically. The import rules between layers and features rely on code review.
- Page splitting does not shrink the shared main chunk (about 130 kB gzipped), which holds React, the router, Redux and axios.

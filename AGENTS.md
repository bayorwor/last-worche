# AGENTS.md

Instructions for AI coding agents working in this repository.

## Context

lastWorche is the team's product for the Article26 Hackathon 2026, which ends on Tuesday 3 Nov 2026 at 11:00. It is a time booking and budget-steering product for a large company that buys project work from external service providers. The hackathon's [brief, scoring and guide](https://github.com/DanielStuewe/article26-hackathon-2026/tree/main/docs) are in the template repository.

Read these before proposing anything substantial: [product vision](docs/product-vision.md), [domain model](docs/domain.md), [roles and privacy](docs/roles-and-privacy.md) and the [ADRs](docs/adr/).

## How to work with this team

- The team members are junior developers who must be able to explain every file to the jury. Explain briefly why, not only what.
- Work in small steps: one entity, one rule or one screen at a time. After each step, give the exact command to check it.
- For real technology, architecture or design choices, show 2–3 options with pros and cons and let the team decide.
- Do not invent facts about the product. Ask.

## Rules

1. **Commits:** one-line messages only (`feat|fix|docs|test: …`), with no body. Do not commit unless what is being committed is clearly understood. Commits must be spread over the hackathon days, at least two per day.
2. **Decisions become ADRs:** offer one in `docs/adr/`, from `0000-template.md`, whenever a technology, library, database, hosting option or pattern is chosen.
3. **Structure:** keep API DTOs, domain objects and persistence apart, as described in [ADR-0004](docs/adr/0004-code-structure.md).
4. **Business rules** live in `backend/src/domain/`, are enforced on the server and return an understandable error. Each rule has a test for accepting and for rejecting.
5. **Permissions** are checked on the server. Hiding a button or a tab is not a permission check.
6. **Data** survives a restart. Seed data and one demo user per role are created automatically.
7. **Configuration** lives in `.env.example` with safe defaults. Never commit secrets or real personal data. Nothing may need a paid account or API key. AI (`AI_MOCK`) and email (`MAIL_MOCK`) keep their mock switches.
8. **README first:** when a command to install, run or test changes, update the README in the same step, and keep its evidence map and status table current. The jury starts the product from the README alone, within 5 minutes.
9. **Client size and naming:** no client file may exceed 450 lines (`bun run lint` enforces this). Split code properly and use clear, descriptive names for files, functions and components.
10. **Product name:** always write `lastWorche`. The repository folder is `last-worche` because of its URL.

## Project facts

- Track: working code
- Stack: TypeScript, Bun, Express, MySQL, React, Vite, Redux Toolkit, Tailwind CSS, OpenRouter, nodemailer ([ADRs](docs/adr/))
- Install, run and test: see the [README](README.md)
- Single test: `cd backend && bun test path/to/file.test.ts`, or `bun test -t "part of the test name"`
- Structure: [backend README](backend/README.md) and [client README](client/README.md)

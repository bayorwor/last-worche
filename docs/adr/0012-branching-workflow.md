# 0012 · Branching workflow

- **Status:** accepted
- **Date:** 2026-10-31
- **Deciders:** Team lastWorche

## Context

So far, everyone has committed directly to `main`. The team wants finished work to pass through stages before it reaches `main`. The jury clones the repository as of Tuesday 3 Nov at 11:00, and reads the Git history to see how the work progressed.

## Options considered

1. **`feature/*` → `development` → `staging` → `main`** – a broken change is caught before `main`, and the stages are clear / more merges, and work only counts for the jury once it has reached `main`.
2. **`feature/*` → `main`** – fewer merges / `main` is the only place where work comes together, so a bad merge affects the jury's version directly.
3. **Everyone commits to `main`** – no overhead / nothing protects the version the jury runs.

## Decision

We choose **`feature/*` → `development` → `staging` → `main`**.

| Branch | Holds | Merged in when |
|---|---|---|
| `feature/<short-name>` | One story, task or fix, branched from `development` | Tests, lint and build pass |
| `development` | Finished work, brought together | The feature is reviewed |
| `staging` | The next candidate for `main` | The combined work on `development` passes all tests |
| `main` | The version the jury runs | Someone has followed the README on a clean setup using `staging` |

Nobody commits directly to `development`, `staging` or `main`. Merges keep each commit, using `git merge --no-ff`, and are never squashed.

## Consequences

- `staging` is a branch, not a hosted environment, because we have no server ([ADR-0003](0003-operation-and-scaling.md)). Its check is the README run check.
- Squashing would turn a day's commits into one, which would hurt the Git history building block in the jury's scoring. Merge commits keep the original commits and their dates.
- Work that has not reached `main` by Tuesday 3 Nov at 11:00 does not count. We promote to `main` at least once a day, and the last promotion happens no later than Tuesday morning, after a full run check.
- Every merge adds a step, so branches must stay small and short-lived, and an urgent fix takes the same route as any other change.
- Until branch protection is set up on GitHub, these rules depend on the team following them.

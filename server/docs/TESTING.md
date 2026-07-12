# AgentLens — Testing

> How the backend is tested. Companion to [PROJECT-STRUCTURE.md](./PROJECT-STRUCTURE.md).

## Principles

- **Pyramid** — many cheap unit tests, fewer integration tests, one E2E later (at the frontend
  milestone). Unit = one function, no DB/HTTP. Integration = a real request through
  `route → service → repo → DB` against a throwaway test database.
- **Co-located** — tests live beside the code they test (`agents.test.ts` in the `agents/` module),
  not in a separate `tests/` tree. This is the feature-first form of the unit/integration split — a
  module's tests travel with its code. Shared setup/helpers live in `src/test/`.
- **Deterministic, no live LLM** — no test makes a real model call. Stage one has no LLM (human
  scoring), so this is forward-looking: when the judge lands, it is exercised through a fake that
  replays recorded JSON fixtures. CI stays free and never flakes on model variability.
- **Isolation** — fresh state per test (transaction rollback or truncation), so no test bleeds into
  another.

## What to test per module

Happy path **and** the failure paths where bugs hide:

- the 2xx success case,
- the 4xx that guards it (bad input → 422, missing auth → 401),
- the **tenant-isolation boundary** — user A cannot see or touch user B's data.

## Tooling

| Job | Tool | Notes |
|-----|------|-------|
| Test runner | **Vitest** | fast, TS-native, watch mode |
| In-process HTTP | **Fastify `app.inject()`** | calls routes with no network/port |
| Auth helper | pre-authenticated inject wrapper | attaches a valid session cookie, skips login boilerplate |
| Coverage | **v8** (`vitest --coverage`) | future CI gate |
| Fixtures | recorded JSON in `src/test/fixtures/` | for the future judge; deterministic |

## Open decision — test database strategy

Prisma + Postgres does not swap to in-memory SQLite as cleanly as the previous stack did. Options,
to decide at the first integration-test slice:

- **Testcontainers** — a real disposable Postgres per run (most faithful, needs Docker).
- **Dedicated test schema/database** — point tests at a separate Postgres schema, reset between tests.
- **In-memory Postgres substitute** (e.g. pglite) — fastest, with some fidelity caveats.

Unit tests (pure logic — e.g. the score rollup math) need none of this and come first.

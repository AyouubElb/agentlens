# AgentLens — Project Structure

> How the backend code is organized. Companion to [ARCHITECTURE.md](../../docs/ARCHITECTURE.md) and
> [CORE-ENTITIES-AND-APIS.md](../../docs/CORE-ENTITIES-AND-APIS.md).

## Feature-first, layered inside

Code is grouped by **feature (domain)**. Technical separation (`routes → service → repo`) is
co-located inside each feature folder rather than spread across top-level `controllers/`, `services/`,
`repositories/`. One app, one `package.json`, one deployable.

## The tree

```
agentlens/
├─ src/
│  ├─ modules/                      # feature components
│  │  ├─ auth/
│  │  │  ├─ auth.routes.ts          # routes + handlers
│  │  │  ├─ auth.service.ts         # business logic
│  │  │  ├─ auth.repo.ts            # Prisma queries
│  │  │  ├─ auth.schema.ts          # Zod schemas (validation + types)
│  │  │  └─ auth.test.ts            # co-located tests
│  │  ├─ agents/                    # agents + rubric + criteria (same 5 files)
│  │  ├─ runs/                      # POST /v1/runs ingest + run list/detail
│  │  └─ scoring/                   # submit scores + v1-vs-v2 comparison
│  ├─ shared/                       # cross-module functionality
│  │  ├─ auth/                      # JWT (@fastify/jwt), password (argon2id), API-key hashing
│  │  ├─ errors/                    # typed domain errors + error handler
│  │  ├─ middleware/                # rate-limit, auth guards
│  │  └─ logger/
│  ├─ config/                       # env parsing (Zod-validated), constants
│  ├─ db/                           # Prisma client instance
│  ├─ app.ts                        # build the Fastify app (register plugins + routes)
│  └─ server.ts                     # entry point (start listening)
├─ prisma/
│  └─ schema.prisma                 # the data model — all 8 entities
├─ package.json
├─ tsconfig.json
└─ .env / .env.example
```

Tests are **co-located** (`agents.test.ts` beside the code it tests), not in a separate `tests/` tree —
see [TESTING.md](./TESTING.md).

## Modules and the API surfaces they own

| Module | Owns | Surface |
|--------|------|---------|
| `auth` | register / login / logout / me | dashboard (session cookie) |
| `agents` | agent CRUD, rubric, criteria, API-key management | dashboard |
| `runs` | `POST /v1/runs` ingest · run list & detail | ingest (API key) + dashboard |
| `scoring` | submit per-criterion scores · v1-vs-v2 comparison | dashboard |

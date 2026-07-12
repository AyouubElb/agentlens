# AgentLens

**An evaluation platform for AI agents.** Connect a real agent project, let it **push its runs**
(input, output, retrieved context) to AgentLens, **score** each run against a rubric, and **compare
versions (v1 vs v2)** over time — so "did this change actually make the agent better?" has a number,
not a vibe.

AgentLens **ingests and evaluates** an agent that runs in someone else's codebase — it does not build
or run the agent itself. That keeps it agnostic to how the agent works (RAG, multi-agent, tool-using).

## Why it exists

Iterating on an LLM agent usually means eyeballing a few outputs and hoping. AgentLens makes the loop
measurable: every run is captured against a fixed, per-agent rubric, so version-to-version quality is a
tracked metric.

## How it works

1. **Create an agent** and its rubric (editable, weighted criteria) in the dashboard.
2. **Connect your agent project** with an API key; it POSTs each run to the ingest API.
3. **Score** the collected runs against the rubric (human scoring in stage one).
4. **Compare** versions side by side and watch the score trend.

## Architecture

Two entry surfaces over one backend — a machine **ingest API** (API-key auth) and a human
**dashboard API** (session-cookie auth) — fronted by Cloudflare + Render, layered
`routes → services → repositories → models` with tenant-scoped data access.

See **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)** for the component and sequence diagrams.

## Stack

```
Runtime:    Node + TypeScript
Framework:  Fastify
ORM:        Prisma
Validation: Zod
Auth:       @fastify/jwt (JWT) + argon2id (password hashing)
DB:         PostgreSQL
Structure:  feature-first modules (src/modules/{auth,agents,runs,scoring}/ with
            route→service→repo layering inside each; shared core/ + config/)
```

Frontend: React SPA. Edge: Cloudflare (TLS, DDoS, rate rules) → Render (managed load balancer).

## Local setup

```bash
cd server
npm install
cp .env.example .env      # fill in DATABASE_URL, JWT_SECRET
npm run db:generate       # generate the Prisma client (required before typecheck/dev)
npm run dev               # http://localhost:8000  ·  API docs at /docs
```

Checks: `npm run typecheck` · `npm run lint` · `npm test`.

## Documentation

Project-wide:

- [docs/REQUIREMENTS.md](./docs/REQUIREMENTS.md) — functional, non-functional, and security requirements
- [docs/CORE-ENTITIES-AND-APIS.md](./docs/CORE-ENTITIES-AND-APIS.md) — data model and API surface
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) — high-level architecture with diagrams
- [PLAN.md](./PLAN.md) — build roadmap and status

Server:

- [server/docs/PROJECT-STRUCTURE.md](./server/docs/PROJECT-STRUCTURE.md) — folder structure and module layout
- [server/docs/TESTING.md](./server/docs/TESTING.md) — testing philosophy and tooling

## Status

Design complete; server scaffolded (`/health` live). See [PLAN.md](./PLAN.md).

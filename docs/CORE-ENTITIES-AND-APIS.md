# AgentLens — Core Entities & API Design

> Stage-one data model and API surface. Companion to [REQUIREMENTS.md](./REQUIREMENTS.md).
> AgentLens **ingests** runs from an external agent project and scores them (by a human)
> against a per-agent rubric. It does not build or run the agent.

---

## 1. Core Entities

### Entity map

```
User ──1:N──▶ Agent ──1:N──▶ AgentVersion ──1:N──▶ Run ──1:N──▶ Score
                │              (client-declared,                    │
                │               auto-created on first sight)        │
                ├──1:1──▶ Rubric ──1:N──▶ Criterion ◀──────N:1──────┘
                │         (fixed across all versions; from a template)
                └──1:N──▶ ApiKey  (bound to Agent; authenticates ingest)
```

### Entities

**User** — account that owns everything below. Dashboard auth (session/JWT cookie).
| Field | Notes |
|-------|-------|
| id | PK |
| email | unique |
| username | display name (required) |
| password_hash | argon2id |
| created_at | |

**Agent** — the thing being evaluated. Owns one Rubric and many Versions; issues API keys.
| Field | Notes |
|-------|-------|
| id | PK |
| user_id | FK → User (owner; every query scoped by this) |
| name | |
| created_at | |

**Rubric** — the fixed measuring stick, **at the agent level** (not per version), so a v1→v2
score change reflects the agent changing, not the goalposts moving. **Stage one:** the client
supplies the rubric name + criteria when creating the agent (`POST /agents`), created in the same
transaction. (A rubric-template library — pick/clone a predefined rubric — is deferred.)
| Field | Notes |
|-------|-------|
| id | PK |
| agent_id | FK → Agent (1:1) |
| name | gives the criteria set an identity; enables templates |

**Criterion** — one scoring dimension. A real row because Score references it by id.
| Field | Notes |
|-------|-------|
| id | PK |
| rubric_id | FK → Rubric |
| name | e.g. "groundedness" |
| description | what the human scores against |
| weight | float; used in the weighted rollup |

**AgentVersion** — an immutable snapshot of the config the agent ran under.
**Client-declared:** the ingest payload names a version label; the version is **auto-created
on first sight** of a new label. Its `config` is opaque metadata the client sends (prompt,
settings) — AgentLens stores and displays it, never interprets it.
| Field | Notes |
|-------|-------|
| id | PK |
| agent_id | FK → Agent |
| label | client-declared string, e.g. "v2"; unique per agent |
| config | opaque JSON, client-supplied |
| created_at | |

**Run** — one ingested execution of the agent (Langfuse would call this a trace).
The unit that gets scored. Belongs to exactly one Version.
| Field | Notes |
|-------|-------|
| id | PK |
| agent_version_id | FK → AgentVersion (resolved from API key's agent + payload's version label) |
| input | the question asked |
| output | the agent's answer |
| context | what the agent retrieved (array of text) |
| metadata | model, latency, tokens, cost — optional, client-supplied |
| status | `unscored` \| `scored` |
| overall_score | denormalized weighted rollup; null until scored (hot path for trend/comparison reads) |
| created_at | |

**Score** — one human rating per `(Run, Criterion)`. The junction between a run and the rubric.
| Field | Notes |
|-------|-------|
| id | PK |
| run_id | FK → Run |
| criterion_id | FK → Criterion |
| value | raw human score (e.g. 1–5) |
| justification | optional text |
| unique (run_id, criterion_id) | one score per criterion per run |

**ApiKey** — how a machine caller authenticates ingest. Bound to an Agent.
| Field | Notes |
|-------|-------|
| id | PK |
| agent_id | FK → Agent |
| key_hash | **stored hashed** (treat like a password); plaintext shown once at creation |
| created_at / revoked_at | revocable |

### Locked entity decisions

- **Rubric is agent-level, fixed across versions** — keeps version comparison valid.
- **Rubric criteria are client-supplied at agent creation** (stage one); a template library is deferred.
- **Version is client-declared, auto-created on first sight** (the caller decides when v1→v2);
  its config is client-supplied and opaque to AgentLens.
- **Score = one row per (Run, Criterion)**; the single **overall** is denormalized onto Run
  alongside `status`.
- **ApiKey binds a machine caller to an Agent**; the key resolves agent + owner on ingest.

### Open (finalize in §2 API design)

- Exact **ingest payload shape** (how version label + config + run data ride on the wire).
- Whether an unknown version label **auto-creates silently** vs. requires a prior register call
  (leaning auto-create, per the client-declared decision above).

---

## 2. API Design

Two surfaces, different auth, namespaced separately so middleware / rate limits / CORS apply
per-surface. All routes share the `/api/v1` base path; the tables below list paths relative to it
(e.g. `/register` → `POST /api/v1/auth/register`, ingest → `POST /api/v1/runs`).

- **Dashboard API** — humans, **session-cookie (JWT)** auth. All CRUD + scoring + comparison.
- **Ingest API** — machines, **API-key** auth. Just run submission.

### Dashboard API (session cookie)

**Auth** (under `/auth`)
| Method + path | Purpose |
|---|---|
| POST /auth/register | create account (no auto-login; 409 if email exists) |
| POST /auth/login | start session (sets HttpOnly cookie, 2h JWT) |
| POST /auth/logout | clear the cookie server-side (needed with HttpOnly) |
| GET /auth/me | current user (auth guard) |

**Agents**
| Method + path | Purpose |
|---|---|
| GET /agents | list the user's agents |
| POST /agents | create agent (body carries the rubric name + criteria; created in one tx) |
| GET /agents/:id | agent detail (hub: versions, rubric, run history) |
| PATCH /agents/:id | partial update (e.g. rename) |
| DELETE /agents/:id | delete agent (cascades rubric, versions, runs, keys) |

**Rubric & Criteria** — nested under the agent (1:1 rubric; criteria can't exist without it).
No global rubric list; no separate rubric create/delete (created on agent create, deleted on cascade).
| Method + path | Purpose |
|---|---|
| GET /agents/:id/rubric | the agent's rubric + criteria |
| PATCH /agents/:id/rubric | edit rubric (e.g. name) |
| POST /agents/:id/rubric/criteria | add a criterion |
| PATCH /agents/:id/rubric/criteria/:cid | edit a criterion |
| DELETE /agents/:id/rubric/criteria/:cid | remove a criterion |

> ⚠️ Editing criteria after runs are scored can invalidate version comparison (goalposts moved).
> Lock/version the rubric once scoring starts — deferred design note.

**Versions** — read-only from the dashboard; versions are **client-declared, auto-created on
ingest** (Option C), so there is **no dashboard "create version"**.
| Method + path | Purpose |
|---|---|
| GET /agents/:id/versions | list versions |
| GET /agents/:id/versions/:label | one version (config + summary) |

**Runs & Scoring**
| Method + path | Purpose |
|---|---|
| GET /agents/:id/runs | list runs (filter by version, `status=unscored`; paginated) — the scoring queue |
| GET /runs/:id | run detail (input, output, context, its scores) — the drill-down |
| POST /runs/:id/scores | submit per-criterion human scores → flips run to `scored`, computes overall (FR3) |

**Comparison (FR4 — the hero)**
| Method + path | Purpose |
|---|---|
| GET /agents/:id/comparison?from=&to= | v1-vs-v2 delta: per-criterion averages + overall, side by side |

**API keys** — enable ingest.
| Method + path | Purpose |
|---|---|
| POST /agents/:id/keys | issue a key (returns plaintext **once**) |
| GET /agents/:id/keys | list keys (masked/hashed) |
| DELETE /agents/:id/keys/:kid | revoke a key |

### Ingest API (API key, `/v1`)

| Method + path | Purpose |
|---|---|
| POST /v1/runs | submit a run (input, output, context, version label, metadata). Resolves key → agent, finds-or-creates the version, stores the run `unscored` (FR1). |

### Design notes

- **Nest children under their parent** — rubric, criteria, versions, runs, keys all live under
  `/agents/:id/...`; they can't exist without the agent.
- **Locked decisions remove endpoints** — Option C removes "create version"; the rubric is
  created with the agent (and deleted on cascade), so there's no standalone "create/delete rubric."
  Fewer endpoints because the entity relationships do the work.
- **Method choice** — `PATCH` for partial updates (not `PUT`), `POST` for create/actions.

### Open (finalize when specifying payloads)

- Exact **`POST /v1/runs` payload** (version label + config + run fields on the wire) and whether
  an unknown version label auto-creates silently vs. requires a prior register call (leaning silent).
- Whether **comparison** is a dedicated endpoint or assembled client-side from per-version aggregates.

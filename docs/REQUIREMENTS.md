# AgentLens — Requirements

> Stage-one requirements for the agent-evaluation platform. AgentLens **ingests** runs
> from a real, external agent project and scores them against a per-agent rubric — it does
> **not** build or run the agent. Scoring in this stage is **performed by a human**, not an
> LLM judge.

---

## 1. Functional Requirements

The core capabilities the system must deliver. Prioritized: the four below are **core**
(above the line); everything else is deferred.

### Core (above the line)

| # | Requirement | Notes |
|---|-------------|-------|
| FR1 | **A connected agent project submits its runs to AgentLens** (push-ingestion). | Each run = `input` (question asked) + `output` (agent's answer) + `context` (what it retrieved) + metadata. Server-to-server; authenticated by API key. |
| FR2 | **Define an agent and its rubric criteria** (dynamic rubrics). | User creates an agent, attaches a rubric of editable criteria (name, description, weight). Rubric is data, not code. |
| FR3 | **Score runs against the rubric — manually, by a human.** | A run lands `unscored`; a human reviews it and submits a per-criterion score; the run becomes `scored`, with a weighted overall. |
| FR4 | **View scores and compare versions (v1 vs v2).** | Present collected runs, per-criterion scores, and the version-to-version delta — the product's reason to exist. |

### Supporting

- **Authentication** — users log in to access the dashboard (enables FR2–FR4; not a headline feature).
- **Connect an agent project to an agent** — issue/manage the API key that binds an external project to an AgentLens agent (enables FR1).

### Deferred (below the line — explicitly out of scope for stage one)

- LLM-as-judge (automated scoring) — replaces the human in FR3 later.
- Automated test-set generation.
- Agent categories beyond the first.
- Live/production observability, team accounts.

---

## 2. Non-Functional Requirements

Stated as quality + condition, not bare adjectives.

| # | Requirement | Target / Definition |
|---|-------------|---------------------|
| NFR1 | **Ingest durability + availability** | A submitted run is durably persisted before the API returns 2xx. Ingest must not fail because scoring is pending (scoring is a separate, later human action). |
| NFR2 | **Consistency model (per-path)** | Ingest favors **availability + durability**. Dashboard reads are **eventually consistent** — a newly ingested run may appear a moment later; no strong-consistency requirement. |
| NFR3 | **Ingest latency** | The ingest endpoint stays fast and never blocks on downstream work; it accepts, stores, and returns. (Exact p99 target TBD; low expected scale.) |
| NFR4 | **Tenant isolation** | User A can never read or affect user B's agents, runs, or scores. Every data access is scoped to the authenticated owner. |
| NFR5 | **Security** | Per the tables in §3. |
| NFR6 | **Scale (honest)** | Portfolio-scale traffic (low). Design should degrade gracefully and name where it would bend (e.g. ingest volume) if scale arrived — not engineered for 100M users. |

**CAP note:** CAP governs behavior *during a network partition* and is only load-bearing
once the system is sharded / multi-region. For a single-region datastore, the real
stage-one guarantee is **durable, available ingest with eventually-consistent reads** —
CAP is noted, not forced.

**Scoring throughput** is intentionally *not* an NFR: with human scoring, the human is the
bottleneck, not the machine.

---

## 3. Security Requirements

Governing principle: **sort every control by the surface it defends.** Browser attacks hit
the dashboard; credential/payload attacks hit ingest; authorization hits both.

### 3.1 Per-surface controls

| Control | Dashboard API (browser ↔ server) | Ingest API (server ↔ server) |
|---|---|---|
| **Auth** | JWT in `HttpOnly` + `Secure` + `SameSite` cookie | API key as `Bearer` token; **stored hashed** in DB, shown once, revocable |
| **CSRF** | ✅ Applies (cookie = ambient). Defense: `SameSite=Lax/Strict` (primary) + optional CSRF token | ❌ N/A — no browser, no ambient cookie to forge |
| **CORS** | Strict origin allowlist (web app only). *Not* an auth or CSRF defense | ❌ N/A — CORS is browser-enforced; irrelevant to server callers |
| **XSS** | ✅ Real risk (renders ingested text). React auto-escapes; sanitize any markdown/HTML (DOMPurify); CSP as backstop | ❌ N/A (no rendering) — but this is *where* untrusted text enters |
| **Security headers (Helmet)** | CSP (tuned), HSTS, `nosniff`, `X-Frame-Options`, `Referrer-Policy` | HSTS / TLS only; HTML-oriented headers don't apply |
| **Rate limiting** | Per-IP on login/auth (anti brute-force / credential-stuffing) | **Per API key** (anti-abuse; bounds cost/storage) |
| **Input validation** | Schema-validate every body (parse-don't-validate) → 400 on bad input | ✅ **Highest value here** — validate + **body-size cap** on arbitrary agent text |
| **Transport** | TLS everywhere (HSTS) | TLS everywhere (bearer key is only as safe as the channel) |

### 3.2 Both surfaces — non-negotiable

| Control | Why it matters |
|---|---|
| **Tenant isolation** (authorization, not authentication) | Every query scoped to the authenticated owner. Prevents IDOR (changing an ID to read another user's data) — #1 OWASP API risk. It's *your code*, not middleware, and matters more than CORS/CSRF/Helmet combined for a data product. |
| **Secrets management** | Keys in env/secret store, never committed. `.env` gitignored; `.env.example` holds blanks. |
| **PII awareness** | Ingested inputs/outputs may carry someone else's user data — AgentLens is a processor. Note now; consider retention limits later. |

### 3.3 Honest caveats (scope boundaries for stage one)

- **App rate limiting stops abuse, not a real DDoS.** Volumetric DDoS is absorbed upstream at the CDN/edge, not in application middleware. (Rate limiter to be deepened later.)
- **CORS ≠ CSRF ≠ auth.** CORS gates which origins' JS may call the API; CSRF defense is `SameSite`; auth is the token. They are three different things.
- **`HttpOnly` defends against XSS token theft, not CSRF.** CSRF never reads the token — it relies on the browser *sending* it, which `HttpOnly` does not prevent. `SameSite` is the CSRF control.

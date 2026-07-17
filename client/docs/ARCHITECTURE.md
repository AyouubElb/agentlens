# AgentLens — Client Architecture

> How the frontend (React SPA) is organized. Companion to the system-level
> [ARCHITECTURE.md](../../docs/ARCHITECTURE.md) and the backend's
> [PROJECT-STRUCTURE.md](../../server/docs/PROJECT-STRUCTURE.md).

The client is the **dashboard surface** — the human side of AgentLens. It authenticates with a
session cookie (HttpOnly JWT), lets a user manage agents, rubrics, and API keys, and score runs
against a rubric. It never calls the machine ingest endpoint. Version comparison (FR4) is deferred.

## Principles

- **Feature-first** — code is grouped by **domain** (`auth`, `agents`, `scoring`, `api-keys`),
  mirroring the backend's `server/src/modules/*`. When you work on "scoring," it's one folder on
  each side of the stack.
- **One-way imports** — `components/·lib/ → features → app`. The cross-feature primitives
  (`components/`, `lib/`) know nothing about features; a feature may use them; `app/` wires features
  together. **Features never import each other** — cross-feature needs go through `components/`/`lib/`,
  the router, or props. This is what keeps boundaries clean.
- **Server state vs. client state** — the two are handled by different tools and never conflated:
  server data lives in **React Query** (including the current user, via `useMe()`); small local UI
  state stays in component `useState`. No global client-state store — the cache is the source of truth.
- **Co-location** — a feature's components, hooks, API calls, and tests live together, so the whole
  concern can be read (or deleted) as a unit.
- **The client is UX, not a security boundary** — it validates for fast feedback; the server always
  re-validates. Types generated from the API are a dev-time convenience, not a guarantee.

## The tree

Domain-agnostic primitives live flat at `src/` (`components/`, `lib/`) rather than under a `shared/`
folder — the folder name is what marks them cross-feature. Each feature keeps its slice flat too:
`auth.api.ts` + `useAuth.ts` + `schemas.ts`, not nested `api/`/`hooks/`/`types.ts` folders.

```
client/
├─ index.html
├─ vite.config.ts · vitest.config.ts
├─ tsconfig.json · tsconfig.app.json · tsconfig.node.json
├─ tailwind.config.ts · postcss.config.js
├─ eslint.config.js
├─ package.json
├─ .env.local                       # VITE_API_URL (gitignored)
└─ src/
   ├─ main.tsx                       # entry — mounts <App/>, imports globals.css
   ├─ app/                           # composition root
   │  ├─ App.tsx                     # <Providers><RouterProvider/></Providers>
   │  ├─ providers.tsx               # QueryClientProvider + <Toaster/>
   │  ├─ router.tsx                  # route tree — public vs. protected split
   │  └─ ProtectedRoute.tsx          # useMe() gate → spinner / redirect / <Outlet/>
   │
   ├─ features/                      # domain modules (mirror server/src/modules)
   │  ├─ auth/                       # BUILT
   │  │  ├─ auth.api.ts              # authApi.{me,login,register,logout} → apiClient
   │  │  ├─ useAuth.ts               # useMe / useLogin / useRegister / useLogout
   │  │  ├─ schemas.ts               # Zod (mirrors server) + User type
   │  │  ├─ AuthCard.tsx             # segmented toggle + framer-motion transition
   │  │  ├─ LoginForm.tsx · RegisterForm.tsx · PasswordChecklist.tsx
   │  │  └─ schemas.test.ts
   │  ├─ agents/                     # PLANNED — agents.api.ts + useAgents.ts + components
   │  ├─ api-keys/                   # PLANNED — issue / list / revoke; IssueKeyDialog
   │  └─ scoring/                    # PLANNED — queue, RunDetail, CriterionGrader, score math
   │
   ├─ pages/                         # thin route components
   │  ├─ AuthPage.tsx                # one page, /login + /register (mode switches the toggle)
   │  ├─ PlaceholderPage.tsx         # stand-in for routes built in later slices
   │  └─ … (Overview, Agents, AgentDetail, ScoringQueue, Evaluation — later)
   │
   ├─ components/                    # domain-agnostic, cross-feature
   │  ├─ ui/                         # Button, Logo, form (Input/Label/FieldHelp),
   │  │  │                           #   feedback (Spinner/Skeleton/Alert)
   │  │  └─ toast/                   # Toaster + toast store (v2.0 notification)
   │  └─ layout/
   │     └─ AppShell.tsx             # sidebar (Overview·Agents·Scoring) + header + UserMenu
   │
   ├─ lib/                           # cross-feature helpers
   │  ├─ api-client.ts               # Axios instance + ApiError + 401 interceptor
   │  ├─ query-client.ts             # TanStack QueryClient config
   │  ├─ cn.ts                       # clsx + tailwind-merge
   │  └─ constants/
   │     └─ query-keys.ts            # central key factories (authKeys, later agentKeys…)
   │
   ├─ styles/
   │  └─ globals.css                 # design tokens (CSS vars) + Tailwind entry
   │
   └─ test/
      └─ setup.ts                    # jest-dom matchers for Vitest
```

## The feature pattern

Each feature owns its slice end-to-end, in three flat layers (auth is the reference):

**1. `<feature>.api.ts` — the endpoints.** A plain object (`authApi.login`, `.me`, …) whose methods
call the shared Axios instance and return typed data. This is the only layer that knows URLs.

**2. `use<Feature>.ts` — the React Query hooks.** `useQuery`/`useMutation` wrapping the api methods;
they own caching, loading/error state, cache invalidation, and success/error toasts. Components never
call the api layer or `fetch` directly — they call a hook and read `{ data, isPending, … }`. Cache
keys come from the central `lib/constants/query-keys.ts` factory, never inline strings.

```
authApi.login   → useLogin()     [useMutation → setQueryData(authKeys.me())]
authApi.me      → useMe()        [useQuery, retry:false]
authApi.logout  → useLogout()    [useMutation → clears the me cache]
```

**3. Components + `schemas.ts`.** The feature's own components live beside its api/hooks; `schemas.ts`
holds the Zod schemas (mirroring the server's) and derived types. The test for where a component
belongs: *does it know a domain concept?* `CriterionGrader` knows "criterion" and "score" → it lives
in `scoring/`. `Button`, `Input`, `Toaster` know nothing → they live in `components/ui/`.

## Data layer — Axios + React Query

- **React Query (TanStack Query)** owns all server state: caching, background refetch, loading/error
  status, and cache invalidation after mutations. It replaces hand-written `useEffect` fetch/loading
  logic on every page. Defaults live in `lib/query-client.ts` (`staleTime 60s`, `retry 1`,
  `refetchOnWindowFocus: false`).
- **`lib/api-client.ts`** is a shared **Axios** instance: `baseURL` from `VITE_API_URL`,
  `withCredentials: true` (the cookie session), and a response interceptor that normalizes the
  backend error shape (`{ statusCode, error, message }`) into a thrown `ApiError { status, message }`.
  The interceptor also redirects to `/login` on a 401 — except on `/auth/me`, where a 401 is the
  normal "logged out" signal and must not redirect-loop.
- **Types are hand-written to mirror the server's Zod schemas** (in each feature's `schemas.ts`),
  kept in sync deliberately. Generating them from the OpenAPI spec (`openapi-typescript`, `gen:api`)
  is deferred — blocked on a TS-version peer conflict; revisit when wiring agents.

## State management

| State | Example | Held by |
|-------|---------|---------|
| **Server state** | agents list, run detail, scores, **current user** | **React Query** (cache + invalidation) |
| **Local UI state** | form inputs, dialog open/closed, menu toggle | component `useState` |

No Context, Redux, or Zustand in stage one. "Am I logged in?" is answered by `useMe()` reading the
React Query cache — the cache is the single source of truth, so there is no separate session store to
keep in sync. A client-state library is added only if genuinely global UI state appears later.

## Routing

**React Router**, split into public and protected trees. `<ProtectedRoute>` reads `useMe()` — shows a
spinner while the check is in flight, redirects to `/login` when there's no user, else renders the
`AppShell` (sidebar + header) via `<Outlet/>`. Auth is cookie-based, so protection is a UX gate — the
server independently rejects unauthenticated requests regardless of the client.

The **sidebar nav** is Overview · Agents · Scoring. `/login` and `/register` are the **same page**
(`AuthPage`) — the route only sets which tab the in-place toggle starts on; switching between them is
client-side, no navigation.

| Route | Page | Access |
|-------|------|--------|
| `/login`, `/register` | Auth (one page, animated toggle) | public |
| `/` → `/overview` | redirect | — |
| `/overview` | dashboard home (stat tiles, recent runs) | protected |
| `/agents` | agents list + create | protected |
| `/agents/:id` | agent detail (rubric · keys · runs) | protected |
| `/agents/:id/runs` | scoring queue | protected |
| `/runs/:id` | evaluation page (grade + submit) | protected |

A public landing / marketing home is **optional and deferred** — built last, if at all, after the
functional app works end-to-end. It has no API dependency, so it can slot in without touching the
core flow.

## Styling

**Tailwind CSS**, dark-first, with the locked **charcoal + cyan** design system encoded as CSS
variables in `styles/globals.css` (and Tailwind config). Type: **Archivo** (UI) + **JetBrains Mono**
(IDs/keys/code); **6px** default radius; cyan accent used sparingly, with red/amber/green reserved
for scores and status. Primitives (buttons, inputs, toasts, dialogs) are **hand-built** in
`components/ui/` against the tokens — no off-the-shelf component library. A headless lib (e.g. Radix)
is added only if an accessibility-heavy primitive (menu, combobox) needs it.

Full tokens, component inventory, and usage rules: **[DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md)**.

## Testing

Lightweight and co-located — it **completes** the backend tests (which prove the API) by covering
the client's own logic and its riskiest interactions. It does not mirror the backend's
unit/integration split.

- **Unit tests (Vitest)** — pure, non-visual logic where bugs hide: score validation (covers every
  criterion exactly once), formatters, the API error normalizer. Beside the code
  (`validate-scores.test.ts` next to `validate-scores.ts`).
- **Component tests (Vitest + React Testing Library)** — only the interactions that carry real risk:
  the scoring form submits the right values; the create-agent form validates. Render, interact,
  assert what the user sees — queried by visible text/role, not implementation details, so tests
  survive refactors. Beside the component.
- **Shared setup** lives in `src/test/setup.ts` (jest-dom matchers, wired via `vitest.config.ts`). A
  custom `render()` wrapping the providers gets added with the first component test.
- **E2E (Playwright) is deferred** to a later slice; the login→score vertical is proven by running
  the app first.

| Job | Tool |
|-----|------|
| Test runner | **Vitest** (same as backend) |
| Component rendering | **React Testing Library** |
| Coverage | **v8** (`vitest --coverage`) |
| E2E (later) | **Playwright** |

## Tooling & scripts

| Concern | Choice |
|---------|--------|
| Build / dev server | **Vite** |
| Language | **TypeScript** |
| HTTP client | **Axios** (`lib/api-client.ts`) |
| Server state | **TanStack Query** |
| Forms | **React Hook Form + Zod** (`@hookform/resolvers`) |
| Animation | **Framer Motion** (auth transition, toasts) |
| Icons | **lucide-react** |
| API types | hand-written from server Zod; **openapi-typescript** deferred |
| Routing | **React Router** |
| Styling | **Tailwind CSS** (dark-first charcoal+cyan — see [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md)) |
| Testing | **Vitest + React Testing Library** |

```jsonc
// package.json scripts
"dev":       "vite",
"build":     "tsc -b && vite build",
"preview":   "vite preview",
"lint":      "eslint .",
"lint:fix":  "eslint . --fix",
"typecheck": "tsc -b",
"test":      "vitest run",
"test:watch":"vitest",
"test:cov":  "vitest run --coverage"
```

CI (`.github/workflows/client-ci.yml`, added with the scaffold): `npm ci → lint → typecheck →
test`, mirroring the server workflow.

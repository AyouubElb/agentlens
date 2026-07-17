# AgentLens — Design System

> The locked, **dark-first charcoal + cyan** design system for the dashboard. This is the written
> companion to the visual reference (kept in the design tool) and the source of truth we translate
> into Tailwind config + `styles/globals.css` next. Companion to
> [ARCHITECTURE.md](./ARCHITECTURE.md).
>
> **Design intent:** a calm, precise *instrument*. Color earns its place — cyan is the product,
> a warm ramp is for scores, and semantic red/amber/green is reserved strictly for status. The
> default surface is quiet so the data (runs, scores, deltas) is what stands out.

---

## Color

Dark-first. The palette is a warm charcoal ground, one cyan accent ("the lens"), a status-only
semantic set, and a separate warm ramp for scores. Tokens below become CSS variables.

### Ground / structure

| Token | Hex | Use |
|-------|-----|-----|
| `bg` | `#17151a` | app background (the ground) |
| `surface` | `#201d24` | cards, panels, table body |
| `raised` | `#2a262f` | raised surfaces — header, popovers, row hover, inputs |
| `hairline` | `#38333f` | borders, dividers, table rules |

### Text

| Token | Hex | Use |
|-------|-----|-----|
| `text` | `#ece9f0` | body / primary |
| `text-muted` | `#a09aa8` | secondary, labels, captions |
| `text-faint` | `#726d78` | de-emphasized — **see accessibility note below** |

### Accent — cyan ("the lens")

One accent, used sparingly. **Info reuses cyan** (no separate info hue).

| Token | Hex | Use |
|-------|-----|-----|
| `accent` | `#22d3c8` | primary actions, focus ring, active state, signature hairline |
| `accent-hover` | `#5fe6dd` | hover |
| `accent-pressed` | `#12a89f` | pressed / active |
| `accent-tint` | `rgba(34,211,200,0.12)` | subtle fill — active nav, selected row, info banner |
| `accent-ink` | `#062b28` | text/icons **on** a cyan fill — **never white** |

### Semantic (status only)

For status and feedback — **never** for primary UI. Danger is intentionally cooler than the score
warmth, so "revoke" reads as status, not as a low score. Each hue pairs a tint background with a
lighter text step.

| Token | Base | Tint bg | Text step | Use |
|-------|------|---------|-----------|-----|
| `success` | `#30a46c` | `rgba(48,164,108,0.12)` | `#3dd68c` | scored, healthy, positive delta |
| `warning` | `#e0a020` | `rgba(224,160,32,0.12)` | `#f0c04a` | needs attention, caution |
| `danger` | `#e5484d` | `rgba(229,72,77,0.12)` | `#ff6369` | destructive (revoke/delete), errors |

### Score ramp (1 → 5)

The **only** place this warm ramp is used. Deliberately warm so a score chip never collides with
the cool cyan accent. Maps a raw human score to a color.

| Score | Hex | Reads as |
|-------|-----|----------|
| 1 | `#c21f3a` | worst |
| 2 | `#d9722f` | poor |
| 3 | `#c9a227` | mid |
| 4 | `#6e8f3e` | good |
| 5 | `#157f3c` | best |

---

## Type

Two families: **Archivo** for all UI text, **JetBrains Mono** for anything machine-shaped — IDs,
version labels, JSON (run input/output/context/metadata), API keys, code.

Weight is rationed on purpose (a flatter type hierarchy reads as more precise):

- **800** — page titles and top-level section titles **only**
- **600–700** — card titles, table headers, form labels
- **400** — body, values, help text

| Role | Font | Size | Weight |
|------|------|------|--------|
| Page title | Archivo | 24px | 800 |
| Section title | Archivo | 18px | 700 |
| Card title / label | Archivo | 14px | 600 |
| Body | Archivo | 14px | 400 |
| Small / caption | Archivo | 12px | 400 |
| Mono (IDs / JSON / keys) | JetBrains Mono | 13px | 400 |

---

## Spacing

A **4px base step**. Compose layout from multiples so vertical and horizontal rhythm stay
consistent: `4 · 8 · 12 · 16 · 24 · 32 · 48`. 16px is the default gap inside cards; 24px between
sections.

---

## Radius

Rounded, but restrained — **not zero** (zero reads as harsh/terminal; too round reads as consumer).

| Token | Value | Use |
|-------|-------|-----|
| `radius-sm` | `4px` | pills, small tags |
| `radius-md` | `6px` | inputs, buttons, cards, tags — **the default** |
| `radius-lg` | `10px` | modals |

---

## Elevation

A **flat-ground** model — depth comes from the surface step, not heavy shadows.

- Separate layers by stepping the surface (`bg` → `surface` → `raised`) plus a `hairline` border.
- No large drop shadows on cards. A soft shadow is acceptable only on true overlays (popovers,
  menus, toasts) to lift them off the page.
- **Modals** get `radius-lg` **plus the signature top-edge cyan→transparent gradient hairline**
  (see Signatures).

---

## Component inventory

Each component, its variants, and where it appears in AgentLens. Grounded in the real entities —
agents, rubric/criteria, runs, scores, API keys (see
[CORE-ENTITIES-AND-APIS.md](../../docs/CORE-ENTITIES-AND-APIS.md)).

| Component | Variants / registers | Appears in |
|-----------|----------------------|------------|
| **Button** | primary (cyan fill, `accent-ink` text), secondary, ghost, danger; sizes sm/md; `disabled` + `loading` states | everywhere — create agent, add criterion, submit scores, issue/revoke key |
| **Form input** | **two registers:** (1) standard dashboard field; (2) **mono** field for IDs/keys. Each with label, help text, error (danger), cyan focus ring | create-agent form, rubric/criterion edit, login/register |
| **Table + pagination** | column headers, row hover (`raised`), `status` badge cell, empty state, paginated footer | the **scoring queue** — `GET /agents/:id/runs`, filterable by version / `status=unscored` |
| **Modal / dialog** | `radius-lg` + top-edge gradient hairline; confirm variant uses danger | **IssueKeyDialog** (shows plaintext key **once**, mono), confirm-revoke, confirm-delete |
| **Toast** | color-coded left rail + icon tile + auto-dismiss progress bar | success (scored, key issued), warning, danger (errors), info |
| **Badge / tag** | `status` (unscored / scored), **score badge — driven by the 1–5 ramp**, **version label (mono)** | run rows, run detail header, agent detail |
| **Empty state** | icon + one line + primary action | no agents yet, no runs to score, no API keys |
| **Loading state** | **skeleton** for lists/tables (known shape); **spinner** for actions/buttons | queue/list loads vs. in-flight mutations |

### Two key flows this system dresses

- **Scoring queue → evaluation.** `GET /agents/:id/runs` renders the table (status badges, version
  tags); a row opens `GET /runs/:id` — input/output/context/metadata (mono where JSON) beside each
  rubric criterion with a **score badge** from the ramp. Submit flips the run to `scored`.
- **Issue an API key.** IssueKeyDialog surfaces the plaintext key **once** in a mono field with a
  copy affordance; the key list otherwise shows masked/hashed values. Revoke uses the danger
  confirm modal.

---

## Signatures

Three recurring marks give the product its identity — used consistently, never decoratively.

- **Viewfinder-reticle logo** — a camera/lens reticle: three corners in body-white (`#ece9f0`) and
  **one corner in cyan** (`#22d3c8`), with a small cyan center dot. (This is the mark embedded in
  the design export's thumbnail.) Reinforces the "lens / instrument" concept.
- **Modal top-edge hairline** — a 1px **cyan→transparent gradient** along the top edge of modals;
  the one place cyan touches an overlay, tying dialogs back to the accent.
- **Toast pattern** — color-coded **left rail** + **icon tile** + **auto-dismiss progress bar**, so
  status is legible at a glance and the toast visibly counts itself down.

---

## Usage rules

- **Cyan is sparing.** Primary actions, focus rings, active/selected state, and the one signature
  hairline — not borders, not decoration. If cyan is everywhere, it stops meaning "act here."
- **Semantic = status only.** `success` / `warning` / `danger` communicate state and feedback,
  never primary UI. A primary button is cyan, not green.
- **The score ramp is for scores only.** Nothing else uses those five warm hues.
- **Ink on cyan is dark.** Text/icons on any cyan fill use `accent-ink` `#062b28` — **never white**
  (white-on-cyan fails contrast and looks cheap).
- **Mono means machine.** IDs, version labels, API keys, and JSON payloads render in JetBrains Mono;
  prose never does.

---

## Known follow-up — accessibility

`text-faint` `#726d78` is **~3.5:1** on the dark grounds — **under WCAG AA (4.5:1)** for small
(11–13px) text. When building components, either **nudge it lighter** (≈ `#8a8593`) or **restrict
`#726d78` to ≥16px** where the 3:1 large-text threshold applies. Recorded here as the one open
contrast item — **don't re-color everything now**; resolve it at component-build time.

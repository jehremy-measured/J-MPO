# PRD — MPO "Build plan" flow (period → conversion type → budget → review)

**Owner:** Jehremy · Product Design, Measured
**Status:** Ready for build
**Companion asset:** `mpo-budget-flow.html` — working interactive prototype. Treat it as the **visual + interaction source of truth**; this doc is the spec of record for logic, data, and edge cases. Where the two ever disagree, this doc wins on rules, the prototype wins on look/feel.

---

## 1. Summary

The first leg of the MPO planning journey: the user defines the plan's date range, picks a conversion type (or an attribute combination), loads a starting budget (upload a spreadsheet **or** fetch a past period's actuals), then reviews and edits a per-tactic budget grid before creating the plan. On create, the flow hands off to the next journey step (Project & simulate).

This covers steps 1–2 of the six-step MPO journey (Build/import → Capture goal → …). It ends at a created draft plan; it does **not** run projections or optimization.

## 2. Goals / non-goals

**Goals**
- Get a user from "I want to plan" to a budgeted, tactic-level draft plan in one linear flow.
- Two budget entry paths that converge on one review surface.
- Sensible defaults so a user can accept the plan with zero edits, but override anything.

**Non-goals**
- Projection, simulation, optimization, constraints, goal capture (later journey steps).
- Multi-plan management, saving drafts, collaboration.
- True open-calendar date-range picking (see Open Questions §11).

## 3. Design system

Measured brand tokens; do not introduce new colors or fonts.

- **Font:** IBM Plex Sans (UI), IBM Plex Mono (numbers/currency). Weights 400/500/600.
- **Primary / brand:** Orange 600 `#FF5420` (hover `#DD4314`). Used for the single primary action per screen, selected states, focus rings.
- **Text:** Gray 900 `#203E51` body, Gray 1000 `#0D2D42` headings, Gray 700 `#516877` muted.
- **Surfaces:** white `#FFFFFF` cards on Gray 100 `#F8FBFB` page. Border Gray 300 `#E2E6E8`.
- **Semantic:** info Blue 100/900, success/green Green 300/1000, warning Yellow 100/1000.
- Full token set: `measured-brand/tokens/tokens.css`. Radii 8px controls / 12px cards / 16px outer card. Navy-tinted shadows, never pure black.
- Sentence case everywhere. One primary (orange) button per screen; everything else is secondary/ghost.

## 4. Flow

Linear, one screen at a time, **no global stepper/progress bar**. Each screen has a small eyebrow label and a Back link (except screen 1).

```
1. Planning period
      ↓
2. Conversion type
      ↓
3. Budget method ──── upload ───→ 3a. Upload spreadsheet ──→ 4. Review (upload variant)
      │                                                              ↓
      └──────────── fetch ─────────────────────────────────→ 4. Review (fetch variant)
                                                                     ↓
                                                              5. Plan created
```

- **Upload** goes through an intermediate upload screen (3a), then Review.
- **Fetch** skips straight to Review; the period control lives at the top of the Review screen itself.
- Both budget paths converge on **one** Review component with two variants (differ only in the top block).

## 5. Data model

```ts
type PlanPeriod = { id: string; label: string; days: number };

type ConversionType = {
  id: string; name: string; desc: string;
  group: "baseline" | "rollup" | "attribute";
};

type Tactic = {
  id: string; name: string; channel: string;
  dormant?: boolean; // no spend in trailing 12 months (drives fetch default-exclude)
};

type PlanState = {
  screen: "period" | "ct" | "method" | "upload" | "review" | "done";
  plan: string;                       // PlanPeriod id
  singleCT: string | null;            // baseline/rollup selection (mutually exclusive w/ attrs)
  attrs: string[];                    // attribute selection (multi)
  method: "upload" | "fetch" | null;
  source: string;                     // filename (upload) or window label
  win: string;                        // selected past-window id (fetch)
  budget: Record<string, number|null>;      // tactic id → dollars
  overridden: Record<string, boolean>;      // tactic id → user hand-edited
  included: Record<string, boolean>;        // tactic id → in final plan
  query: string;                      // review search
  channel: string;                    // review channel filter ("All" or channel name)
};
```

**Seed data used in the prototype** (replace with live data in build):

- **Plan periods:** Q4 2025 (92d, default), November 2025 (30d), Aug–Dec 2025 (153d).
- **Conversion types:**
  - Baseline (single-select): Online Orders, In-Store Orders, Retail Orders
  - Roll-up (single-select): Omni Orders, Total Orders
  - Attributes (multi-select): New Customers, Returning Customers, Subscription Orders
- **Tactics (9):** Google Brand, Google Non-Brand (Paid Search); Meta Prospecting, Meta Retargeting, TikTok*, Pinterest (Paid Social); Programmatic Display, Criteo Retargeting* (Display); YouTube (Video). *`= dormant in seed data.`

## 6. Screen specs

### Screen 1 — Planning period
- **Purpose:** set the plan date range first; its **day count** drives the default past-period length downstream.
- **Controls:** one `Plan period` dropdown (future periods) + a live `N days` readout beside it.
- **Primary action:** Continue (always enabled; a default is preselected).
- **Transition:** → Conversion type.

### Screen 2 — Conversion type
- **Purpose:** choose what the plan optimizes toward.
- **Layout:** three labeled groups, each with a subtitle:
  - **Baseline** — raw conversion types. Single-select (radio).
  - **Roll-up** — aggregated types. Single-select (radio).
  - **Attributes** — combine multiple. Multi-select (checkbox).
- **Selection rules (critical):**
  - Baseline and roll-up share **one** single-selection: picking either clears the other. Picking a single CT **clears all attributes**.
  - Picking any attribute **clears the single CT**. Attributes accumulate.
  - So state is *either* `singleCT` set *or* `attrs.length > 0`, never both.
- **Validation:** Continue disabled until `singleCT || attrs.length > 0`.
- **Transition:** → Budget method. Back → Planning period.

### Screen 3 — Budget method
- **Purpose:** pick how to load the starting budget.
- **Layout:** two selectable cards: **Upload budget** / **Fetch from past period**.
- **Transition:**
  - Upload → Upload screen (3a).
  - Fetch → **directly to Review** (build budget from the default window first).
  - On either selection, reset `budget`, `overridden`, `included`, `query`, `channel`, `win`.
- Back → Conversion type.

### Screen 3a — Upload spreadsheet
- **Purpose:** provide a clean template and accept the completed file.
- **Layout:**
  - Template row: filename, column hint (`Tactic, Channel, Budget`), a **Download** button (downloads a template pre-seeded with tactic + channel rows and blank budget column).
  - Dropzone: click/drag. On file accepted, show success state ("N of N tactics matched").
- **Validation:** Review action disabled until a file is present.
- **Transition:** Review tactics → build budget from file, set default includes → Review. Back → Budget method.

### Screen 4 — Review plan budget (shared, two variants)
The convergence point. Same table + toolbar for both paths; only the **top block** differs.

**Top block — fetch variant**
- A bordered panel containing:
  - `Source period` = **single** dropdown of past date windows, each **exactly `planDays` long**, defaulting to the most recent (`w0`).
  - An info note: "Actual spend from `{start} – {end}` — the same `{N}` days as your plan. Tactics with no spend in the last year are excluded by default."
- Changing the window recomputes non-overridden budgets; keeps include/exclude choices.

**Top block — upload variant**
- A file row: filename, "Tactics with no budget in the file are excluded by default", a **Reupload** button (→ Upload screen with a fresh dropzone), and a **⋯ more menu** with one item: **Download template**.

**Toolbar (both variants), above the table**
- Search input (filters visible rows by tactic name).
- Channel filter chips: `All` + each channel present. Selecting one narrows visible rows.
- Search and filter affect **visibility only**, never inclusion or totals.

**Table (both variants)**
- Columns: include checkbox + tactic (name, channel), and an editable `$` budget input (Mono, right-aligned).
- Each row has an **include/exclude checkbox**. Excluded rows: dimmed, budget input disabled.
- Default-excluded rows show a reason tag:
  - upload + no budget in file → `no budget in file`
  - fetch + dormant tactic → `no spend in 12+ mo`
- Hand-edited (included) rows show an `edited` tag.
- Footer: `Total budget · N of M included` and the summed total. **Total sums included tactics only, regardless of current search/filter.**
- All budget cells are directly editable inline (no separate "edit mode").
- **Primary action:** Create plan → Plan created. Back → Upload (upload path) or Budget method (fetch path).

### Screen 5 — Plan created
- Success state. Summary cards: Plan period, Conversion type (or "Combined attribute" + chips of the attributes), Tactics included, Total budget.
- Actions: Start over (reset all) / Project & simulate → (hand off to next journey step).

## 7. Cross-cutting logic

**Default include/exclude**
- **Upload:** `included = budget != null && budget > 0`. Blank/zero rows from the file start excluded.
- **Fetch:** `included = !tactic.dormant`. Dormant = no spend in the trailing 12 months; these compute to `$0` and start excluded.
- User can override any include state; overriding include enables the budget input.

**Past-period ↔ plan length**
- Fetch windows are always **exactly `planDays` long**, so past actuals map 1:1 onto the plan with **no scaling/normalization**. There is intentionally no "scale to month/week" control — matching lengths removes the need. Prototype derives per-tactic budgets from a daily rate (Q3 2025 actual ÷ 92) × `planDays` × a per-window seasonal multiplier; **replace with real windowed actuals in build.**

**Edits / overrides**
- Editing a budget cell sets `overridden[id] = true`; that cell no longer recomputes when the source window changes.
- Changing the fetch source window clears overrides (fresh actuals) but preserves include/exclude choices. *(Flagged — see §11.)*

## 8. Edge cases
- Included-but-hidden and visible-but-excluded are both valid; the `N of M included` count is the safeguard against silently dropping a tactic behind a filter.
- Empty search/filter result → show an empty-state row, keep the footer total intact.
- Attribute + single CT can never both be set (enforced at selection).
- Toggling a default-excluded tactic *on* leaves its budget blank/`$0` for the user to fill.
- Reupload after manual edits currently discards edits silently. *(Flagged — see §11.)*

## 9. Accessibility
- All controls keyboard-operable; visible focus rings (orange, from tokens).
- Checkboxes and chips have accessible labels; the ⋯ button has `aria-label`.
- Reason tags must not be the *only* signal of exclusion — the checkbox state carries it too.
- Respect `prefers-reduced-motion` (prototype already does).

## 10. Tech notes for Cursor
- Suggested stack: React + TypeScript, Tailwind mapped to Measured tokens (`measured-brand/tokens/tailwind.preset.js`), or plain CSS variables from `tokens.css`. The prototype is framework-free vanilla JS — port the state machine to a single `usePlanFlow` reducer keyed on `state.screen`.
- One reducer/state object (shape in §5); screens are pure functions of state. Keep search state local-ish so typing doesn't thrash (prototype re-renders + refocuses; a React build should just keep the input controlled).
- Real data dependencies to wire: available conversion types, tactic list for the selected CT, past-period actuals for an arbitrary window, dormant lookup (trailing-12-month spend per tactic), spreadsheet parse + tactic-name matching.
- Currency: integer dollars, `Intl.NumberFormat` USD, round everything that hits the screen.

## 11. Open questions (need product decisions before/at build)
1. **CT → downstream dependency.** The conversion type should drive which tactics and actuals are even available. Currently the tactic list is static across CTs. Confirm whether tactic availability and actuals are CT-scoped.
2. **Dormant lookback vs. source window.** "No spend in a year" is a trailing-12-month rule independent of the chosen window — a tactic can be $0 in a 92-day window but have spent 10 months ago. Confirm the lookback is always 12 months regardless of plan/source length.
3. **Date picker fidelity.** Is a dropdown of equal-length recent windows enough, or do planners need an open calendar range picker (arbitrary start/end, validated to match `planDays`)?
4. **Overrides on window change.** Should manual budget edits survive changing the fetch source window, or reset (current behavior)?
5. **Reupload with edits.** Warn/confirm before a reupload discards manual edits?
6. **Upload rows outside the selected set.** How to handle spreadsheet rows for tactics not in the plan (extra rows, or tactics from unselected channels) — ignore, warn, or allow expanding the plan?
7. **Excluded-tactic visibility.** Is `N of M included` enough, or do we need an explicit "X excluded" affordance / filter?
8. **Plan horizon source.** In the full journey the plan's date range may be set earlier; confirm whether Screen 1 owns it or inherits it.

## 12. Out of scope for this build
Projection, simulation, optimization, constraints, goal capture, saving/loading plans, real xlsx generation for the template (CSV is fine for now).

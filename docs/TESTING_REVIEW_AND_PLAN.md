# Testing Review & Improvement Plan

A review of the project's testing structure, the gaps found, and the plan
executed to close them — including the new **autonomous verification loop**
([`AUTONOMOUS_VERIFICATION_LOOP.md`](./AUTONOMOUS_VERIFICATION_LOOP.md)).

## 1. Current structure (as reviewed)

| Layer | Where | Runner | Notes |
| --- | --- | --- | --- |
| Unit | `e2e/lib/*.test.ts` | `node:test` via `tsx --test` (`npm run test:unit`) | Pure-logic tests; wired into `npm run check` |
| Static | `npm run lint`, `npm run typecheck` | ESLint (Next config) + `tsc --noEmit` | Part of `npm run check` |
| E2E perimeter | `e2e/smoke/public-auth.spec.ts`, `auth-guard.spec.ts` | Playwright | Public pages + auth-guard redirects + PDF 401s |
| E2E authenticated | `e2e/smoke/authenticated.spec.ts`, `records.authenticated.spec.ts` | Playwright | Navigation + record write/draft flows; gated on a dedicated E2E project |
| Safety | `e2e/lib/supabase-project-guard.ts` + `e2e/global-setup.ts` | — | Fail-closed allow/deny list so tests never touch production Supabase |
| CI | `.github/workflows/smoke.yml` | GitHub Actions | Perimeter on every push/PR; authenticated gated |

### Strengths

- A genuinely thorough **safety guard** around Supabase targets (denylist +
  allowlist + ref parsing), with unit tests for the decision matrix.
- A clean separation of perimeter (no secrets) vs. authenticated (secrets) e2e.
- Pure logic already extracted into testable modules (calculations, schemas,
  normalizers, drafts).

### Gaps found

1. **Unit coverage holes** — several pure-logic modules had no tests:
   quote pricing math, coordinate (DMS) conversion, login-error mapping,
   form-error helpers, filter-href builder, the `cn` class merger, mix-record
   formatting helpers, and the non-mix entity schemas (customer, field,
   equipment, product, surfactant, pricing, quote).
2. **No single "is the app releasable?" command** — `npm run check` covers
   static + unit only; build and e2e are separate, and nothing aggregates
   results or proposes fixes.
3. **No result analysis / remediation feedback loop** — a failure meant reading
   raw logs with no triage.

## 2. Improvements executed

### 2a. New unit tests (pure logic)

Added under `e2e/lib/` (unit suite grew from **86 → 154** tests):

| New test file | Module under test |
| --- | --- |
| `quotes.calculations.test.ts` | `lib/quotes/calculations.ts` (markup, line seeding, totals) |
| `coordinates.test.ts` | `lib/formatting/coordinates.ts` (decimal→DMS, rollover, range) |
| `login-errors.test.ts` | `lib/auth/login-errors.ts` |
| `form-errors.test.ts` | `lib/form-errors.ts` |
| `buildFilterHref.test.ts` | `lib/records/buildFilterHref.ts` |
| `utils.cn.test.ts` | `lib/utils.ts` |
| `mixAttach.format.test.ts` | `lib/app-records/mixAttach.ts` (formatting helpers) |
| `schemas.entities.test.ts` | `lib/validation/schemas.ts` (customer/field/equipment/product/surfactant/pricing/quote) |

### 2b. Autonomous verification loop

`scripts/verify/` + npm scripts (`verify`, `verify:loop`, `verify:static`).
It runs lint → typecheck → unit → build → e2e, analyzes failures into a
prioritized remediation plan, writes reports to `.verify/`, and loops until
green or stalled. Full details in
[`AUTONOMOUS_VERIFICATION_LOOP.md`](./AUTONOMOUS_VERIFICATION_LOOP.md).

## 3. Coverage matrix (pure-logic modules)

| Module | Tested |
| --- | --- |
| `lib/calculations/mix.ts` | ✅ (pre-existing) |
| `lib/quotes/calculations.ts` | ✅ (new) |
| `lib/formatting/coordinates.ts` | ✅ (new) |
| `lib/auth/login-errors.ts` | ✅ (new) |
| `lib/form-errors.ts` | ✅ (new) |
| `lib/form-data.ts` | ✅ (pre-existing) |
| `lib/records/buildFilterHref.ts` | ✅ (new) |
| `lib/records/normalize.ts` | ✅ (pre-existing) |
| `lib/app-records/normalize.ts` | ✅ (pre-existing) |
| `lib/app-records/mixAttach.ts` | ✅ (mapping pre-existing + formatting new) |
| `lib/utils.ts` | ✅ (new) |
| `lib/validation/schemas.ts` | ✅ (mix/app pre-existing + entities new) |
| `lib/formDrafts/*` | ✅ (pre-existing: draftKey/draftMeaningful/saveGuard/loadBest) |
| `components/dashboard/dashboard-tokens.ts` | ✅ (pre-existing) |
| `e2e/lib/supabase-project-guard.ts` | ✅ (pre-existing) |

## 4. How to run everything

```bash
npm run check          # static + unit (fast)
npm run verify         # full gate: static + unit + build + e2e (one pass)
npm run verify:loop    # iterate to green / stall
```

## 5. Recommended next steps

These extend coverage further but were out of scope for the current change:

- **Component tests** for client components (forms, dashboard) with a DOM test
  runner — currently only reachable through e2e.
- **Authenticated e2e in CI** once the dedicated E2E project credentials are
  wired (the specs already exist and self-skip without secrets).
- **Data-bound e2e assertions** (records/quotes lists) per amendment 3 in
  [`E2E_CI_HANDOFF.md`](./E2E_CI_HANDOFF.md).
- **Coverage reporting** (e.g. c8) surfaced in the verification report.

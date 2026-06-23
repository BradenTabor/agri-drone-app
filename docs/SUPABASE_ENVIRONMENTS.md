# Supabase environments — prod/dev split (known risk)

**Problem (capture this first):** Production and local dev both use `vwilvdckfronjftrboje`, so dev work can corrupt live compliance records, and every CI safety layer rests on the allowlist being exact because they are one project. The dedicated E2E project (`wxftkrdwvzpggjrdntdf`) is the isolation pattern to extend — not a one-off for Playwright.

This doc is framing only. It does not prescribe the migration plan.

---

## Current project map

| Ref | Role | Notes |
|-----|------|-------|
| `vwilvdckfronjftrboje` | **Agri-drone prod + dev (shared)** | Vercel `NEXT_PUBLIC_SUPABASE_URL` on prod; `supabase link` for local dev. Same database. |
| `wxftkrdwvzpggjrdntdf` | **Agri-drone E2E** | Authenticated Playwright runs only (`E2E_ALLOWED_SUPABASE_PROJECT_REF`). Isolated fixtures; safe create/delete. |
| `emqqxfzahmwnehxcpxzp` | ATTS employee portal prod | **Permanent denylist** — not agri-drone; E2E must never target any production DB. |

Verify refs in the Supabase dashboard / Vercel env before changing guards. Do not label projects by assumption.

---

## Why this matters

Agri-drone stores herbicide application and mix records — regulatory data. A shared prod/dev database means:

1. **Local migrations, seeds, or ad-hoc SQL** can alter or delete production rows.
2. **Perimeter CI** (`vwilvdckfronjftrboje`) is read-only by spec, but it still hits live data; misconfiguration is a compliance incident, not a test flake.
3. **Fail-closed guards** (`e2e/lib/supabase-project-guard.ts`) reduce blast radius for automated tests; they do not separate dev from prod for human work.

---

## What already works

- E2E isolation on `wxftkrdwvzpggjrdntdf` — dedicated project, explicit allowlist, authenticated writes allowed.
- Prod denylist for unrelated apps (`emqqxfzahmwnehxcpxzp`).
- Perimeter smoke in CI against public auth surface only.

See `docs/E2E_CI_HANDOFF.md` for guard mechanics and CI wiring.

---

## Open items (not blocking ship)

| Item | Action |
|------|--------|
| **Prod/dev split** | Schedule when there is runway: new dev project (or branch-based workflow), point local `.env.local` / CLI link at dev, keep Vercel prod on `vwilvdckfronjftrboje`. Mirror E2E pattern. |
| **Dead Supabase project** | Delete from dashboard when convenient (orphaned / unused project — confirm ref in dashboard before delete). |
| **Authenticated E2E expansion** | Separate feature track — record create/delete specs once allowlist project is stable. |

---

## Related code

- `e2e/lib/supabase-project-guard.ts` — denylist, allowlist, fail-closed CI checks
- `.github/workflows/smoke.yml` — perimeter job; prod deny runs before allowlist
- `docs/DEPLOY_CHECKLIST.md` — manual prod verification; do not treat perimeter CI as full certification

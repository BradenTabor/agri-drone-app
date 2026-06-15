# E2E CI Handoff — Phased Supabase Isolation

Paste-ready implementation spec for Playwright smoke CI, fail-closed Supabase guards, and authenticated test hardening.

## Decision summary

| Choice | Detail |
|--------|--------|
| **E2E Supabase strategy** | Option (2): dedicated E2E project — **phased** |
| **Phase A (ship now)** | Perimeter CI + guard scaffolding |
| **Phase B (Task 2 gate)** | Create dedicated E2E project; fill `E2E_ALLOWED_SUPABASE_PROJECT_REF` |
| **Ship posture** | Manual QA carries production; automated suite guards the auth **perimeter** only |

### Why dedicated E2E (not shared dev DB)

Task 2 anticipates create-and-delete mix-record tests. Shared dev DB risks test fixtures alongside real-ish herbicide application logs — unacceptable for a regulatory app. A dedicated E2E project also restores MCP introspection for debugging.

**Cost:** Third migration target. Same drift discipline as dev/prod — known shape of work.

---

## Known Supabase project refs

| Ref | Name | Role |
|-----|------|------|
| `emqqxfzahmwnehxcpxzp` | ATTS portal APP 2 | **Production — permanent denylist** |
| `vwilvdckfronjftrboje` | ATS app Project | Local dev / CLI link — **not** designated E2E |
| `E2E_ALLOWED_SUPABASE_PROJECT_REF` | *(empty until Task 2)* | **Dedicated E2E allowlist — intentional blank** |

The blank allowlist is **safe**: fail-closed guard blocks authenticated runs until the ref is set.

---

## Current test inventory

| Suite | Count | Needs auth | Writes data |
|-------|-------|------------|-------------|
| `e2e/smoke/public-auth.spec.ts` | 4 | No | No |
| `e2e/smoke/auth-guard.spec.ts` | 13 | No | No |
| `e2e/smoke/authenticated.spec.ts` | 6 | Yes | No (navigation only today) |

**17 passing / 6 skipped** without `E2E_EMAIL`/`E2E_PASSWORD`.

Port `3002` (override via `E2E_PORT`) runs `next start` against env-loaded Supabase config.

---

## Four amendments (baked in)

### Amendment 1 — Fail-closed allowlist (not denylist-only)

Original Task 1 threw only when URL matched prod. That protects one ref you remembered to ban.

**Required behavior:**

1. **Authenticated runs:** `E2E_ALLOWED_SUPABASE_PROJECT_REF` must be set **and** match the live URL ref — otherwise **abort**.
2. **All runs:** Live ref must **not** be on the permanent prod denylist (`emqqxfzahmwnehxcpxzp`).

With no allowed ref set, authenticated tests cannot run — no accidental-prod-auth window.

### Amendment 2 — Credential / trace exposure

Once `E2E_PASSWORD` flows through login, Playwright trace/video can capture secrets.

**Required:**

- Authenticated project: `trace: 'off'` (or `'retain-on-failure'` with documented scrubbing policy).
- Creds only in masked CI secrets — never committed.
- Test account: disposable, least-privilege user in the **E2E project only** — never a real operator account.

### Amendment 3 — Data-bound assertions (Task 2 extension)

"Page loads" passes when shell renders while data fetch 500s.

**Task 2 extension:** Assert data-bound elements — e.g. records table rows or a known empty-state string — not just headings.

### Amendment 4 — Perimeter CI false-green trap

Next.js inlines `NEXT_PUBLIC_*` at **build** time. Perimeter job without Supabase URL + anon key → app cannot init auth correctly → auth-guard tests pass for the wrong reason.

**Required:** Perimeter CI job must inject `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` at **build and test runtime**. Anon key is public by design — use repository **variables**, not hidden-as-secret hygiene that omits them.

Perimeter target: `vwilvdckfronjftrboje` public config (read-only, no auth, no writes).

---

## Phase A — Implement now

### Task 3a — Perimeter CI job

**File:** `.github/workflows/smoke.yml`

**Job: `smoke-perimeter`**

- Trigger: `push`, `pull_request`
- Steps:
  1. `npm ci` in `agri-drone-app`
  2. **Build** with env:
     - `NEXT_PUBLIC_SUPABASE_URL` = `https://vwilvdckfronjftrboje.supabase.co` (or `vars.E2E_PERIMETER_SUPABASE_URL`)
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = perimeter anon key (`vars.E2E_PERIMETER_SUPABASE_ANON_KEY`)
  3. `npx playwright install --with-deps chromium`
  4. `npm run test:smoke:perimeter` with same Supabase env + `CI=true` + `E2E_TEST_MODE=perimeter`

**Acceptance:**

- [ ] Build receives both `NEXT_PUBLIC_*` vars (verify in workflow YAML — not omitted)
- [ ] Runs only `public-auth` + `auth-guard` specs
- [ ] Fails PRs when perimeter smoke fails

### Task 1 (Phase A slice) — Guard scaffolding

**Files:**

- `e2e/lib/supabase-project-guard.ts` — ref extraction + allowlist/denylist logic
- `e2e/global-setup.ts` — invokes guard before any tests

**Ref extraction (must be exact):**

```typescript
// Supabase hosted URL shape: https://<ref>.supabase.co
const SUPABASE_HOSTED_URL_RE = /^https:\/\/([a-z0-9]+)\.supabase\.co\/?$/i;
```

Reject malformed URLs. Do not use loose hostname splits.

**Guard modes:**

| Mode | When | Checks |
|------|------|--------|
| `perimeter` | `E2E_TEST_MODE=perimeter` or perimeter npm script | URL present + parseable; not on prod denylist |
| `authenticated` | `E2E_TEST_MODE=authenticated` or authenticated npm script | All perimeter checks + allowlist ref set + live ref matches allowlist |

**Critical:** On `CI=true` + authenticated mode, guard **must reject** even when `E2E_EMAIL` is unset. Guard runs in `globalSetup` before Playwright skip logic — empty allowlist aborts the job.

**Constants:**

```typescript
export const PROD_SUPABASE_PROJECT_DENYLIST = ["emqqxfzahmwnehxcpxzp"] as const;
export const E2E_ALLOWED_SUPABASE_PROJECT_REF = ""; // Task 2: fill when E2E project exists (store lowercase)
```

**Unit tests:** `e2e/lib/supabase-project-guard.test.ts` — run via `npm run test:unit`. Covers ref extraction and the four guard decisions (prod denied, empty allowlist aborts, mismatched allowlist aborts, matched allowlist passes). Wired into `npm run check`.

### Task 3b — Authenticated CI job (scaffold, fail-closed until Task 2)

**Job: `smoke-authenticated`**

- Trigger: `workflow_dispatch` only (Phase A) — or `push` to `main` once E2E project exists
- Sets `E2E_TEST_MODE=authenticated`
- Until Task 2: **expected to fail** at globalSetup (empty allowlist) — proves guard works
- After Task 2: add secrets `E2E_EMAIL`, `E2E_PASSWORD`, E2E project URL/key, fill allowlist constant

### npm scripts

```json
"test:smoke:perimeter": "E2E_TEST_MODE=perimeter playwright test e2e/smoke/public-auth.spec.ts e2e/smoke/auth-guard.spec.ts",
"test:smoke:authenticated": "E2E_TEST_MODE=authenticated playwright test e2e/smoke/authenticated.spec.ts"
```

Keep `test:smoke` as all specs (local dev).

### Docs / env templates

- `/.env.e2e.example` — document all E2E vars; note allowlist blank is intentional
- Update `docs/DEPLOY_CHECKLIST.md` — distinguish automated perimeter vs manual core flows

---

## Phase B — Task 2 opening step (deferred)

### Create dedicated E2E Supabase project

1. Create new Supabase project under MCP-visible org
2. Apply all migrations (`supabase db push` or CI migration step)
3. Seed disposable test user (`e2e@…`, least privilege)
4. Set `E2E_ALLOWED_SUPABASE_PROJECT_REF` in `e2e/lib/supabase-project-guard.ts` (**lowercase ref** — extraction lowercases before compare)
5. Add GitHub secrets: `E2E_EMAIL`, `E2E_PASSWORD`, E2E project `NEXT_PUBLIC_*`
6. Enable authenticated CI job on PRs

### Task 2 — Authenticated test hardening

1. Un-skip / run `authenticated.spec.ts` when creds present (guard must pass first)
2. Extend read-only coverage:
   - `/app-records` list loads with data-bound assertion
   - `/quotes` list loads with data-bound assertion
   - Authenticated PDF GET returns 200 (fixture ID from E2E project)
3. Later: create-and-delete mix record with `afterEach` cleanup **only in E2E project**

### playwright.config.ts — authenticated trace policy

```typescript
// Per-amendment 2: no trace capture on authenticated runs
trace: process.env.E2E_TEST_MODE === "authenticated" ? "off" : "on-first-retry",
```

---

## GitHub repository configuration

### Variables (public config — not secrets)

| Variable | Purpose |
|----------|---------|
| `E2E_PERIMETER_SUPABASE_URL` | `https://vwilvdckfronjftrboje.supabase.co` |
| `E2E_PERIMETER_SUPABASE_ANON_KEY` | vwilvdck anon key (public) |

### Secrets (after Task 2)

| Secret | Purpose |
|--------|---------|
| `E2E_EMAIL` | Disposable test user |
| `E2E_PASSWORD` | Disposable test user |
| `E2E_SUPABASE_URL` | Dedicated E2E project URL |
| `E2E_SUPABASE_ANON_KEY` | Dedicated E2E anon key |

---

## Verification checklist (report back)

When implementation is complete, confirm:

1. **Ref extraction:** Show `extractSupabaseProjectRef()` and verify it parses `https://<ref>.supabase.co` exactly — no loose hostname logic.
2. **Fail-closed on CI:** Authenticated job path with `CI=true` + empty allowlist rejects **before** tests run, even when `E2E_EMAIL` is unset.
3. **Task 3a build env:** Perimeter workflow passes `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to **`npm run build`** — not just the test step.
4. **Guard unit tests:** `npm run test:unit` passes — ref extraction + fail-closed decision matrix cannot regress silently.

---

## Acceptance criteria (full)

### Phase A (now)

- [ ] `docs/E2E_CI_HANDOFF.md` committed (this file)
- [ ] Guard module + globalSetup wired in Playwright
- [ ] Perimeter CI runs on every push/PR
- [ ] Build step has Supabase public env (no false-green)
- [ ] Authenticated CI scaffold fails closed until allowlist filled
- [ ] Guard unit tests pass (`npm run test:unit`)
- [ ] `.env.e2e.example` documents vars
- [ ] DEPLOY_CHECKLIST updated

### Phase B (Task 2)

- [ ] Dedicated E2E Supabase project created
- [ ] `E2E_ALLOWED_SUPABASE_PROJECT_REF` filled
- [ ] Authenticated tests pass with data-bound assertions
- [ ] Trace off for authenticated runs
- [ ] Create/delete mix-record tests with cleanup

---

## How to run locally

```bash
# Perimeter only (uses .env.local Supabase config)
cd agri-drone-app
npm run build
npm run test:smoke:perimeter

# All smoke (authenticated skips without creds + allowlist)
npm run test:smoke

# Authenticated (requires allowlist ref + .env.e2e.local creds)
npm run test:smoke:authenticated
```

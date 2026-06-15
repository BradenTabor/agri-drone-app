# Deploy Checklist (Vercel First Deploy)

This checklist is for Braden to run manually. Cursor should not execute the deploy steps.

## Goal

Deploy the Next.js app to Vercel for the first time, then verify production behavior before sharing with a tester.

## 1) Pre-Deploy Checks (Required)

- [ ] From project root, run `npm run build` and confirm it passes locally one more time.
- [ ] Confirm `.gitignore` includes all of the following:
  - [ ] `.env.local`
  - [ ] `.env*.local`
  - [ ] `node_modules`
  - [ ] `.next`
  - [ ] `.vercel`
- [ ] Confirm secrets are not committed in git history:
  - [ ] Real Mapbox token
  - [ ] Supabase service role key
  - [ ] Any other secret from `.env.local`
- [ ] Run `git status` and confirm working tree is clean.
- [ ] If not clean, commit changes with a descriptive message before deploy.
- [ ] Confirm GitHub remote repo exists and local is up to date with it.
- [ ] If local commits are not pushed, run `git push` first.

Suggested command sequence (copy/paste in project root):

```bash
npm run build
git status
git remote -v
git fetch origin
git status -sb
git log --oneline origin/$(git branch --show-current)..HEAD
```

Secret-history spot checks (replace placeholders with known key fragments, not full keys):

```bash
git log --all -- .env.local
git log -S"<mapbox_token_fragment>" --all --oneline
git log -S"<supabase_service_role_fragment>" --all --oneline
```

## 2) Vercel Setup (Manual by Braden)

Choose one of these two setup paths:

### Option A: Vercel CLI

- [ ] From project root, run `vercel`.
- [ ] Follow prompts to create/link the Vercel project.
- [ ] Confirm the correct repo/root directory is selected.
- [ ] Complete initial deploy.

### Option B: Vercel Dashboard

- [ ] Open Vercel dashboard and import the GitHub repository.
- [ ] Confirm framework preset is Next.js.
- [ ] Confirm correct root directory and build settings.
- [ ] Create project and trigger deploy.

After project creation, add environment variables in Vercel Project Settings:

- [ ] Add for **Production** environment:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `NEXT_PUBLIC_MAPBOX_TOKEN`
- [ ] Also add the same values for **Preview** (recommended if preview deploys should work).
- [ ] Redeploy after env vars are added/updated so they take effect.

## 3) Post-Deploy Verification (Manual Smoke Test)

- [ ] Open deployed Vercel URL in browser.
- [ ] Log in with test applicator account.
- [ ] Navigate to `/customers`, `/equipment`, `/products`; confirm data loads.
- [ ] Create a new mix record end-to-end.
- [ ] Download the PDF; confirm it generates successfully.
- [ ] Navigate to `/map`; confirm satellite tiles load and pins appear.
- [ ] Log out, then log in as admin; confirm RLS behavior is still correct in production.
- [ ] Open DevTools console and verify no runtime errors during normal navigation.

If any smoke check fails:

- [ ] Capture exact failure details (page, action, error text, console/network errors).
- [ ] Do not push ad-hoc fixes without review.
- [ ] Triage failures first, then implement reviewed fixes.

## 4) First-Deploy Bug Watchlist

Pay special attention to these common production-only issues:

- [ ] Missing env vars in Vercel (symptoms: missing-token guards, Supabase queries failing silently).
- [ ] `NEXT_PUBLIC_*` and server-only vars mixed up.
- [ ] Mapbox token domain restrictions:
  - [ ] If token is restricted to localhost only, map will fail on Vercel domain.
  - [ ] Add Vercel deployment domain to allowed URLs in Mapbox token settings.
- [ ] `force-dynamic` route behavior differences in production:
  - [ ] Verify PDF download route specifically (`renderToStream` cast known wart).

## 4b) Automated vs Manual Test Coverage

| Layer | What it proves | How |
|-------|----------------|-----|
| **Automated perimeter** | Public auth pages render; protected routes redirect; PDF APIs return 401 | `npm run test:smoke:perimeter` — runs in CI on every push/PR |
| **Automated authenticated** | Post-login navigation (Task 2: data-bound assertions) | `npm run test:smoke:authenticated` — blocked until dedicated E2E Supabase project exists |
| **Manual core flows** | Herbicide record create/save, quotes, PDF export, map, RLS | `docs/MIX_RECORD_QA_CHECKLIST.md` |

See `docs/E2E_CI_HANDOFF.md` for CI setup, fail-closed Supabase guards, and Phase A/B plan.

**Do not treat perimeter smoke as full production certification.**

## 5) Deploy Result Template (Send Back Here)

Use this template when reporting back:

```txt
Deploy status: PASS | FAIL
Deployed URL: <url>

Smoke check results:
- Login (applicator): PASS/FAIL
- /customers: PASS/FAIL
- /equipment: PASS/FAIL
- /products: PASS/FAIL
- Create mix record: PASS/FAIL
- PDF download: PASS/FAIL
- /map tiles + pins: PASS/FAIL
- Logout/login as admin (RLS check): PASS/FAIL
- DevTools console clean: PASS/FAIL

If FAIL:
- What failed:
- Exact error text:
- Repro steps:
- Suspected cause:
```

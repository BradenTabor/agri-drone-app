# Autonomous Verification Loop

A single command that runs **every** quality gate in the project, analyzes the
results, produces a prioritized remediation plan, and (in loop mode) re-runs
until the project is production-ready or no further progress can be made.

> **Trigger phrase:** "run the verification loop" → run `npm run verify:loop`,
> then read `.verify/report.md`, apply the remediation plan, and re-run until
> `productionReady: true`.

## TL;DR

```bash
# One full pass (lint → typecheck → unit → build → e2e)
npm run verify

# Loop: re-run all suites until green or stalled
npm run verify:loop

# Fast inner loop while editing pure logic (no build/e2e)
npm run verify:static
```

Reports are written to `.verify/` (gitignored):

| File | Purpose |
| --- | --- |
| `.verify/report.json` | Machine-readable result + remediation plan |
| `.verify/report.md` | Human-readable summary, stage table, plan, failure tails |
| `.verify/history.jsonl` | One line per pass — track progress across iterations |

## What it runs

Stages run in order; cheaper gates fail fast, the production build runs before
any e2e suite, and authenticated e2e (most prerequisites) runs last.

| Stage | Command | Blocking | Prerequisites |
| --- | --- | --- | --- |
| `lint` | `npm run lint` | yes | — |
| `typecheck` | `npm run typecheck` | yes | — |
| `unit` | `npm run test:unit` | yes | — |
| `build` | `npm run build` | yes | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `e2e-perimeter` | `npm run test:smoke:perimeter` | yes | build + Playwright browsers + non-prod Supabase public env |
| `e2e-authenticated` | `npm run test:smoke:authenticated` | no | build + browsers + `E2E_EMAIL` / `E2E_PASSWORD` + dedicated E2E project |

A stage is **skipped** (not failed) when a prerequisite is missing — e.g. no
Supabase env, browsers not installed, or the build did not pass. Skips of a
**blocking** stage still mean "not production ready".

## Outputs and exit codes

| Exit code | Meaning |
| --- | --- |
| `0` | Production ready — every blocking stage passed |
| `1` | Not ready — at least one blocking stage failed or was skipped |
| `2` | Stalled — deterministic stages failed identically across two loop passes |

`productionReady` is `true` only when no blocking stage failed **and** no
blocking stage was skipped.

## How an agent drives the loop

This is the "fully autonomous" workflow. The harness automates running,
analyzing, reporting, and re-running. The agent (or developer) supplies the code
fixes between passes:

1. Run `npm run verify` (or `npm run verify:loop`).
2. Read `.verify/report.json` → `plan` (ordered, de-duplicated remediation steps)
   and each failed stage's `outputTail`.
3. Apply the smallest correct fix for the highest-priority finding. Prefer
   fixing the source of truth (implementation vs. test) deliberately.
4. Re-run the loop. Repeat until `productionReady: true`.
5. Stop early if exit code `2` (stalled): the same deterministic failures keep
   recurring, so a different fix is required — do not keep blindly re-running.

The analyzer recognizes common failure signatures and maps them to concrete
fixes, including: TypeScript type errors, ESLint errors, unit-test failures,
Next build compile errors, module-not-found, missing Supabase env, missing
Playwright browsers, the Playwright web-server failing to boot, and Playwright
test failures.

## CLI flags

`npm run verify -- <flags>` (or `tsx scripts/verify/cli.ts <flags>`):

| Flag | Description |
| --- | --- |
| `--loop` | Re-run all suites until green or stalled (default 5 passes) |
| `--max-iterations <n>` | Cap loop passes |
| `--only <ids>` | Run only these stages, e.g. `--only lint,typecheck,unit` |
| `--skip <ids>` | Skip these stages |
| `--delay-ms <n>` | Delay between loop passes |
| `-h, --help` | Usage + stage list |

> Note: `--only` enforces the same prerequisite gating. `e2e-*` stages need the
> `build` stage in the **same pass**, so use `--only build,e2e-perimeter` rather
> than `--only e2e-perimeter` alone.

## Environment prerequisites

To take e2e stages from "skipped" to "passing", provide:

1. **Supabase public env** (non-prod). Copy `.env.e2e.example` → `.env.e2e.local`
   and fill the anon key, or export `NEXT_PUBLIC_SUPABASE_URL` /
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`. The fail-closed guard in
   `e2e/lib/supabase-project-guard.ts` refuses production refs. See
   [`E2E_CI_HANDOFF.md`](./E2E_CI_HANDOFF.md).
2. **Playwright browsers:** `npx playwright install --with-deps chromium`.
3. **Authenticated only:** `E2E_EMAIL` / `E2E_PASSWORD` for a disposable,
   least-privilege user in the dedicated E2E project.

### Sandbox/login-shell gotcha

`playwright.config.ts` boots its web server with `bash -lc`. In environments
that use `nvm` with `npm_config_prefix` set, the login shell may fail to find
`npm` (exit 127). The analyzer flags this as `e2e-webserver-start-failed`.
Workarounds:

- `unset npm_config_prefix` so nvm initializes `node`/`npm` on PATH, **or**
- start the server yourself and point Playwright at it:
  ```bash
  npm run start -- -p 3002          # in one shell
  PLAYWRIGHT_BASE_URL=http://localhost:3002 npm run verify -- --only e2e-perimeter
  ```
  When `PLAYWRIGHT_BASE_URL` is set, Playwright skips its managed web server.

## Relationship to CI

CI (`.github/workflows/smoke.yml`) runs the same gates with `actions/setup-node`
(clean PATH) and repository-provided Supabase config, so all stages execute
there. The verification loop is the local/agent-facing equivalent that adds
result analysis, a remediation plan, and the iterate-to-green loop.

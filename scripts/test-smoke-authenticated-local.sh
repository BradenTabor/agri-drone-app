#!/usr/bin/env bash
# Build with .env.e2e.local baked in, then run authenticated smoke against a fresh server.
# See docs/E2E_CI_HANDOFF.md — Amendment 4 (NEXT_PUBLIC_* is inlined at next build).
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ ! -f .env.e2e.local ]]; then
  echo "Missing .env.e2e.local — copy from .env.e2e.example" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1091
. ./.env.e2e.local
set +a

ref=""
if [[ -n "${NEXT_PUBLIC_SUPABASE_URL:-}" ]]; then
  ref=$(printf '%s' "$NEXT_PUBLIC_SUPABASE_URL" | sed -n 's|^https://\([^.]*\)\.supabase\.co.*|\1|p')
fi
echo "E2E build Supabase ref: ${ref:-MISSING/INVALID}"

npm run build

export E2E_FRESH_SERVER=1
export E2E_TEST_MODE=authenticated
exec npx playwright test e2e/smoke/authenticated.spec.ts e2e/smoke/records.authenticated.spec.ts

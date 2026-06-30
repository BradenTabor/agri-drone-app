import {
  E2E_SUPABASE_UNREACHABLE_SKIP_REASON,
  isE2eSupabaseReachable,
} from "./lib/e2e-supabase-reachability";
import {
  assertSupabaseTargetSafe,
  resolveE2eTestMode,
} from "./lib/supabase-project-guard";
import { loadLocalE2eEnv } from "./lib/load-local-env";

export default async function globalSetup(): Promise<void> {
  loadLocalE2eEnv();

  const mode = resolveE2eTestMode();

  // Prod-safety guard runs first and must never be relaxed.
  assertSupabaseTargetSafe({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    mode,
    ci: process.env.CI === "true",
  });

  // Surface a single, clear log line when the dedicated E2E project is down so
  // the resulting skips are explainable in CI output.
  if (mode === "authenticated" && !(await isE2eSupabaseReachable())) {
    console.warn(`[e2e] ${E2E_SUPABASE_UNREACHABLE_SKIP_REASON}`);
  }
}

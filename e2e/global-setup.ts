import {
  assertSupabaseTargetSafe,
  resolveE2eTestMode,
} from "./lib/supabase-project-guard";
import { loadLocalE2eEnv } from "./lib/load-local-env";

export default async function globalSetup(): Promise<void> {
  loadLocalE2eEnv();

  assertSupabaseTargetSafe({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    mode: resolveE2eTestMode(),
    ci: process.env.CI === "true",
  });
}

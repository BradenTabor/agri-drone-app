export const PROD_SUPABASE_PROJECT_DENYLIST = ["emqqxfzahmwnehxcpxzp"] as const;

/** Dedicated E2E Supabase project (lowercase ref; must match NEXT_PUBLIC_SUPABASE_URL). */
export const E2E_ALLOWED_SUPABASE_PROJECT_REF = "wxftkrdwvzpggjrdntdf";

const SUPABASE_HOSTED_URL_RE = /^https:\/\/([a-z0-9]+)\.supabase\.co\/?$/i;

export type E2eTestMode = "perimeter" | "authenticated";

export function extractSupabaseProjectRef(supabaseUrl: string): string | null {
  const trimmed = supabaseUrl.trim();
  const match = SUPABASE_HOSTED_URL_RE.exec(trimmed);
  return match?.[1]?.toLowerCase() ?? null;
}

export function assertSupabaseTargetSafe(options: {
  supabaseUrl: string | undefined;
  mode: E2eTestMode;
  ci: boolean;
  allowedRef?: string;
}): void {
  const { supabaseUrl, mode, ci, allowedRef = E2E_ALLOWED_SUPABASE_PROJECT_REF } = options;

  if (!supabaseUrl?.trim()) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is required for E2E runs. " +
        "Perimeter CI must inject public Supabase config at build and test time (see docs/E2E_CI_HANDOFF.md).",
    );
  }

  const liveRef = extractSupabaseProjectRef(supabaseUrl);
  // Unparseable URLs (custom domains) bypass the ref-only prod denylist—do not relax without a host-level prod check.
  if (!liveRef) {
    throw new Error(
      `Could not parse Supabase project ref from URL "${supabaseUrl}". ` +
        "Expected format: https://<ref>.supabase.co",
    );
  }

  if ((PROD_SUPABASE_PROJECT_DENYLIST as readonly string[]).includes(liveRef)) {
    throw new Error(
      `Refusing to run E2E against production Supabase project "${liveRef}".`,
    );
  }

  if (mode !== "authenticated") {
    return;
  }

  const normalizedAllowedRef = allowedRef.trim().toLowerCase();
  if (!normalizedAllowedRef) {
    throw new Error(
      "E2E_ALLOWED_SUPABASE_PROJECT_REF must be set for authenticated E2E runs. " +
        "Create the dedicated E2E Supabase project (Task 2) and fill the allowlist constant. " +
        (ci ? "CI authenticated job aborted (fail-closed)." : ""),
    );
  }

  if (liveRef !== normalizedAllowedRef) {
    throw new Error(
      `Supabase URL ref "${liveRef}" does not match allowed E2E ref "${normalizedAllowedRef}".`,
    );
  }
}

export function resolveE2eTestMode(): E2eTestMode {
  const mode = process.env.E2E_TEST_MODE;
  if (mode === "authenticated") {
    return "authenticated";
  }
  if (mode === "perimeter") {
    return "perimeter";
  }

  if (process.env.E2E_EMAIL || process.env.E2E_PASSWORD) {
    return "authenticated";
  }

  return "perimeter";
}

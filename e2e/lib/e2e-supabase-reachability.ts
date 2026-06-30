/**
 * Availability probe for the dedicated E2E Supabase project.
 *
 * Authenticated smoke tests can only run against a live dedicated E2E project.
 * Supabase free-tier projects auto-pause after a stretch of inactivity, which
 * removes the `<ref>.supabase.co` subdomain (DNS no longer resolves). When that
 * happens every sign-in fails and the whole authenticated suite times out with
 * confusing `toHaveURL` errors on PRs that never touched auth.
 *
 * This probe lets the authenticated specs *skip* (matching the existing
 * "skip when the E2E environment is unavailable" posture) instead of hard
 * failing on an external outage. The prod-safety guard in
 * `assertSupabaseTargetSafe` still runs first, so this only ever probes the
 * allowlisted E2E project — never production.
 */

const REACHABILITY_TIMEOUT_MS = 10_000;

/** Build the GoTrue health endpoint URL for a Supabase project URL. */
export function buildSupabaseHealthUrl(supabaseUrl: string): string {
  return `${supabaseUrl.trim().replace(/\/+$/, "")}/auth/v1/health`;
}

export const E2E_SUPABASE_UNREACHABLE_SKIP_REASON =
  "Dedicated E2E Supabase project is unreachable (the <ref>.supabase.co host did not respond — " +
  "a free-tier project paused after inactivity behaves this way). Restore/unpause the project in the " +
  "Supabase dashboard, then re-run. Skipping authenticated smoke rather than failing on an external outage.";

let cachedProbe: Promise<boolean> | null = null;

async function probeSupabaseReachable(): Promise<boolean> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!supabaseUrl) {
    // No target configured — other skip conditions (missing creds) already cover this.
    return false;
  }

  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REACHABILITY_TIMEOUT_MS);

  try {
    const response = await fetch(buildSupabaseHealthUrl(supabaseUrl), {
      headers: anonKey ? { apikey: anonKey } : undefined,
      signal: controller.signal,
    });
    // Any HTTP response means the host resolved and the platform answered, so the
    // project is live. Treat only gateway/unavailable (5xx) as "down" — a paused
    // or deleted project surfaces as a thrown network/DNS error (handled below).
    return response.status < 500;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

/** Memoized: probe the dedicated E2E Supabase project once per process. */
export function isE2eSupabaseReachable(): Promise<boolean> {
  cachedProbe ??= probeSupabaseReachable();
  return cachedProbe;
}

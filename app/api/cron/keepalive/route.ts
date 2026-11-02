import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "@/types/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const QUERY_TIMEOUT_MS = 10_000;

type KeepaliveTarget = {
  name: string;
  url: string | undefined;
  key: string | undefined;
};

/**
 * Runs a one-row select so Postgres itself sees activity. RLS hides the row from
 * the anon role, so an empty result with no error is the expected success.
 */
async function pingDatabase({ url, key }: KeepaliveTarget): Promise<string | null> {
  if (!url || !key) {
    return "Missing Supabase URL or key.";
  }

  const supabase = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const { error } = await supabase
      .from("pricing_config")
      .select("id")
      .limit(1)
      .abortSignal(AbortSignal.timeout(QUERY_TIMEOUT_MS));

    return error ? error.message : null;
  } catch (error) {
    return error instanceof Error ? error.message : "Unknown error.";
  }
}

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;

  // Fail closed: an unset secret must not leave the route open.
  if (!cronSecret) {
    console.error("[cron/keepalive] CRON_SECRET is not set");
    return NextResponse.json({ error: "Not configured." }, { status: 500 });
  }

  if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const targets: KeepaliveTarget[] = [
    {
      name: "production",
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },
  ];

  // Crons only run on the production deployment, so the E2E project needs its own target.
  if (process.env.KEEPALIVE_E2E_SUPABASE_URL) {
    targets.push({
      name: "e2e",
      url: process.env.KEEPALIVE_E2E_SUPABASE_URL,
      key: process.env.KEEPALIVE_E2E_SUPABASE_KEY,
    });
  }

  const results = await Promise.all(
    targets.map(async (target) => ({
      name: target.name,
      error: await pingDatabase(target),
    })),
  );

  const failed = results.filter((result) => result.error);
  failed.forEach(({ name, error }) => {
    console.error(`[cron/keepalive] ${name} failed: ${error}`);
  });

  return NextResponse.json(
    { ok: failed.length === 0, targets: results.map(({ name, error }) => ({ name, ok: !error })) },
    { status: failed.length === 0 ? 200 : 503 },
  );
}

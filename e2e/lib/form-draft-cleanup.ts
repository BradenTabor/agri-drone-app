import type { Page } from "@playwright/test";

import type { FormDraftType } from "@/lib/formDrafts/types";

import { loadLocalE2eEnv } from "./load-local-env";

const BASE64_PREFIX = "base64-";

function stringFromBase64URL(value: string): string {
  const pad = value.length % 4;
  const padded = pad ? `${value}${"=".repeat(4 - pad)}` : value;
  return Buffer.from(padded.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
}

function decodeCookieValue(value: string): string {
  if (value.startsWith(BASE64_PREFIX)) {
    return stringFromBase64URL(value.slice(BASE64_PREFIX.length));
  }
  return decodeURIComponent(value);
}

function combineCookieChunks(
  cookies: { name: string; value: string }[],
  key: string,
): string | null {
  const direct = cookies.find((cookie) => cookie.name === key);
  if (direct?.value) {
    return direct.value;
  }

  const chunks: string[] = [];
  for (let index = 0; ; index += 1) {
    const chunk = cookies.find((cookie) => cookie.name === `${key}.${index}`);
    if (!chunk?.value) {
      break;
    }
    chunks.push(chunk.value);
  }

  return chunks.length > 0 ? chunks.join("") : null;
}

function getSupabaseSessionFromPageCookies(
  cookies: { name: string; value: string }[],
  projectRef: string,
): { accessToken: string; userId: string } | null {
  const storageKey = `sb-${projectRef}-auth-token`;
  const raw = combineCookieChunks(cookies, storageKey);
  if (!raw) {
    return null;
  }

  try {
    const session = JSON.parse(decodeCookieValue(raw)) as {
      access_token?: string;
      user?: { id?: string };
    };

    if (!session.access_token || !session.user?.id) {
      return null;
    }

    return { accessToken: session.access_token, userId: session.user.id };
  } catch {
    return null;
  }
}

/**
 * Deletes the logged-in user's server draft row via Supabase REST — same table/RLS path
 * as `deleteServerFormDraft`. Must run after UI login so we reuse the browser session
 * (a separate sign-in would invalidate the Playwright session).
 */
export async function clearServerFormDraft(page: Page, formType: FormDraftType): Promise<void> {
  loadLocalE2eEnv();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) {
    throw new Error(
      "E2E form draft cleanup requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  const projectRef = new URL(url).hostname.split(".")[0] ?? "";
  const cookies = await page.context().cookies();
  const session = getSupabaseSessionFromPageCookies(cookies, projectRef);

  if (!session) {
    throw new Error(
      "E2E form draft cleanup requires an authenticated browser session (call after login).",
    );
  }

  const response = await page.request.delete(
    `${url}/rest/v1/form_drafts?user_id=eq.${session.userId}&form_type=eq.${formType}`,
    {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${session.accessToken}`,
        Prefer: "return=minimal",
      },
    },
  );

  if (!response.ok() && response.status() !== 404) {
    throw new Error(
      `E2E form draft cleanup failed for ${formType}: ${response.status()} ${await response.text()}`,
    );
  }
}

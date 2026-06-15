import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "@/types/database";

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error && isInvalidSessionError(error)) {
      await supabase.auth.signOut();
    } else if (!user) {
      await supabase.auth.signOut();
    }
  } catch (error) {
    if (isInvalidSessionError(error)) {
      try {
        await supabase.auth.signOut();
      } catch {
        // Ignore cleanup failures.
      }
    }
    // Fail open for transient auth backend/network issues so routes and
    // server actions still respond instead of surfacing a client fetch error.
  }
  return response;
}

function isInvalidSessionError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const authError = error as { message?: string; code?: string; status?: number };
  const message = authError.message?.toLowerCase() ?? "";
  const code = authError.code?.toLowerCase() ?? "";

  return (
    authError.status === 401 ||
    code.includes("refresh_token") ||
    code.includes("session_not_found") ||
    message.includes("refresh token") ||
    message.includes("invalid jwt") ||
    message.includes("jwt expired")
  );
}

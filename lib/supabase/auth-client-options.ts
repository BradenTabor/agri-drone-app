import type { SupabaseClientOptions } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

export const supabaseAuthClientOptions = {
  auth: {
    experimental: { passkey: true },
  },
} satisfies SupabaseClientOptions<Database>;

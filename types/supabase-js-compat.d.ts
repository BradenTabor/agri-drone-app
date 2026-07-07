import type { AuthUser } from "@supabase/supabase-js";

declare module "@supabase/supabase-js" {
  export type User = AuthUser;

  export interface AuthError extends Error {
    code?: string;
    status?: number;
  }
}

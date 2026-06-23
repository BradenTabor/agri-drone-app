import type { AuthError } from "@supabase/supabase-js";

export function mapLoginError(error: AuthError): string {
  if (error.code === "invalid_credentials") {
    return "Invalid email or password.";
  }

  if (error.code === "email_not_confirmed") {
    return "Your email is not confirmed yet. Please check your inbox and confirm your account.";
  }

  return "Unable to sign in right now. Please try again.";
}

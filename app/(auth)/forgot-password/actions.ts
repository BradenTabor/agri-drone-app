"use server";

import { createClient } from "@/lib/supabase/server";

export type ForgotPasswordState = {
  error: string | null;
  success: string | null;
};

export async function forgotPasswordAction(
  _previousState: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email) {
    return { error: "Email is required.", success: null };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      console.error("[forgot-password] supabase error", { email, error });
    }
  } catch (error) {
    console.error("[forgot-password] unexpected error", { email, error });
  }

  return {
    error: null,
    success:
      "If an account exists for that email, a password reset link has been sent.",
  };
}

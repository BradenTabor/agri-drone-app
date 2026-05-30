"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type LoginState = {
  error: string | null;
};

export async function loginAction(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      if (error.code === "invalid_credentials") {
        return { error: "Invalid email or password." };
      }

      if (error.code === "email_not_confirmed") {
        return {
          error:
            "Your email is not confirmed yet. Please check your inbox and confirm your account.",
        };
      }

      return { error: "Unable to sign in right now. Please try again." };
    }
  } catch {
    return { error: "Sign in is temporarily unavailable. Please try again." };
  }

  redirect("/");
}

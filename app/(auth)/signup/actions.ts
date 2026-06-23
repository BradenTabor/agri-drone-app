"use server";

import { checkboxValue } from "@/lib/form-data";
import { createClient } from "@/lib/supabase/server";

export type SignupState = {
  error: string | null;
  success: string | null;
};

function normalizePhone(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export async function signupAction(
  _previousState: SignupState,
  formData: FormData,
): Promise<SignupState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  const licenseCertNo = String(formData.get("licenseCertNo") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const dataConsent = checkboxValue(formData, "dataConsent");

  if (!email || !phone || !licenseCertNo || !password || !confirmPassword) {
    return {
      error: "Email, phone, pilot license, password, and confirmation are required.",
      success: null,
    };
  }

  if (phone.length > 40) {
    return { error: "Phone number must be 40 characters or fewer.", success: null };
  }

  if (licenseCertNo.length > 64) {
    return {
      error: "Pilot license / certificate number must be 64 characters or fewer.",
      success: null,
    };
  }

  if (!dataConsent) {
    return {
      error: "You must agree to data storage and operational communications to create an account.",
      success: null,
    };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match.", success: null };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters.", success: null };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          phone,
          license_cert_no: licenseCertNo,
          data_consent: true,
        },
      },
    });

    if (error) {
      const errorCode = String(error.code ?? "");
      const errorMessage = String(error.message ?? "");

      if (
        errorCode === "over_email_send_rate_limit" ||
        errorCode === "over_request_rate_limit" ||
        /rate limit/i.test(errorMessage)
      ) {
        return {
          error:
            "Too many signup emails were requested recently. Please wait a bit and try again.",
          success: null,
        };
      }

      if (error.code === "user_already_exists" || error.code === "email_exists") {
        return {
          error: "An account with that email already exists. Try signing in instead.",
          success: null,
        };
      }
      if (error.code === "email_address_invalid") {
        return {
          error:
            "That email address was rejected by authentication settings. Use a valid, deliverable email address.",
          success: null,
        };
      }
      console.error("[signup] supabase error", { email, code: error.code, message: error.message });
      return { error: "Unable to create account right now. Please try again.", success: null };
    }
  } catch {
    return { error: "Signup is temporarily unavailable. Please try again.", success: null };
  }

  return {
    error: null,
    success:
      "Account created. If email confirmation is enabled, check your inbox before signing in. After your first sign-in, enable Face ID from your account menu for faster access.",
  };
}

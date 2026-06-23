import type { AuthError } from "@supabase/supabase-js";

export function isPasskeySupported(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    typeof window.PublicKeyCredential !== "undefined" &&
    typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable ===
      "function"
  );
}

export function formatPasskeyError(error: AuthError | Error): string {
  const code = "code" in error ? String(error.code ?? "") : "";
  const message = error.message ?? "";

  switch (code) {
    case "passkey_disabled":
      return "Face ID sign-in is not enabled for this app yet. Use your email and password.";
    case "webauthn_credential_not_found":
      return "No Face ID passkey found for this device. Sign in with your password, then enable Face ID from your account menu.";
    case "webauthn_credential_exists":
      return "Face ID is already enabled on this device.";
    case "too_many_passkeys":
      return "You have reached the maximum number of passkeys. Remove one before adding another.";
    case "email_not_confirmed":
      return "Confirm your email before using Face ID sign-in.";
    case "user_banned":
      return "This account cannot sign in right now.";
    default:
      break;
  }

  if (/abort|cancel/i.test(message) || error.name === "AbortError") {
    return "Face ID sign-in was cancelled.";
  }

  if (/does not support webauthn/i.test(message)) {
    return "This browser does not support Face ID or passkey sign-in.";
  }

  return message || "Unable to use Face ID sign-in. Try your password instead.";
}

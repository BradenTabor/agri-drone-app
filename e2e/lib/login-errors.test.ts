import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { AuthError } from "@supabase/supabase-js";

import { mapLoginError } from "@/lib/auth/login-errors";

function authError(code: string): AuthError {
  return { code, name: "AuthApiError", message: code } as unknown as AuthError;
}

describe("mapLoginError", () => {
  it("maps invalid_credentials to a friendly message", () => {
    assert.equal(
      mapLoginError(authError("invalid_credentials")),
      "Invalid email or password.",
    );
  });

  it("maps email_not_confirmed to a confirmation prompt", () => {
    assert.match(
      mapLoginError(authError("email_not_confirmed")),
      /email is not confirmed/i,
    );
  });

  it("falls back to a generic message for unknown codes", () => {
    assert.equal(
      mapLoginError(authError("over_request_rate_limit")),
      "Unable to sign in right now. Please try again.",
    );
  });
});

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { isRetryableLoginAlertMessage } from "./record-form-helpers";

describe("isRetryableLoginAlertMessage", () => {
  it("does not retry credential or validation failures", () => {
    assert.equal(isRetryableLoginAlertMessage("Invalid email or password."), false);
    assert.equal(
      isRetryableLoginAlertMessage(
        "Your email is not confirmed yet. Please check your inbox and confirm your account.",
      ),
      false,
    );
    assert.equal(isRetryableLoginAlertMessage("Email and password are required."), false);
  });

  it("retries transient auth and network failures", () => {
    assert.equal(
      isRetryableLoginAlertMessage("Unable to sign in right now. Please try again."),
      true,
    );
    assert.equal(
      isRetryableLoginAlertMessage("Sign in is temporarily unavailable. Please try again."),
      true,
    );
    assert.equal(isRetryableLoginAlertMessage("Network error contacting Supabase Auth."), true);
    assert.equal(isRetryableLoginAlertMessage("Too many requests, please try again later."), true);
  });

  it("fails fast on unknown alerts", () => {
    assert.equal(isRetryableLoginAlertMessage("Unexpected login form state."), false);
  });
});

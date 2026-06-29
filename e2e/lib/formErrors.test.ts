import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { AuthError } from "@supabase/supabase-js";

import { mapLoginError } from "@/lib/auth/login-errors";
import {
  firstFieldErrorKey,
  listFieldErrorMessages,
  mixRecordFieldTargetSelector,
} from "@/lib/form-errors";

function authError(code: string): AuthError {
  return { code, message: code } as AuthError;
}

describe("mapLoginError", () => {
  it("maps invalid_credentials to a friendly message", () => {
    assert.equal(mapLoginError(authError("invalid_credentials")), "Invalid email or password.");
  });

  it("maps email_not_confirmed to a confirmation prompt", () => {
    assert.match(mapLoginError(authError("email_not_confirmed")), /not confirmed/);
  });

  it("falls back to a generic message for unknown codes", () => {
    assert.equal(
      mapLoginError(authError("rate_limited")),
      "Unable to sign in right now. Please try again.",
    );
  });
});

describe("listFieldErrorMessages", () => {
  it("returns an empty array when there are no field errors", () => {
    assert.deepEqual(listFieldErrorMessages(undefined), []);
  });

  it("flattens and de-duplicates messages across fields", () => {
    assert.deepEqual(
      listFieldErrorMessages({ a: ["Required."], b: ["Required.", "Too long."] }),
      ["Required.", "Too long."],
    );
  });

  it("ignores fields with undefined message arrays", () => {
    assert.deepEqual(listFieldErrorMessages({ a: undefined, b: ["Bad."] }), ["Bad."]);
  });
});

describe("firstFieldErrorKey", () => {
  it("returns null when there are no field errors", () => {
    assert.equal(firstFieldErrorKey(undefined), null);
  });

  it("returns the first field that has messages", () => {
    assert.equal(firstFieldErrorKey({ a: undefined, b: [], c: ["Bad."] }), "c");
  });

  it("returns null when every field is empty", () => {
    assert.equal(firstFieldErrorKey({ a: [], b: undefined }), null);
  });
});

describe("mixRecordFieldTargetSelector", () => {
  it("maps known fields to their dedicated selectors", () => {
    assert.equal(mixRecordFieldTargetSelector("recordDate"), "#recordDate");
    assert.equal(mixRecordFieldTargetSelector("productLines"), '[data-form-section="products"]');
  });

  it("falls back to a name attribute selector for unknown fields", () => {
    assert.equal(mixRecordFieldTargetSelector("tempF"), '[name="tempF"]');
  });
});

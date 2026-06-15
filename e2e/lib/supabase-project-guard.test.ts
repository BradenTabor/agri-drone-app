import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  assertSupabaseTargetSafe,
  extractSupabaseProjectRef,
  PROD_SUPABASE_PROJECT_DENYLIST,
} from "./supabase-project-guard";

const PROD_REF = PROD_SUPABASE_PROJECT_DENYLIST[0];
const PERIMETER_REF = "vwilvdckfronjftrboje";
const PERIMETER_URL = `https://${PERIMETER_REF}.supabase.co`;
const PROD_URL = `https://${PROD_REF}.supabase.co`;

describe("extractSupabaseProjectRef", () => {
  it("parses a valid hosted Supabase URL", () => {
    assert.equal(extractSupabaseProjectRef(PERIMETER_URL), PERIMETER_REF);
  });

  it("lowercases the ref from mixed-case input", () => {
    assert.equal(
      extractSupabaseProjectRef("https://VWILVDCKFRonJfTrBoje.supabase.co"),
      PERIMETER_REF,
    );
  });

  it("accepts a trailing slash", () => {
    assert.equal(extractSupabaseProjectRef(`${PERIMETER_URL}/`), PERIMETER_REF);
  });

  it("parses the production hosted URL ref (denylist enforced separately)", () => {
    assert.equal(extractSupabaseProjectRef(PROD_URL), PROD_REF);
  });

  it("returns null for malformed or non-hosted URLs", () => {
    assert.equal(extractSupabaseProjectRef(""), null);
    assert.equal(extractSupabaseProjectRef("not-a-url"), null);
    assert.equal(extractSupabaseProjectRef("http://vwilvdckfronjftrboje.supabase.co"), null);
    assert.equal(extractSupabaseProjectRef("https://vwilvdckfronjftrboje.supabase.com"), null);
    assert.equal(extractSupabaseProjectRef("https://app.example.com"), null);
    assert.equal(extractSupabaseProjectRef("http://localhost:54321"), null);
    assert.equal(
      extractSupabaseProjectRef("https://vwilvdckfronjftrboje.supabase.co/rest/v1"),
      null,
    );
  });
});

describe("assertSupabaseTargetSafe", () => {
  it("rejects the production project ref on any mode", () => {
    assert.throws(
      () =>
        assertSupabaseTargetSafe({
          supabaseUrl: PROD_URL,
          mode: "perimeter",
          ci: true,
        }),
      (error: unknown) =>
        error instanceof Error &&
        error.message.includes("production Supabase project") &&
        error.message.includes(PROD_REF),
    );
  });

  it("aborts authenticated runs when the allowlist is empty", () => {
    assert.throws(
      () =>
        assertSupabaseTargetSafe({
          supabaseUrl: PERIMETER_URL,
          mode: "authenticated",
          ci: true,
          allowedRef: "",
        }),
      (error: unknown) =>
        error instanceof Error &&
        error.message.includes("E2E_ALLOWED_SUPABASE_PROJECT_REF must be set") &&
        error.message.includes("fail-closed"),
    );
  });

  it("aborts authenticated runs when the allowlist does not match the live ref", () => {
    assert.throws(
      () =>
        assertSupabaseTargetSafe({
          supabaseUrl: PERIMETER_URL,
          mode: "authenticated",
          ci: true,
          allowedRef: "differentref123456",
        }),
      (error: unknown) =>
        error instanceof Error &&
        error.message.includes("does not match allowed E2E ref"),
    );
  });

  it("passes authenticated runs when the allowlist matches the live ref", () => {
    assert.doesNotThrow(() =>
      assertSupabaseTargetSafe({
        supabaseUrl: PERIMETER_URL,
        mode: "authenticated",
        ci: true,
        allowedRef: PERIMETER_REF,
      }),
    );
  });

  it("passes authenticated runs when the allowlist matches case-insensitively", () => {
    assert.doesNotThrow(() =>
      assertSupabaseTargetSafe({
        supabaseUrl: PERIMETER_URL,
        mode: "authenticated",
        ci: true,
        allowedRef: "VWILVDCKFRonJfTrBoje",
      }),
    );
  });

  it("passes perimeter runs for a non-prod hosted URL without an allowlist", () => {
    assert.doesNotThrow(() =>
      assertSupabaseTargetSafe({
        supabaseUrl: PERIMETER_URL,
        mode: "perimeter",
        ci: true,
        allowedRef: "",
      }),
    );
  });

  it("rejects missing supabaseUrl before mode-specific checks", () => {
    assert.throws(
      () =>
        assertSupabaseTargetSafe({
          supabaseUrl: undefined,
          mode: "perimeter",
          ci: true,
        }),
      (error: unknown) =>
        error instanceof Error && error.message.includes("NEXT_PUBLIC_SUPABASE_URL is required"),
    );
  });

  it("rejects unparseable URLs before mode-specific checks", () => {
    assert.throws(
      () =>
        assertSupabaseTargetSafe({
          supabaseUrl: "https://custom.example.com",
          mode: "perimeter",
          ci: true,
        }),
      (error: unknown) =>
        error instanceof Error && error.message.includes("Could not parse Supabase project ref"),
    );
  });
});

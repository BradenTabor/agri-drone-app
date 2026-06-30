import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildSupabaseHealthUrl } from "./e2e-supabase-reachability";

describe("buildSupabaseHealthUrl", () => {
  it("appends the GoTrue health path to a hosted Supabase URL", () => {
    assert.equal(
      buildSupabaseHealthUrl("https://wxftkrdwvzpggjrdntdf.supabase.co"),
      "https://wxftkrdwvzpggjrdntdf.supabase.co/auth/v1/health",
    );
  });

  it("trims surrounding whitespace before building the URL", () => {
    assert.equal(
      buildSupabaseHealthUrl("  https://wxftkrdwvzpggjrdntdf.supabase.co  "),
      "https://wxftkrdwvzpggjrdntdf.supabase.co/auth/v1/health",
    );
  });

  it("does not double up the slash when the URL has a trailing slash", () => {
    assert.equal(
      buildSupabaseHealthUrl("https://wxftkrdwvzpggjrdntdf.supabase.co/"),
      "https://wxftkrdwvzpggjrdntdf.supabase.co/auth/v1/health",
    );
  });

  it("collapses multiple trailing slashes", () => {
    assert.equal(
      buildSupabaseHealthUrl("https://wxftkrdwvzpggjrdntdf.supabase.co///"),
      "https://wxftkrdwvzpggjrdntdf.supabase.co/auth/v1/health",
    );
  });
});

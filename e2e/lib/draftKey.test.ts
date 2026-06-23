import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildFormDraftKey,
  parseFormDraftKey,
} from "@/lib/formDrafts/types";

const USER_UUID = "550e8400-e29b-41d4-a716-446655440000";

describe("buildFormDraftKey / parseFormDraftKey", () => {
  it("round-trips mix-record keys", () => {
    const key = buildFormDraftKey("mix-record", USER_UUID);
    assert.deepEqual(parseFormDraftKey(key), {
      formType: "mix-record",
      userId: USER_UUID,
    });
  });

  it("round-trips app-record keys", () => {
    const key = buildFormDraftKey("app-record", USER_UUID);
    assert.deepEqual(parseFormDraftKey(key), {
      formType: "app-record",
      userId: USER_UUID,
    });
  });

  it("returns null for a key with no colon", () => {
    assert.equal(parseFormDraftKey("mix-record"), null);
  });

  it('returns null for unknown formType "foo:uid"', () => {
    assert.equal(parseFormDraftKey("foo:uid"), null);
  });

  it('returns null for empty userId "mix-record:"', () => {
    assert.equal(parseFormDraftKey("mix-record:"), null);
  });

  it("round-trips a UUID userId exactly", () => {
    const key = buildFormDraftKey("mix-record", USER_UUID);
    const parsed = parseFormDraftKey(key);
    assert.ok(parsed);
    assert.equal(parsed.userId, USER_UUID);
  });
});

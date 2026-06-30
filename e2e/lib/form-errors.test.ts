import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  firstFieldErrorKey,
  listFieldErrorMessages,
  mixRecordFieldTargetSelector,
} from "@/lib/form-errors";

describe("listFieldErrorMessages", () => {
  it("returns an empty array when there are no errors", () => {
    assert.deepEqual(listFieldErrorMessages(undefined), []);
  });

  it("flattens and de-duplicates messages across fields", () => {
    assert.deepEqual(
      listFieldErrorMessages({
        name: ["Required.", "Too short."],
        email: ["Too short."],
        notes: undefined,
      }),
      ["Required.", "Too short."],
    );
  });
});

describe("firstFieldErrorKey", () => {
  it("returns null when there are no errors", () => {
    assert.equal(firstFieldErrorKey(undefined), null);
  });

  it("returns the first field that has messages", () => {
    assert.equal(
      firstFieldErrorKey({ name: undefined, email: ["Invalid."] }),
      "email",
    );
  });

  it("ignores fields with empty message arrays", () => {
    assert.equal(firstFieldErrorKey({ name: [] }), null);
  });
});

describe("mixRecordFieldTargetSelector", () => {
  it("maps known fields to their DOM selectors", () => {
    assert.equal(mixRecordFieldTargetSelector("customerId"), "#customerId");
    assert.equal(
      mixRecordFieldTargetSelector("productLines"),
      '[data-form-section="products"]',
    );
  });

  it("falls back to a name attribute selector for unknown fields", () => {
    assert.equal(
      mixRecordFieldTargetSelector("mysteryField"),
      '[name="mysteryField"]',
    );
  });
});

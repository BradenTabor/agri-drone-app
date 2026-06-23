import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ZodError } from "zod";

import { appRecordCreateSchema } from "@/lib/validation/schemas";

const MIX_RECORD_ID = "550e8400-e29b-41d4-a716-446655440002";

function validAppPayload() {
  return {
    jobDate: "2024-06-01",
    applicatorName: "Jane Applicator",
    customerName: "Acme Farms",
    targetVegetation: ["broadleaf" as const],
    appMethod: "drone" as const,
    appType: "spraying" as const,
    certAttested: true,
    applicatorSig: "Jane Applicator",
    pesticides: [{ productName: "Roundup" }],
  };
}

function issueAt(error: ZodError, path: PropertyKey[]) {
  return error.issues.find(
    (issue) =>
      issue.path.length === path.length &&
      issue.path.every((segment, index) => segment === path[index]),
  );
}

describe("appRecordCreateSchema", () => {
  it("accepts a valid full payload", () => {
    const result = appRecordCreateSchema.safeParse(validAppPayload());
    assert.equal(result.success, true);
  });

  it("rejects targetVegetation: []", () => {
    const result = appRecordCreateSchema.safeParse({
      ...validAppPayload(),
      targetVegetation: [],
    });
    assert.equal(result.success, false);
    if (result.success) return;
    assert.ok(
      result.error.issues.some((issue) => issue.message === "Select at least one target vegetation type."),
    );
  });

  it("rejects appMethod set with appType empty on path appType", () => {
    const result = appRecordCreateSchema.safeParse({
      ...validAppPayload(),
      appMethod: "drone",
      appType: "",
    });
    assert.equal(result.success, false);
    if (result.success) return;
    const issue = issueAt(result.error, ["appType"]);
    assert.ok(issue);
    assert.equal(issue.message, "Select spraying or spreading.");
  });

  it("rejects appType set with appMethod empty on path appMethod", () => {
    const result = appRecordCreateSchema.safeParse({
      ...validAppPayload(),
      appMethod: "",
      appType: "spraying",
    });
    assert.equal(result.success, false);
    if (result.success) return;
    const issue = issueAt(result.error, ["appMethod"]);
    assert.ok(issue);
    assert.equal(issue.message, "Select an application method.");
  });

  it("rejects certAttested false on path certAttested", () => {
    const result = appRecordCreateSchema.safeParse({
      ...validAppPayload(),
      certAttested: false,
    });
    assert.equal(result.success, false);
    if (result.success) return;
    const issue = issueAt(result.error, ["certAttested"]);
    assert.ok(issue);
    assert.equal(issue.message, "Attestation is required before submitting.");
  });

  it("defaults mixRecordIds to [] when absent", () => {
    const result = appRecordCreateSchema.safeParse(validAppPayload());
    assert.equal(result.success, true);
    if (!result.success) return;
    assert.deepEqual(result.data.mixRecordIds, []);
  });

  it('rejects mixRecordIds ["nope"]', () => {
    const result = appRecordCreateSchema.safeParse({
      ...validAppPayload(),
      mixRecordIds: ["nope"],
    });
    assert.equal(result.success, false);
    if (result.success) return;
    const issue = issueAt(result.error, ["mixRecordIds", 0]);
    assert.ok(issue);
    assert.equal(issue.message, "Invalid UUID");
  });

  it("rejects pesticides: []", () => {
    const result = appRecordCreateSchema.safeParse({
      ...validAppPayload(),
      pesticides: [],
    });
    assert.equal(result.success, false);
    if (result.success) return;
    assert.ok(
      result.error.issues.some((issue) => issue.message === "Add at least one product."),
    );
  });

  it('allows endTime ""', () => {
    const result = appRecordCreateSchema.safeParse({
      ...validAppPayload(),
      endTime: "",
    });
    assert.equal(result.success, true);
    if (!result.success) return;
    assert.equal(result.data.endTime, "");
  });

  it('rejects endTime "9am"', () => {
    const result = appRecordCreateSchema.safeParse({
      ...validAppPayload(),
      endTime: "9am",
    });
    assert.equal(result.success, false);
    if (result.success) return;
    assert.ok(
      result.error.issues.some((issue) => issue.message === "Time must be HH:MM."),
    );
  });

  it("accepts valid mixRecordIds", () => {
    const result = appRecordCreateSchema.safeParse({
      ...validAppPayload(),
      mixRecordIds: [MIX_RECORD_ID],
    });
    assert.equal(result.success, true);
    if (!result.success) return;
    assert.deepEqual(result.data.mixRecordIds, [MIX_RECORD_ID]);
  });
});

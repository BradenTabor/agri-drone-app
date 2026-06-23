import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ZodError } from "zod";

import {
  mixRecordCreateSchema,
  mixRecordProductLineSchema,
} from "@/lib/validation/schemas";

const CUSTOMER_ID = "550e8400-e29b-41d4-a716-446655440000";
const FIELD_ID = "550e8400-e29b-41d4-a716-446655440001";

function validMixPayload() {
  return {
    recordDate: "2024-06-01",
    timeMixed: "10:30",
    customerId: CUSTOMER_ID,
    fieldId: FIELD_ID,
    mixLat: 30.5,
    mixLng: -97.5,
    tankSizeGal: 1000,
    targetGpa: 15,
    waterGal: 900,
    totalMixGal: 1000,
    expectedAcres: 66.67,
    windSpeedMph: 5,
    windDirection: "N" as const,
    signedTypedName: "John Doe",
    signatureAttested: true,
    productLines: [
      {
        amountAdded: 100,
        amountUnit: "gal" as const,
        sortOrder: 0,
      },
    ],
  };
}

function issueAt(error: ZodError, path: PropertyKey[]) {
  return error.issues.find(
    (issue) =>
      issue.path.length === path.length &&
      issue.path.every((segment, index) => segment === path[index]),
  );
}

describe("mixRecordCreateSchema", () => {
  it("accepts a valid full payload", () => {
    const result = mixRecordCreateSchema.safeParse(validMixPayload());
    assert.equal(result.success, true);
  });

  it('rejects productLines: [] with "Add at least one product line."', () => {
    const result = mixRecordCreateSchema.safeParse({
      ...validMixPayload(),
      productLines: [],
    });
    assert.equal(result.success, false);
    if (result.success) return;
    assert.ok(
      result.error.issues.some((issue) => issue.message === "Add at least one product line."),
    );
  });

  it("rejects product line with ratePerAcre set but rateUnit empty on path rateUnit", () => {
    const result = mixRecordProductLineSchema.safeParse({
      amountAdded: 10,
      amountUnit: "gal",
      ratePerAcre: 5,
      rateUnit: "",
      sortOrder: 0,
    });
    assert.equal(result.success, false);
    if (result.success) return;
    const issue = issueAt(result.error, ["rateUnit"]);
    assert.ok(issue);
    assert.equal(issue.message, "Rate unit is required when rate per acre is set.");
  });

  it('rejects product line amountUnit "kg"', () => {
    const result = mixRecordProductLineSchema.safeParse({
      amountAdded: 10,
      amountUnit: "kg",
      sortOrder: 0,
    });
    assert.equal(result.success, false);
    if (result.success) return;
    assert.ok(
      result.error.issues.some((issue) =>
        issue.message.includes("Amount unit must be gal, oz, fl_oz, or lb."),
      ),
    );
  });

  it('parses surfactantUnit "" as undefined', () => {
    const result = mixRecordCreateSchema.safeParse({
      ...validMixPayload(),
      surfactantUnit: "",
    });
    assert.equal(result.success, true);
    if (!result.success) return;
    assert.equal(result.data.surfactantUnit, undefined);
  });

  it('rejects surfactantUnit "ml"', () => {
    const result = mixRecordCreateSchema.safeParse({
      ...validMixPayload(),
      surfactantUnit: "ml",
    });
    assert.equal(result.success, false);
    if (result.success) return;
    assert.ok(
      result.error.issues.some((issue) =>
        issue.message.includes("Surfactant unit must be oz, fl_oz, gal, or %."),
      ),
    );
  });

  it("rejects signatureAttested false on path signatureAttested", () => {
    const result = mixRecordCreateSchema.safeParse({
      ...validMixPayload(),
      signatureAttested: false,
    });
    assert.equal(result.success, false);
    if (result.success) return;
    const issue = issueAt(result.error, ["signatureAttested"]);
    assert.ok(issue);
    assert.equal(issue.message, "Attestation is required before submitting.");
  });

  it('rejects customerId "not-a-uuid"', () => {
    const result = mixRecordCreateSchema.safeParse({
      ...validMixPayload(),
      customerId: "not-a-uuid",
    });
    assert.equal(result.success, false);
    if (result.success) return;
    assert.ok(
      result.error.issues.some((issue) => issue.message === "Customer is required."),
    );
  });

  it('rejects tankSizeGal "abc" with must be a number', () => {
    const result = mixRecordCreateSchema.safeParse({
      ...validMixPayload(),
      tankSizeGal: "abc",
    });
    assert.equal(result.success, false);
    if (result.success) return;
    assert.ok(
      result.error.issues.some((issue) => issue.message === "Tank size must be a number."),
    );
  });

  it('rejects targetGpa "0" with at least 0.01', () => {
    const result = mixRecordCreateSchema.safeParse({
      ...validMixPayload(),
      targetGpa: "0",
    });
    assert.equal(result.success, false);
    if (result.success) return;
    assert.ok(
      result.error.issues.some((issue) => issue.message === "Target GPA must be at least 0.01."),
    );
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ZodError } from "zod";

import { quoteCreateSchema } from "@/lib/validation/schemas";

function validQuotePayload() {
  return {
    customerName: "Acme Farms",
    quoteDate: "2026-06-30",
    lineItems: [
      { description: "Aerial application", quantity: 1, unitPrice: 100, amount: 100 },
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

describe("quoteCreateSchema adjuvant price + mileage", () => {
  it("accepts and coerces string adjuvantPrice and mileage (as posted by the form)", () => {
    const result = quoteCreateSchema.safeParse({
      ...validQuotePayload(),
      adjuvantPrice: "125.5",
      mileage: "42",
    });
    assert.equal(result.success, true);
    if (!result.success) return;
    assert.equal(result.data.adjuvantPrice, 125.5);
    assert.equal(result.data.mileage, 42);
  });

  it("treats empty strings as undefined (optional fields left blank)", () => {
    const result = quoteCreateSchema.safeParse({
      ...validQuotePayload(),
      adjuvantPrice: "",
      mileage: "",
    });
    assert.equal(result.success, true);
    if (!result.success) return;
    assert.equal(result.data.adjuvantPrice, undefined);
    assert.equal(result.data.mileage, undefined);
  });

  it("allows the fields to be omitted entirely", () => {
    const result = quoteCreateSchema.safeParse(validQuotePayload());
    assert.equal(result.success, true);
    if (!result.success) return;
    assert.equal(result.data.adjuvantPrice, undefined);
    assert.equal(result.data.mileage, undefined);
  });

  it("rejects a negative adjuvantPrice on path adjuvantPrice", () => {
    const result = quoteCreateSchema.safeParse({
      ...validQuotePayload(),
      adjuvantPrice: "-5",
    });
    assert.equal(result.success, false);
    if (result.success) return;
    const issue = issueAt(result.error, ["adjuvantPrice"]);
    assert.ok(issue);
    assert.equal(issue.message, "Adjuvant price must be at least 0.");
  });

  it("rejects a non-numeric mileage on path mileage", () => {
    const result = quoteCreateSchema.safeParse({
      ...validQuotePayload(),
      mileage: "lots",
    });
    assert.equal(result.success, false);
    if (result.success) return;
    const issue = issueAt(result.error, ["mileage"]);
    assert.ok(issue);
    assert.equal(issue.message, "Mileage must be a number.");
  });
});

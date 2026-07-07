import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ZodError } from "zod";

import { pricingConfigSchema, quoteCreateSchema } from "@/lib/validation/schemas";

function issueAt(error: ZodError, path: PropertyKey[]) {
  return error.issues.find(
    (issue) =>
      issue.path.length === path.length &&
      issue.path.every((segment, index) => segment === path[index]),
  );
}

function validQuotePayload() {
  return {
    customerName: "Austin Farms",
    quoteDate: "2026-07-07",
    validUntil: "",
    acres: "42.5",
    taxRate: "8.25",
    otherAmount: "15.5",
    lineItems: [
      {
        description: "Aerial application",
        quantity: "42.5",
        unitPrice: "18",
        amount: "765",
      },
    ],
  };
}

describe("pricingConfigSchema", () => {
  it("coerces decimal strings, defaults specialRates, and strips empty optional text", () => {
    const result = pricingConfigSchema.safeParse({
      aerialRatePerAcre: "18.50",
      minimumJobFee: "",
      travelFeePerMile: "2.75",
      setupFee: "125",
      productMarkupPct: "12.5",
      markupCap: "50",
      paymentTerms: "  ",
    });

    assert.equal(result.success, true);
    if (!result.success) return;
    assert.deepEqual(result.data, {
      aerialRatePerAcre: 18.5,
      minimumJobFee: undefined,
      travelFeePerMile: 2.75,
      setupFee: 125,
      productMarkupPct: 12.5,
      markupCap: 50,
      paymentTerms: undefined,
      specialRates: [],
    });
  });

  it("rejects out-of-range product markup and invalid special rate units", () => {
    const result = pricingConfigSchema.safeParse({
      productMarkupPct: "101",
      specialRates: [{ name: "Hotshot", rate: 10, unit: "daily" }],
    });

    assert.equal(result.success, false);
    if (result.success) return;
    assert.ok(issueAt(result.error, ["productMarkupPct"]));
    assert.ok(issueAt(result.error, ["specialRates", 0, "unit"]));
  });
});

describe("quoteCreateSchema", () => {
  it("defaults quote status and line item kind/basis while coercing numeric fields", () => {
    const result = quoteCreateSchema.safeParse(validQuotePayload());

    assert.equal(result.success, true);
    if (!result.success) return;
    assert.equal(result.data.status, "draft");
    assert.equal(result.data.validUntil, undefined);
    assert.equal(result.data.acres, 42.5);
    assert.equal(result.data.taxRate, 8.25);
    assert.equal(result.data.otherAmount, 15.5);
    assert.deepEqual(result.data.lineItems[0], {
      kind: "custom",
      description: "Aerial application",
      basis: "flat",
      quantity: 42.5,
      unitPrice: 18,
      amount: 765,
    });
  });

  it("rejects empty line items, invalid dates, and tax rates above 100", () => {
    const result = quoteCreateSchema.safeParse({
      ...validQuotePayload(),
      quoteDate: "07/07/2026",
      taxRate: "101",
      lineItems: [],
    });

    assert.equal(result.success, false);
    if (result.success) return;
    assert.ok(result.error.issues.some((issue) => issue.message === "Date must be YYYY-MM-DD."));
    assert.ok(result.error.issues.some((issue) => issue.message === "Add at least one line item."));
    assert.ok(issueAt(result.error, ["taxRate"]));
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  customerCreateSchema,
  equipmentCreateSchema,
  pricingConfigSchema,
  productCreateSchema,
  quoteCreateSchema,
  surfactantCreateSchema,
} from "@/lib/validation/schemas";

const CUSTOMER_ID = "550e8400-e29b-41d4-a716-446655440000";

describe("customerCreateSchema", () => {
  it("requires a non-empty name", () => {
    const result = customerCreateSchema.safeParse({ name: "" });
    assert.equal(result.success, false);
    if (result.success) return;
    assert.ok(result.error.issues.some((i) => i.message === "Customer name is required."));
  });

  it("coerces empty optional text to undefined", () => {
    const result = customerCreateSchema.safeParse({ name: "Acme Farms", phone: "" });
    assert.equal(result.success, true);
    if (!result.success) return;
    assert.equal(result.data.phone, undefined);
  });

  it("rejects an invalid email", () => {
    const result = customerCreateSchema.safeParse({ name: "Acme", email: "not-an-email" });
    assert.equal(result.success, false);
    if (result.success) return;
    assert.ok(result.error.issues.some((i) => i.message === "Enter a valid email address."));
  });
});

describe("equipmentCreateSchema", () => {
  it("requires an identifier", () => {
    const result = equipmentCreateSchema.safeParse({ identifier: "" });
    assert.equal(result.success, false);
  });

  it("defaults active to true", () => {
    const result = equipmentCreateSchema.safeParse({ identifier: "DRONE-1" });
    assert.equal(result.success, true);
    if (!result.success) return;
    assert.equal(result.data.active, true);
  });

  it('parses the string "false" into a boolean false', () => {
    const result = equipmentCreateSchema.safeParse({ identifier: "DRONE-1", active: "false" });
    assert.equal(result.success, true);
    if (!result.success) return;
    assert.equal(result.data.active, false);
  });
});

describe("productCreateSchema", () => {
  it("defaults ingredients to an empty array and restrictedUse to false", () => {
    const result = productCreateSchema.safeParse({ name: "Roundup" });
    assert.equal(result.success, true);
    if (!result.success) return;
    assert.deepEqual(result.data.ingredients, []);
    assert.equal(result.data.restrictedUse, false);
  });

  it("rejects an invalid cost unit", () => {
    const result = productCreateSchema.safeParse({ name: "Roundup", costUnit: "kg" });
    assert.equal(result.success, false);
    if (result.success) return;
    assert.ok(
      result.error.issues.some((i) => i.message.includes("Cost unit must be gal, oz, fl_oz, or lb.")),
    );
  });
});

describe("surfactantCreateSchema", () => {
  it("rejects an invalid default unit", () => {
    const result = surfactantCreateSchema.safeParse({ name: "NIS", defaultUnit: "ml" });
    assert.equal(result.success, false);
    if (result.success) return;
    assert.ok(
      result.error.issues.some((i) =>
        i.message.includes("Default unit must be oz, fl_oz, gal, or %."),
      ),
    );
  });
});

describe("pricingConfigSchema", () => {
  it("accepts an empty config and defaults specialRates to an empty array", () => {
    const result = pricingConfigSchema.safeParse({});
    assert.equal(result.success, true);
    if (!result.success) return;
    assert.deepEqual(result.data.specialRates, []);
  });

  it("rejects a product markup above 100 percent", () => {
    const result = pricingConfigSchema.safeParse({ productMarkupPct: 150 });
    assert.equal(result.success, false);
    if (result.success) return;
    assert.ok(
      result.error.issues.some((i) => i.message === "Product markup must be no more than 100."),
    );
  });
});

function validQuotePayload() {
  return {
    customerName: "Acme Farms",
    quoteDate: "2026-06-29",
    lineItems: [
      {
        description: "Aerial application",
        quantity: 100,
        unitPrice: 10,
        amount: 1000,
      },
    ],
  };
}

describe("quoteCreateSchema", () => {
  it("accepts a minimal valid payload and applies defaults", () => {
    const result = quoteCreateSchema.safeParse(validQuotePayload());
    assert.equal(result.success, true);
    if (!result.success) return;
    assert.equal(result.data.status, "draft");
    assert.equal(result.data.taxRate, 0);
    assert.equal(result.data.otherAmount, 0);
    assert.equal(result.data.lineItems[0].kind, "custom");
    assert.equal(result.data.lineItems[0].basis, "flat");
  });

  it("requires at least one line item", () => {
    const result = quoteCreateSchema.safeParse({ ...validQuotePayload(), lineItems: [] });
    assert.equal(result.success, false);
    if (result.success) return;
    assert.ok(result.error.issues.some((i) => i.message === "Add at least one line item."));
  });

  it("requires a customer name", () => {
    const result = quoteCreateSchema.safeParse({ ...validQuotePayload(), customerName: "" });
    assert.equal(result.success, false);
    if (result.success) return;
    assert.ok(result.error.issues.some((i) => i.message === "Customer name is required."));
  });

  it("rejects a malformed quote date", () => {
    const result = quoteCreateSchema.safeParse({ ...validQuotePayload(), quoteDate: "06/29/2026" });
    assert.equal(result.success, false);
    if (result.success) return;
    assert.ok(result.error.issues.some((i) => i.message === "Date must be YYYY-MM-DD."));
  });

  it("coerces a string tax rate into a number", () => {
    const result = quoteCreateSchema.safeParse({ ...validQuotePayload(), taxRate: "8.25" });
    assert.equal(result.success, true);
    if (!result.success) return;
    assert.equal(result.data.taxRate, 8.25);
  });

  it("rejects a line item with an empty description", () => {
    const result = quoteCreateSchema.safeParse({
      ...validQuotePayload(),
      lineItems: [{ description: "", quantity: 1, unitPrice: 1, amount: 1 }],
    });
    assert.equal(result.success, false);
    if (result.success) return;
    assert.ok(result.error.issues.some((i) => i.message === "Line description is required."));
  });

  it("accepts an optional customer id", () => {
    const result = quoteCreateSchema.safeParse({ ...validQuotePayload(), customerId: CUSTOMER_ID });
    assert.equal(result.success, true);
    if (!result.success) return;
    assert.equal(result.data.customerId, CUSTOMER_ID);
  });
});

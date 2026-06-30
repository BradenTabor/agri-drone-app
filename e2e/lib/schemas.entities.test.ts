import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  customerCreateSchema,
  equipmentCreateSchema,
  fieldCreateSchema,
  pricingConfigSchema,
  productCreateSchema,
  quoteCreateSchema,
  surfactantCreateSchema,
} from "@/lib/validation/schemas";

function hasMessage(
  result: { success: boolean; error?: { issues: { message: string }[] } },
  message: string,
): boolean {
  if (result.success || !result.error) {
    return false;
  }
  return result.error.issues.some((issue) => issue.message === message);
}

describe("customerCreateSchema", () => {
  it("accepts a minimal valid customer", () => {
    assert.equal(customerCreateSchema.safeParse({ name: "Acme Farms" }).success, true);
  });

  it("requires a name", () => {
    const result = customerCreateSchema.safeParse({ name: "" });
    assert.ok(hasMessage(result, "Customer name is required."));
  });

  it("rejects an invalid email", () => {
    const result = customerCreateSchema.safeParse({ name: "Acme", email: "nope" });
    assert.ok(hasMessage(result, "Enter a valid email address."));
  });

  it("coerces an empty optional email to undefined", () => {
    const result = customerCreateSchema.safeParse({ name: "Acme", email: "" });
    assert.equal(result.success, true);
    if (!result.success) return;
    assert.equal(result.data.email, undefined);
  });
});

describe("fieldCreateSchema", () => {
  it("rejects latitude greater than 90", () => {
    const result = fieldCreateSchema.safeParse({ name: "F", defaultLat: 91 });
    assert.ok(hasMessage(result, "Latitude must be no more than 90."));
  });

  it("rejects negative acres", () => {
    const result = fieldCreateSchema.safeParse({ name: "F", acres: -1 });
    assert.ok(hasMessage(result, "Acres must be at least 0."));
  });
});

describe("equipmentCreateSchema", () => {
  it("requires an identifier and defaults active to true", () => {
    const result = equipmentCreateSchema.safeParse({ identifier: "Drone-1" });
    assert.equal(result.success, true);
    if (!result.success) return;
    assert.equal(result.data.active, true);
  });

  it("parses an explicit active=false checkbox value", () => {
    const result = equipmentCreateSchema.safeParse({ identifier: "Drone-1", active: "false" });
    assert.equal(result.success, true);
    if (!result.success) return;
    assert.equal(result.data.active, false);
  });
});

describe("productCreateSchema", () => {
  it("defaults ingredients/restrictedUse and accepts a valid product", () => {
    const result = productCreateSchema.safeParse({ name: "Glyphosate" });
    assert.equal(result.success, true);
    if (!result.success) return;
    assert.deepEqual(result.data.ingredients, []);
    assert.equal(result.data.restrictedUse, false);
  });

  it("rejects an invalid cost unit", () => {
    const result = productCreateSchema.safeParse({ name: "X", costUnit: "kg" });
    assert.ok(hasMessage(result, "Cost unit must be gal, oz, fl_oz, or lb."));
  });
});

describe("surfactantCreateSchema", () => {
  it("rejects an invalid default unit", () => {
    const result = surfactantCreateSchema.safeParse({ name: "NIS", defaultUnit: "ml" });
    assert.ok(hasMessage(result, "Default unit must be oz, fl_oz, gal, or %."));
  });
});

describe("pricingConfigSchema", () => {
  it("defaults special rates to an empty array", () => {
    const result = pricingConfigSchema.safeParse({});
    assert.equal(result.success, true);
    if (!result.success) return;
    assert.deepEqual(result.data.specialRates, []);
  });

  it("rejects a product markup over 100 percent", () => {
    const result = pricingConfigSchema.safeParse({ productMarkupPct: 150 });
    assert.ok(hasMessage(result, "Product markup must be no more than 100."));
  });
});

describe("quoteCreateSchema", () => {
  function validQuote() {
    return {
      customerName: "Acme Farms",
      quoteDate: "2024-06-01",
      lineItems: [
        { description: "Aerial application", quantity: 10, unitPrice: 12, amount: 120 },
      ],
    };
  }

  it("accepts a valid quote and applies defaults", () => {
    const result = quoteCreateSchema.safeParse(validQuote());
    assert.equal(result.success, true);
    if (!result.success) return;
    assert.equal(result.data.status, "draft");
    assert.equal(result.data.taxRate, 0);
    assert.equal(result.data.lineItems[0]?.basis, "flat");
  });

  it("requires at least one line item", () => {
    const result = quoteCreateSchema.safeParse({ ...validQuote(), lineItems: [] });
    assert.ok(hasMessage(result, "Add at least one line item."));
  });

  it("requires a customer name", () => {
    const result = quoteCreateSchema.safeParse({ ...validQuote(), customerName: "" });
    assert.ok(hasMessage(result, "Customer name is required."));
  });

  it("rejects a malformed quote date", () => {
    const result = quoteCreateSchema.safeParse({ ...validQuote(), quoteDate: "06/01/2024" });
    assert.ok(hasMessage(result, "Date must be YYYY-MM-DD."));
  });
});

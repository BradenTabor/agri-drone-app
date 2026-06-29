import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  applyMarkup,
  computeTotals,
  lineAmount,
  seedAerialLine,
  seedFeeLines,
  seedProductLine,
  type PricingConfigForSeed,
  type ProductForSeed,
} from "@/lib/quotes/calculations";

function config(overrides: Partial<PricingConfigForSeed> = {}): PricingConfigForSeed {
  return {
    aerial_rate_per_acre: null,
    minimum_job_fee: null,
    travel_fee_per_mile: null,
    setup_fee: null,
    product_markup_pct: null,
    markup_cap: null,
    special_rates: null,
    ...overrides,
  };
}

describe("applyMarkup", () => {
  it("adds the markup percentage to the base cost", () => {
    assert.equal(applyMarkup(100, 20, null), 120);
  });

  it("treats a null markup percentage as zero", () => {
    assert.equal(applyMarkup(100, null, null), 100);
  });

  it("caps the markup amount at markupCap", () => {
    // 50% of 100 = 50, but cap is 10 -> 100 + 10
    assert.equal(applyMarkup(100, 50, 10), 110);
  });

  it("does not cap when the markup is below the cap", () => {
    assert.equal(applyMarkup(100, 50, 100), 150);
  });

  it("rounds the result to two decimal places", () => {
    // 10 + (10 * 33.33%) = 13.333 -> 13.33
    assert.equal(applyMarkup(10, 33.33, null), 13.33);
  });
});

describe("seedAerialLine", () => {
  it("returns null when no aerial rate is configured", () => {
    assert.equal(seedAerialLine(config(), 100), null);
  });

  it("returns null when acres is null or non-positive", () => {
    assert.equal(seedAerialLine(config({ aerial_rate_per_acre: 10 }), null), null);
    assert.equal(seedAerialLine(config({ aerial_rate_per_acre: 10 }), 0), null);
    assert.equal(seedAerialLine(config({ aerial_rate_per_acre: 10 }), -5), null);
  });

  it("builds a per-acre aerial line with rounded amount", () => {
    const line = seedAerialLine(config({ aerial_rate_per_acre: 10 }), 66.67);
    assert.deepEqual(line, {
      kind: "aerial",
      productId: null,
      description: "Aerial application",
      basis: "per_acre",
      quantity: 66.67,
      unitPrice: 10,
      amount: 666.7,
    });
  });
});

describe("seedProductLine", () => {
  const product: ProductForSeed = {
    id: "prod-1",
    name: "Roundup",
    unit_cost: 50,
    cost_unit: "gal",
  };

  it("builds a per-acre line with marked-up unit price when acres is positive", () => {
    const line = seedProductLine(product, config({ product_markup_pct: 10 }), 100);
    assert.equal(line.kind, "product");
    assert.equal(line.productId, "prod-1");
    assert.equal(line.basis, "per_acre");
    assert.equal(line.quantity, 100);
    assert.equal(line.unitPrice, 55); // 50 + 10%
    assert.equal(line.amount, 5500);
    assert.equal(line.description, "Roundup (gal)");
  });

  it("falls back to a flat line of quantity 1 when acres is missing", () => {
    const line = seedProductLine(product, config({ product_markup_pct: 10 }), null);
    assert.equal(line.basis, "flat");
    assert.equal(line.quantity, 1);
    assert.equal(line.amount, 55);
  });

  it("omits the unit label when the product has no cost unit", () => {
    const line = seedProductLine(
      { ...product, cost_unit: null },
      config({ product_markup_pct: 10 }),
      100,
    );
    assert.equal(line.description, "Roundup");
  });

  it("treats a null unit cost as zero", () => {
    const line = seedProductLine(
      { ...product, unit_cost: null },
      config({ product_markup_pct: 10 }),
      100,
    );
    assert.equal(line.unitPrice, 0);
    assert.equal(line.amount, 0);
  });
});

describe("seedFeeLines", () => {
  it("returns an empty array when no setup fee is configured", () => {
    assert.deepEqual(seedFeeLines(config()), []);
  });

  it("returns an empty array when the setup fee is zero", () => {
    assert.deepEqual(seedFeeLines(config({ setup_fee: 0 })), []);
  });

  it("adds a flat setup fee line when configured", () => {
    const lines = seedFeeLines(config({ setup_fee: 75 }));
    assert.equal(lines.length, 1);
    assert.deepEqual(lines[0], {
      kind: "fee",
      productId: null,
      description: "Setup / mobilization fee",
      basis: "flat",
      quantity: 1,
      unitPrice: 75,
      amount: 75,
    });
  });
});

describe("computeTotals", () => {
  it("sums line item amounts and applies tax and other amounts", () => {
    const totals = computeTotals([{ amount: 100 }, { amount: 50 }], 10, 25);
    assert.deepEqual(totals, { subtotal: 150, tax: 15, total: 190 });
  });

  it("defaults tax rate and other amount to zero", () => {
    const totals = computeTotals([{ amount: 100 }, { amount: 50 }]);
    assert.deepEqual(totals, { subtotal: 150, tax: 0, total: 150 });
  });

  it("ignores non-numeric line amounts", () => {
    const totals = computeTotals([
      { amount: 100 },
      { amount: Number.NaN },
    ]);
    assert.equal(totals.subtotal, 100);
  });

  it("rounds tax to two decimals", () => {
    // 8.25% of 99.99 = 8.249175 -> 8.25
    const totals = computeTotals([{ amount: 99.99 }], 8.25);
    assert.equal(totals.tax, 8.25);
  });
});

describe("lineAmount", () => {
  it("multiplies quantity by unit price and rounds", () => {
    assert.equal(lineAmount(3, 9.99), 29.97);
  });

  it("treats non-numeric inputs as zero", () => {
    assert.equal(lineAmount(Number.NaN, 5), 0);
  });
});

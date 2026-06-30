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

function baseConfig(
  overrides: Partial<PricingConfigForSeed> = {},
): PricingConfigForSeed {
  return {
    aerial_rate_per_acre: 12,
    minimum_job_fee: null,
    travel_fee_per_mile: null,
    setup_fee: null,
    product_markup_pct: 20,
    markup_cap: null,
    special_rates: null,
    ...overrides,
  };
}

describe("applyMarkup", () => {
  it("adds the markup percentage to the base cost", () => {
    assert.equal(applyMarkup(100, 20, null), 120);
  });

  it("returns the base cost when markup percent is null", () => {
    assert.equal(applyMarkup(100, null, null), 100);
  });

  it("caps the markup amount at markup_cap", () => {
    // 50% of 100 = 50, capped at 10 -> 110.
    assert.equal(applyMarkup(100, 50, 10), 110);
  });

  it("rounds to two decimals", () => {
    assert.equal(applyMarkup(33.33, 10, null), 36.66);
  });
});

describe("seedAerialLine", () => {
  it("creates a per-acre aerial line scaled by acres", () => {
    const line = seedAerialLine(baseConfig(), 10);
    assert.ok(line);
    assert.equal(line.kind, "aerial");
    assert.equal(line.basis, "per_acre");
    assert.equal(line.unitPrice, 12);
    assert.equal(line.quantity, 10);
    assert.equal(line.amount, 120);
  });

  it("returns null when aerial rate is missing", () => {
    assert.equal(seedAerialLine(baseConfig({ aerial_rate_per_acre: null }), 10), null);
  });

  it("returns null when acres is null or non-positive", () => {
    assert.equal(seedAerialLine(baseConfig(), null), null);
    assert.equal(seedAerialLine(baseConfig(), 0), null);
  });
});

describe("seedProductLine", () => {
  const product: ProductForSeed = {
    id: "prod-1",
    name: "Glyphosate",
    unit_cost: 100,
    cost_unit: "gal",
  };

  it("applies markup and scales per acre when acres are present", () => {
    const line = seedProductLine(product, baseConfig(), 5);
    assert.equal(line.kind, "product");
    assert.equal(line.productId, "prod-1");
    assert.equal(line.basis, "per_acre");
    assert.equal(line.unitPrice, 120); // 100 + 20%
    assert.equal(line.quantity, 5);
    assert.equal(line.amount, 600);
    assert.equal(line.description, "Glyphosate (gal)");
  });

  it("falls back to a flat single-unit line when acres are absent", () => {
    const line = seedProductLine(product, baseConfig(), null);
    assert.equal(line.basis, "flat");
    assert.equal(line.quantity, 1);
    assert.equal(line.amount, 120);
  });

  it("treats a missing unit cost as zero", () => {
    const line = seedProductLine(
      { id: "p", name: "Free", unit_cost: null, cost_unit: null },
      baseConfig(),
      2,
    );
    assert.equal(line.unitPrice, 0);
    assert.equal(line.amount, 0);
    assert.equal(line.description, "Free");
  });
});

describe("seedFeeLines", () => {
  it("emits a setup fee line when configured", () => {
    const lines = seedFeeLines(baseConfig({ setup_fee: 75 }));
    assert.equal(lines.length, 1);
    assert.equal(lines[0]?.kind, "fee");
    assert.equal(lines[0]?.amount, 75);
  });

  it("emits no lines when setup fee is null or zero", () => {
    assert.deepEqual(seedFeeLines(baseConfig({ setup_fee: null })), []);
    assert.deepEqual(seedFeeLines(baseConfig({ setup_fee: 0 })), []);
  });
});

describe("computeTotals", () => {
  it("sums line amounts, applies tax rate, and adds other amount", () => {
    const totals = computeTotals([{ amount: 100 }, { amount: 50 }], 8.25, 10);
    assert.equal(totals.subtotal, 150);
    assert.equal(totals.tax, 12.38); // 150 * 8.25%
    assert.equal(totals.total, 172.38);
  });

  it("defaults tax and other amount to zero", () => {
    const totals = computeTotals([{ amount: 100 }, { amount: 25.005 }]);
    assert.equal(totals.subtotal, 125.01);
    assert.equal(totals.tax, 0);
    assert.equal(totals.total, 125.01);
  });

  it("ignores non-numeric amounts", () => {
    const totals = computeTotals(
      [{ amount: Number.NaN }, { amount: 40 }] as Array<{ amount: number }>,
    );
    assert.equal(totals.subtotal, 40);
  });
});

describe("lineAmount", () => {
  it("multiplies quantity by unit price rounded to two decimals", () => {
    assert.equal(lineAmount(3, 9.99), 29.97);
  });

  it("treats invalid inputs as zero", () => {
    assert.equal(lineAmount(Number.NaN, 10), 0);
  });
});

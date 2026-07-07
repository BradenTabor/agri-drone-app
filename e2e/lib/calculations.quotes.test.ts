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
} from "@/lib/quotes/calculations";

const baseConfig: PricingConfigForSeed = {
  aerial_rate_per_acre: 18.456,
  minimum_job_fee: 250,
  travel_fee_per_mile: null,
  setup_fee: 125.555,
  product_markup_pct: 25,
  markup_cap: null,
  special_rates: null,
};

describe("quote pricing calculations", () => {
  it("applies percentage markup and caps the markup amount", () => {
    assert.equal(applyMarkup(100, 25, null), 125);
    assert.equal(applyMarkup(100, 25, 10), 110);
  });

  it("seeds an aerial line from acres and configured rate", () => {
    assert.deepEqual(seedAerialLine(baseConfig, 12.5), {
      kind: "aerial",
      productId: null,
      description: "Aerial application",
      basis: "per_acre",
      quantity: 12.5,
      unitPrice: 18.46,
      amount: 230.75,
    });
  });

  it("does not seed aerial pricing without a positive acreage or rate", () => {
    assert.equal(seedAerialLine(baseConfig, 0), null);
    assert.equal(seedAerialLine({ ...baseConfig, aerial_rate_per_acre: null }, 12), null);
  });

  it("seeds product lines per acre when acreage is known and flat otherwise", () => {
    const product = {
      id: "product-1",
      name: "Foliar Feed",
      unit_cost: 12.345,
      cost_unit: "gal",
    };

    assert.deepEqual(seedProductLine(product, baseConfig, 10), {
      kind: "product",
      productId: "product-1",
      description: "Foliar Feed (gal)",
      basis: "per_acre",
      quantity: 10,
      unitPrice: 15.43,
      amount: 154.3,
    });
    assert.equal(seedProductLine(product, baseConfig, null).basis, "flat");
  });

  it("seeds setup fees and rounds line amounts to cents", () => {
    assert.deepEqual(seedFeeLines(baseConfig), [
      {
        kind: "fee",
        productId: null,
        description: "Setup / mobilization fee",
        basis: "flat",
        quantity: 1,
        unitPrice: 125.56,
        amount: 125.56,
      },
    ]);
    assert.equal(lineAmount(3.333, 19.995), 66.64);
  });

  it("computes subtotal, tax, other amount, and total from quote lines", () => {
    assert.deepEqual(
      computeTotals([{ amount: 100.105 }, { amount: 49.995 }, { amount: Number.NaN }], 8.25, 12.345),
      {
        subtotal: 150.1,
        tax: 12.38,
        total: 174.83,
      },
    );
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  seedSurfactantLine,
  type PricingConfigForSeed,
  type ProductForSeed,
} from "@/lib/quotes/calculations";

const baseConfig: PricingConfigForSeed = {
  aerial_rate_per_acre: null,
  minimum_job_fee: null,
  travel_fee_per_mile: null,
  setup_fee: null,
  product_markup_pct: null,
  markup_cap: null,
  special_rates: null,
};

const surfactant: ProductForSeed = {
  id: "surfactant-1",
  name: "Class Act",
  unit_cost: 20,
  cost_unit: "gal",
};

describe("seedSurfactantLine", () => {
  it("never stores a product_id (surfactants are not in the products table)", () => {
    const line = seedSurfactantLine(surfactant, baseConfig, 100);
    assert.equal(line.productId, null);
    assert.equal(line.kind, "product");
  });

  it("seeds a per-acre line scaled by acres when acres are present", () => {
    const line = seedSurfactantLine(surfactant, baseConfig, 100);
    assert.equal(line.basis, "per_acre");
    assert.equal(line.quantity, 100);
    assert.equal(line.unitPrice, 20);
    assert.equal(line.amount, 2000);
  });

  it("falls back to a flat line of quantity 1 when acres are missing", () => {
    const line = seedSurfactantLine(surfactant, baseConfig, null);
    assert.equal(line.basis, "flat");
    assert.equal(line.quantity, 1);
    assert.equal(line.amount, 20);
  });

  it("applies markup (capped) to the surfactant unit cost", () => {
    const line = seedSurfactantLine(surfactant, { ...baseConfig, product_markup_pct: 50, markup_cap: 5 }, null);
    // 50% of 20 = 10, capped at 5 -> 25
    assert.equal(line.unitPrice, 25);
  });

  it("includes the cost unit in the description", () => {
    const line = seedSurfactantLine(surfactant, baseConfig, null);
    assert.equal(line.description, "Class Act (gal)");
  });
});

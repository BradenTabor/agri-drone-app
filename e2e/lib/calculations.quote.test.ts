import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { computeTotals, surfactantCharge } from "@/lib/quotes/calculations";

describe("surfactantCharge", () => {
  it("returns 0 when no surfactant is selected", () => {
    assert.equal(surfactantCharge(null, 100), 0);
    assert.equal(surfactantCharge(undefined, 100), 0);
  });

  it("returns 0 when the surfactant has no usable unit cost", () => {
    assert.equal(surfactantCharge({ unit_cost: null }, 100), 0);
    assert.equal(surfactantCharge({ unit_cost: 0 }, 100), 0);
    assert.equal(surfactantCharge({ unit_cost: -5 }, 100), 0);
  });

  it("multiplies unit cost by acres when acres are provided", () => {
    assert.equal(surfactantCharge({ unit_cost: 2.5 }, 40), 100);
  });

  it("falls back to a single flat unit when acres are missing or non-positive", () => {
    assert.equal(surfactantCharge({ unit_cost: 12.75 }, null), 12.75);
    assert.equal(surfactantCharge({ unit_cost: 12.75 }, 0), 12.75);
  });

  it("rounds the charge to 2 decimals", () => {
    assert.equal(surfactantCharge({ unit_cost: 1.111 }, 3), 3.33);
  });
});

describe("computeTotals with a surfactant amount", () => {
  it("defaults the surfactant amount to 0 (backward compatible)", () => {
    assert.deepEqual(computeTotals([{ amount: 100 }], 10, 5), {
      subtotal: 100,
      tax: 10,
      total: 115,
    });
  });

  it("folds the surfactant amount into the taxable subtotal", () => {
    assert.deepEqual(computeTotals([{ amount: 100 }], 10, 0, 25), {
      subtotal: 125,
      tax: 12.5,
      total: 137.5,
    });
  });

  it("combines line items, surfactant, tax, and other charges", () => {
    assert.deepEqual(computeTotals([{ amount: 200 }, { amount: 50 }], 8.25, -10, 40), {
      subtotal: 290,
      tax: 23.93,
      total: 303.93,
    });
  });

  it("flows a selected surfactant's per-acre cost into the quote total", () => {
    const amount = surfactantCharge({ unit_cost: 4 }, 30);
    assert.deepEqual(computeTotals([{ amount: 500 }], 0, 0, amount), {
      subtotal: 620,
      tax: 0,
      total: 620,
    });
  });
});

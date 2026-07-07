import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  computeTotals,
  mileageCharge,
  quoteExtraTaxableCharges,
} from "@/lib/quotes/calculations";

describe("mileageCharge", () => {
  it("multiplies miles by the per-mile rate", () => {
    assert.equal(mileageCharge(42, 2.5), 105);
  });

  it("rounds the charge to 2 decimals", () => {
    assert.equal(mileageCharge(10, 2.0349), 20.35);
    assert.equal(mileageCharge(3, 0.3333), 1);
  });

  it("returns 0 when miles or rate is missing", () => {
    assert.equal(mileageCharge(null, 2), 0);
    assert.equal(mileageCharge(10, null), 0);
  });

  it("returns 0 for non-positive miles or rate", () => {
    assert.equal(mileageCharge(0, 2), 0);
    assert.equal(mileageCharge(10, 0), 0);
    assert.equal(mileageCharge(-5, 2), 0);
    assert.equal(mileageCharge(10, -2), 0);
  });
});

describe("quoteExtraTaxableCharges", () => {
  it("emits both the adjuvant price and the mileage charge", () => {
    assert.deepEqual(
      quoteExtraTaxableCharges({ adjuvantPrice: 125.5, mileage: 42, ratePerMile: 2 }),
      [{ amount: 125.5 }, { amount: 84 }],
    );
  });

  it("emits only the adjuvant price when mileage has no usable rate", () => {
    assert.deepEqual(
      quoteExtraTaxableCharges({ adjuvantPrice: 50, mileage: 30, ratePerMile: null }),
      [{ amount: 50 }],
    );
  });

  it("emits only the mileage charge when adjuvant price is blank", () => {
    assert.deepEqual(
      quoteExtraTaxableCharges({ adjuvantPrice: null, mileage: 10, ratePerMile: 2 }),
      [{ amount: 20 }],
    );
  });

  it("skips zero and negative charges so blank inputs add nothing", () => {
    assert.deepEqual(
      quoteExtraTaxableCharges({ adjuvantPrice: 0, mileage: 0, ratePerMile: 2 }),
      [],
    );
    assert.deepEqual(
      quoteExtraTaxableCharges({ adjuvantPrice: -5, mileage: 10, ratePerMile: null }),
      [],
    );
  });
});

describe("computeTotals with adjuvant + mileage folded in", () => {
  const lineItems = [{ amount: 100 }, { amount: 50 }];

  it("adds both charges into the taxable subtotal and total", () => {
    const extra = quoteExtraTaxableCharges({ adjuvantPrice: 125.5, mileage: 42, ratePerMile: 2 });
    const totals = computeTotals([...lineItems, ...extra], 10, 10);

    // 150 line items + 125.5 adjuvant + 84 mileage = 359.5 subtotal
    assert.equal(totals.subtotal, 359.5);
    // tax applies to the full subtotal (both charges are taxable): 359.5 * 10%
    assert.equal(totals.tax, 35.95);
    // total = subtotal + tax + otherAmount(10)
    assert.equal(totals.total, 405.45);
  });

  it("matches a baseline quote when no extra charges are present", () => {
    const extra = quoteExtraTaxableCharges({ adjuvantPrice: null, mileage: null, ratePerMile: 5 });
    const withExtras = computeTotals([...lineItems, ...extra], 0, 0);
    const baseline = computeTotals(lineItems, 0, 0);

    assert.deepEqual(withExtras, baseline);
    assert.equal(withExtras.subtotal, 150);
  });

  it("taxes the mileage charge (mileage contributes to tax)", () => {
    const taxedRate = 8;
    const withMileage = computeTotals(
      [...lineItems, ...quoteExtraTaxableCharges({ adjuvantPrice: null, mileage: 10, ratePerMile: 3 })],
      taxedRate,
      0,
    );
    const withoutMileage = computeTotals(lineItems, taxedRate, 0);

    // 10 mi * $3 = $30 added to the taxable subtotal -> $2.40 extra tax at 8%.
    assert.equal(withMileage.subtotal - withoutMileage.subtotal, 30);
    assert.equal(Math.round((withMileage.tax - withoutMileage.tax) * 100) / 100, 2.4);
  });
});

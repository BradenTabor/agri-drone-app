import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  calculateExpectedAcres,
  calculateTotalMixGallonsHint,
} from "@/lib/calculations/mix";

describe("calculateExpectedAcres", () => {
  it("returns 66.67 for tankSizeGal 1000 and targetGpa 15", () => {
    assert.equal(calculateExpectedAcres({ tankSizeGal: 1000, targetGpa: 15 }), 66.67);
  });

  it("returns null when targetGpa is 0", () => {
    assert.equal(calculateExpectedAcres({ tankSizeGal: 1000, targetGpa: 0 }), null);
  });
});

describe("calculateTotalMixGallonsHint", () => {
  it("sums water, gal product lines, and gal surfactant rounded to 2 decimals", () => {
    assert.equal(
      calculateTotalMixGallonsHint({
        waterGal: 100,
        productLines: [
          { amountAdded: 10, amountUnit: "gal" },
          { amountAdded: 5.555, amountUnit: "gal" },
        ],
        surfactantAmount: 2.444,
        surfactantUnit: "gal",
      }),
      118,
    );
  });

  it("returns null when any product line amountUnit is not gal", () => {
    assert.equal(
      calculateTotalMixGallonsHint({
        waterGal: 100,
        productLines: [{ amountAdded: 10, amountUnit: "oz" }],
        surfactantAmount: null,
        surfactantUnit: null,
      }),
      null,
    );
  });

  it('returns null when surfactantUnit is "oz" with amount', () => {
    assert.equal(
      calculateTotalMixGallonsHint({
        waterGal: 100,
        productLines: [{ amountAdded: 10, amountUnit: "gal" }],
        surfactantAmount: 5,
        surfactantUnit: "oz",
      }),
      null,
    );
  });

  it("returns null when waterGal is NaN", () => {
    assert.equal(
      calculateTotalMixGallonsHint({
        waterGal: Number.NaN,
        productLines: [{ amountAdded: 10, amountUnit: "gal" }],
        surfactantAmount: null,
        surfactantUnit: null,
      }),
      null,
    );
  });
});

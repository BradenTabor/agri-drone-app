import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildTankMixSummary,
  formatMixDetailLine,
  formatMixSummaryLine,
  mixAcres,
  trimNumber,
  type AttachableMixRecord,
} from "@/lib/app-records/mixAttach";

function mix(overrides: Partial<AttachableMixRecord> = {}): AttachableMixRecord {
  return {
    id: "mix-1",
    recordDate: "2024-06-01",
    timeMixed: "10:30",
    customerName: "Acme Farms",
    fieldName: "North 40",
    applicatorName: "Jane",
    totalMixGal: 1000,
    expectedAcres: 66.67,
    actualAcres: null,
    surfactantName: null,
    surfactantAmount: null,
    surfactantUnit: null,
    products: [],
    ...overrides,
  };
}

describe("trimNumber", () => {
  it("drops trailing zeros and rounds to two decimals", () => {
    assert.equal(trimNumber(1000), "1000");
    assert.equal(trimNumber(10.5), "10.5");
    assert.equal(trimNumber(66.666), "66.67");
    assert.equal(trimNumber(10.0), "10");
  });
});

describe("mixAcres", () => {
  it("prefers actual acres when present", () => {
    assert.equal(mixAcres(mix({ actualAcres: 50, expectedAcres: 66.67 })), 50);
  });

  it("falls back to expected acres when actual is null", () => {
    assert.equal(mixAcres(mix({ actualAcres: null, expectedAcres: 66.67 })), 66.67);
  });
});

describe("buildTankMixSummary", () => {
  it("joins unique field names with the first record's short date", () => {
    assert.equal(
      buildTankMixSummary([
        mix({ fieldName: "North 40", recordDate: "2024-06-01" }),
        mix({ fieldName: "South 20", recordDate: "2024-06-02" }),
        mix({ fieldName: "North 40", recordDate: "2024-06-03" }),
      ]),
      "North 40 & South 20 — 6/1",
    );
  });

  it("falls back to 'Mix' when no field names are present", () => {
    assert.equal(buildTankMixSummary([mix({ fieldName: null })]), "Mix — 6/1");
  });

  it("returns 'Mix' for an empty list", () => {
    assert.equal(buildTankMixSummary([]), "Mix");
  });
});

describe("formatMixSummaryLine", () => {
  it("formats date, customer and field", () => {
    assert.equal(
      formatMixSummaryLine(mix({ customerName: "Acme", fieldName: "North 40" })),
      "2024-06-01 · Acme — North 40",
    );
  });

  it("uses em dashes for missing customer and field", () => {
    assert.equal(
      formatMixSummaryLine(mix({ customerName: null, fieldName: null })),
      "2024-06-01 · — — —",
    );
  });
});

describe("formatMixDetailLine", () => {
  it("summarizes gallons, acres, and product count", () => {
    assert.equal(
      formatMixDetailLine(
        mix({
          totalMixGal: 1000,
          actualAcres: null,
          expectedAcres: 66.67,
          products: [
            { productId: "a", productName: "A", epaNumber: null, activeIngredient: null },
            { productId: "b", productName: "B", epaNumber: null, activeIngredient: null },
          ],
        }),
      ),
      "1000 gal · 66.67 ac · 2 products",
    );
  });
});

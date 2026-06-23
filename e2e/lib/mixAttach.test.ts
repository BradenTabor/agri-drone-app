import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { mapMixRow, MIX_RECORD_ATTACH_SELECT } from "@/lib/app-records/mixAttach";

const BASE_ROW = {
  id: "mix-1",
  record_date: "2024-06-01",
  time_mixed: "10:30",
  customer_name_snapshot: "Acme",
  field_name_snapshot: "North 40",
  applicator_name_override: null,
  total_mix_gal: 1000,
  expected_acres: 66.67,
  actual_acres: null,
  surfactant_name: null,
  surfactant_amount: null,
  surfactant_unit: null,
  applicator_profile: null,
};

describe("MIX_RECORD_ATTACH_SELECT", () => {
  it("includes product join fields used by mapMixRow", () => {
    assert.match(MIX_RECORD_ATTACH_SELECT, /mix_record_products/);
    assert.match(MIX_RECORD_ATTACH_SELECT, /sort_order/);
    assert.match(MIX_RECORD_ATTACH_SELECT, /deleted_at/);
  });
});

describe("mapMixRow", () => {
  it("maps array product joins ordered by sort_order", () => {
    const mapped = mapMixRow({
      ...BASE_ROW,
      mix_record_products: [
        {
          product_id: "prod-b",
          sort_order: 2,
          deleted_at: null,
          products: {
            name: "Product B",
            epa_number: "EPA-B",
            ingredients: ["ai-b"],
            deleted_at: null,
          },
        },
        {
          product_id: "prod-a",
          sort_order: 1,
          deleted_at: null,
          products: {
            name: "Product A",
            epa_number: "EPA-A",
            ingredients: ["ai-a"],
            deleted_at: null,
          },
        },
      ],
    });

    assert.deepEqual(
      mapped.products.map((product) => product.productName),
      ["Product A", "Product B"],
    );
  });

  it("normalizes a single-object products join to one element", () => {
    const mapped = mapMixRow({
      ...BASE_ROW,
      mix_record_products: [
        {
          product_id: "prod-a",
          sort_order: 0,
          deleted_at: null,
          products: {
            name: "Solo Product",
            epa_number: "EPA-S",
            ingredients: ["solo-ai"],
            deleted_at: null,
          },
        },
      ],
    });

    assert.equal(mapped.products.length, 1);
    assert.equal(mapped.products[0]?.productName, "Solo Product");
    assert.equal(mapped.products[0]?.activeIngredient, "solo-ai");
  });

  it("excludes product rows with deleted_at set", () => {
    const mapped = mapMixRow({
      ...BASE_ROW,
      mix_record_products: [
        {
          product_id: "prod-live",
          sort_order: 0,
          deleted_at: null,
          products: {
            name: "Live Product",
            epa_number: null,
            ingredients: null,
            deleted_at: null,
          },
        },
        {
          product_id: "prod-deleted",
          sort_order: 1,
          deleted_at: "2024-06-02T00:00:00Z",
          products: {
            name: "Deleted Line",
            epa_number: null,
            ingredients: null,
            deleted_at: null,
          },
        },
      ],
    });

    assert.equal(mapped.products.length, 1);
    assert.equal(mapped.products[0]?.productName, "Live Product");
  });

  it("handles null product join without throwing", () => {
    const mapped = mapMixRow({
      ...BASE_ROW,
      mix_record_products: [
        {
          product_id: null,
          sort_order: 0,
          deleted_at: null,
          products: null,
        },
      ],
    });

    assert.equal(mapped.products.length, 1);
    assert.equal(mapped.products[0]?.productName, "Unknown product");
    assert.equal(mapped.products[0]?.epaNumber, null);
    assert.equal(mapped.products[0]?.activeIngredient, null);
  });

  it("handles null mix_record_products without throwing", () => {
    const mapped = mapMixRow({
      ...BASE_ROW,
      mix_record_products: null,
    });

    assert.deepEqual(mapped.products, []);
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  normalizeMixRecordPayload,
  normalizeProductLinesForRpc,
} from "@/lib/records/normalize";
import type { MixRecordCreateInput } from "@/lib/validation/schemas";

const CUSTOMER_ID = "11111111-1111-4111-8111-111111111111";
const FIELD_ID = "22222222-2222-4222-8222-222222222222";

function baseMixRecordInput(
  overrides: Partial<MixRecordCreateInput> = {},
): MixRecordCreateInput {
  return {
    recordDate: "2026-06-19",
    timeMixed: "08:30",
    customerId: CUSTOMER_ID,
    fieldId: FIELD_ID,
    mixLat: 30.2672,
    mixLng: -97.7431,
    tankSizeGal: 500,
    targetGpa: 2.5,
    waterGal: 475,
    totalMixGal: 500,
    expectedAcres: 200,
    signedTypedName: "Jane Applicator",
    signatureAttested: true,
    equipmentIds: [],
    productLines: [
      {
        amountAdded: 25,
        amountUnit: "fl_oz",
        sortOrder: 99,
      },
    ],
    ...overrides,
  };
}

describe("normalizeMixRecordPayload", () => {
  it("maps cleared optional fields to null in the RPC payload", () => {
    const payload = normalizeMixRecordPayload(
      baseMixRecordInput({
        applicatorId: undefined,
        surfactantName: undefined,
      }),
    );

    assert.equal(payload.applicator_id, null);
    assert.equal(payload.surfactant_name, null);
  });

  it("maps equipmentIds into equipment_ids and primary equipment_id", () => {
    const equipmentA = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    const equipmentB = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
    const payload = normalizeMixRecordPayload(
      baseMixRecordInput({
        equipmentIds: [equipmentA, equipmentB],
      }),
    );

    assert.equal(payload.equipment_id, equipmentA);
    assert.deepEqual(payload.equipment_ids, [equipmentA, equipmentB]);
  });

  it("passes required numerics through unchanged", () => {
    const input = baseMixRecordInput({
      tankSizeGal: 500,
      targetGpa: 2.5,
      waterGal: 475,
      totalMixGal: 500,
      expectedAcres: 200,
      mixLat: 30.2672,
      mixLng: -97.7431,
    });

    const payload = normalizeMixRecordPayload(input);

    assert.equal(payload.tank_size_gal, 500);
    assert.equal(payload.target_gpa, 2.5);
    assert.equal(payload.water_gal, 475);
    assert.equal(payload.total_mix_gal, 500);
    assert.equal(payload.expected_acres, 200);
    assert.equal(payload.mix_lat, 30.2672);
    assert.equal(payload.mix_lng, -97.7431);
  });
});

describe("normalizeProductLinesForRpc", () => {
  it("uses array index for sort_order regardless of input sortOrder", () => {
    const lines = normalizeProductLinesForRpc([
      { amountAdded: 10, amountUnit: "fl_oz", sortOrder: 5 },
      { amountAdded: 20, amountUnit: "gal", sortOrder: 2 },
      { amountAdded: 30, amountUnit: "lb", sortOrder: 0 },
    ]);

    assert.deepEqual(
      lines.map((line) => line.sort_order),
      [0, 1, 2],
    );
  });
});

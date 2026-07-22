import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  normalizeAppRecordPayload,
  normalizePesticidesForRpc,
} from "@/lib/app-records/normalize";
import type { AppRecordCreateInput } from "@/lib/validation/schemas";

const MIX_RECORD_ID_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const MIX_RECORD_ID_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

function baseAppRecordInput(
  overrides: Partial<AppRecordCreateInput> = {},
): AppRecordCreateInput {
  return {
    jobDate: "2026-06-19",
    applicatorName: "Jane Applicator",
    customerName: "Acme Farms",
    targetVegetation: ["brush"],
    certAttested: true,
    applicatorSig: "Jane Applicator",
    pesticides: [
      {
        productName: "Product A",
        isSurfactant: false,
        sortOrder: 9,
      },
    ],
    mixRecordIds: [MIX_RECORD_ID_A, MIX_RECORD_ID_B],
    appFields: [],
    ...overrides,
  };
}

describe("normalizeAppRecordPayload", () => {
  it("maps empty optional strings to empty string and undefined numbers to empty string", () => {
    const payload = normalizeAppRecordPayload(
      baseAppRecordInput({
        siteAddress: undefined,
        jobSiteId: undefined,
        windDirection: undefined,
        tempF: undefined,
        windSpeedMph: undefined,
        totalGallons: undefined,
        gallonsPerAcre: undefined,
        acresTreated: undefined,
      }),
    );

    assert.equal(payload.site_address, "");
    assert.equal(payload.job_site_id, "");
    assert.equal(payload.wind_direction, "");
    assert.equal(payload.temp_f, "");
    assert.equal(payload.wind_speed_mph, "");
    assert.equal(payload.total_gallons, "");
    assert.equal(payload.gallons_per_acre, "");
    assert.equal(payload.acres_treated, "");
  });

  it("leaves mixRecordIds on the input unchanged for separate RPC arg", () => {
    const mixRecordIds = [MIX_RECORD_ID_A, MIX_RECORD_ID_B];
    const input = baseAppRecordInput({ mixRecordIds });

    normalizeAppRecordPayload(input);

    assert.deepEqual(input.mixRecordIds, mixRecordIds);
  });

  it("copies range mins into legacy scalar columns when scalars are omitted", () => {
    const payload = normalizeAppRecordPayload(
      baseAppRecordInput({
        tempF: undefined,
        tempFMin: 72,
        tempFMax: 84,
        windSpeedMph: undefined,
        windSpeedMphMin: 3,
        windSpeedMphMax: 8,
      }),
    );

    assert.equal(payload.temp_f, "72");
    assert.equal(payload.temp_f_min, "72");
    assert.equal(payload.temp_f_max, "84");
    assert.equal(payload.wind_speed_mph, "3");
    assert.equal(payload.wind_speed_mph_min, "3");
    assert.equal(payload.wind_speed_mph_max, "8");
  });
});

describe("normalizePesticidesForRpc", () => {
  it("uses array index for sort_order and preserves is_surfactant", () => {
    const pesticides = normalizePesticidesForRpc([
      { productName: "Surfactant X", isSurfactant: true, sortOrder: 4 },
      { productName: "Herbicide Y", isSurfactant: false, sortOrder: 1 },
    ]);

    assert.deepEqual(
      pesticides.map((row) => row.sort_order),
      [0, 1],
    );
    assert.equal(pesticides[0]?.is_surfactant, true);
    assert.equal(pesticides[1]?.is_surfactant, false);
  });
});

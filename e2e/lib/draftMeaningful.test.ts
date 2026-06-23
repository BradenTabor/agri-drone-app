import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  hasMeaningfulAppDraft,
  type AppRecordDraft,
} from "@/lib/formDrafts/appRecordDraft";
import {
  hasMeaningfulMixDraft,
  type MixRecordDraft,
  type MixRecordProductLineDraft,
} from "@/lib/formDrafts/mixRecordDraft";

function emptyMixRecordDraft(): MixRecordDraft {
  return {
    v: 1,
    recordDate: "",
    timeMixed: "",
    applicatorId: "",
    applicatorNameOverride: "",
    licenseCertNo: "",
    equipmentId: "",
    customerId: "",
    fieldId: "",
    mixLat: "",
    mixLng: "",
    tankSizeGal: "",
    targetGpa: "",
    waterGal: "",
    surfactantId: "",
    surfactantName: "",
    surfactantAmount: "",
    surfactantUnit: "",
    lines: [],
    totalMixGal: "",
    expectedAcres: "",
    actualAcres: "",
    windSpeedMph: "",
    windDirection: "N",
    tempF: "",
    humidityPct: "",
    notes: "",
    signedTypedName: "",
    signatureAttested: false,
  };
}

function emptyAppRecordDraft(): AppRecordDraft {
  return {
    v: 1,
    jobDate: "",
    applicatorName: "",
    customerName: "",
    siteAddress: "",
    jobSiteId: "",
    locationLat: "",
    locationLng: "",
    tempF: "",
    windSpeedMph: "",
    windDirection: "",
    skyCondition: "",
    targetVegetation: [],
    targetVegOther: "",
    appMethod: "",
    appType: "",
    startTime: "",
    endTime: "",
    attachedMixes: [],
    pesticides: [],
    totalGallons: "",
    gallonsPerAcre: "",
    acresTreated: "",
    tankMixRecord: "",
    equipmentNotes: "",
    truckId: "",
    nozzleType: "",
    rei: "",
    safeReentryDate: "",
    additionalNotes: "",
    certAttested: false,
    applicatorSig: "",
    licenseCertNo: "",
  };
}

function emptyMixProductLine(): MixRecordProductLineDraft {
  return {
    rowId: "line-1",
    productId: "",
    amountAdded: "",
    amountUnit: "gal",
    ratePerAcre: "",
    rateUnit: "",
  };
}

describe("hasMeaningfulMixDraft", () => {
  it("returns false for an empty draft", () => {
    assert.equal(hasMeaningfulMixDraft(emptyMixRecordDraft()), false);
  });

  it("returns false for whitespace-only trimmed fields", () => {
    const draft = emptyMixRecordDraft();
    draft.mixLat = "   ";
    draft.mixLng = "\t";
    draft.notes = "  ";
    assert.equal(hasMeaningfulMixDraft(draft), false);
  });

  it("returns true when only customerId is set", () => {
    const draft = emptyMixRecordDraft();
    draft.customerId = "550e8400-e29b-41d4-a716-446655440000";
    assert.equal(hasMeaningfulMixDraft(draft), true);
  });

  it('returns true when only one product line has amountAdded "5"', () => {
    const draft = emptyMixRecordDraft();
    draft.lines = [{ ...emptyMixProductLine(), amountAdded: "5" }];
    assert.equal(hasMeaningfulMixDraft(draft), true);
  });
});

describe("hasMeaningfulAppDraft", () => {
  it("returns false for an empty draft", () => {
    assert.equal(hasMeaningfulAppDraft(emptyAppRecordDraft()), false);
  });

  it("returns true when one pesticide has productName", () => {
    const draft = emptyAppRecordDraft();
    draft.pesticides = [
      {
        rowId: "pesticide-1",
        productId: "",
        surfactantId: "",
        epaRegNumber: "",
        productName: "Roundup",
        activeIngredient: "",
        isSurfactant: false,
        sourceMixIds: [],
      },
    ];
    assert.equal(hasMeaningfulAppDraft(draft), true);
  });
});

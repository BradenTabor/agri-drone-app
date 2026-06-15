import type { WIND_DIRECTIONS } from "@/lib/constants";

export type MixRecordProductLineDraft = {
  rowId: string;
  productId: string;
  amountAdded: string;
  amountUnit: "gal" | "oz" | "fl_oz" | "lb";
  ratePerAcre: string;
  rateUnit: "" | "oz" | "fl_oz" | "gal" | "lb";
};

export type MixRecordDraft = {
  v: 1;
  recordDate: string;
  timeMixed: string;
  applicatorId: string;
  applicatorNameOverride: string;
  licenseCertNo: string;
  equipmentId: string;
  customerId: string;
  fieldId: string;
  mixLat: string;
  mixLng: string;
  tankSizeGal: string;
  targetGpa: string;
  waterGal: string;
  surfactantId: string;
  surfactantName: string;
  surfactantAmount: string;
  surfactantUnit: "oz" | "fl_oz" | "gal" | "%" | "";
  lines: MixRecordProductLineDraft[];
  totalMixGal: string;
  expectedAcres: string;
  actualAcres: string;
  windSpeedMph: string;
  windDirection: (typeof WIND_DIRECTIONS)[number];
  tempF: string;
  humidityPct: string;
  notes: string;
  signedTypedName: string;
  signatureAttested: boolean;
};

export function hasMeaningfulMixDraft(draft: MixRecordDraft): boolean {
  return Boolean(
    draft.customerId ||
      draft.fieldId ||
      draft.mixLat.trim() ||
      draft.mixLng.trim() ||
      draft.tankSizeGal.trim() ||
      draft.targetGpa.trim() ||
      draft.waterGal.trim() ||
      draft.totalMixGal.trim() ||
      draft.notes.trim() ||
      draft.signedTypedName.trim() ||
      draft.lines.some((line) => line.productId || line.amountAdded.trim()),
  );
}

export function summarizeMixRecordDraft(draft: MixRecordDraft): string {
  if (draft.customerId && draft.fieldId) {
    return "Customer and field selected";
  }
  if (draft.customerId) {
    return "Customer selected";
  }
  if (draft.mixLat.trim() || draft.mixLng.trim()) {
    return "Location captured";
  }
  if (draft.lines.some((line) => line.productId || line.amountAdded.trim())) {
    return "Products added";
  }
  return "In progress";
}

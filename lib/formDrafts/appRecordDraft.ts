import type { AttachableMixRecord } from "@/lib/app-records/mixAttach";
import type { WIND_DIRECTIONS } from "@/lib/constants";

export type AppRecordPesticideDraft = {
  rowId: string;
  productId: string;
  surfactantId: string;
  epaRegNumber: string;
  productName: string;
  activeIngredient: string;
  isSurfactant: boolean;
  sourceMixIds: string[];
};

export type AppRecordFieldDraft = {
  fieldId: string;
  fieldName: string;
  locationLat: number | null;
  locationLng: number | null;
};

export type AppRecordDraft = {
  /** Current draft schema. Older local drafts may still be v:1 with scalar weather. */
  v: 1 | 2;
  jobDate: string;
  applicatorName: string;
  customerName: string;
  customerId: string;
  siteAddress: string;
  jobSiteId: string;
  locationLat: string;
  locationLng: string;
  tempFMin: string;
  tempFMax: string;
  windSpeedMphMin: string;
  windSpeedMphMax: string;
  windDirection: (typeof WIND_DIRECTIONS)[number] | "";
  skyCondition: "clear" | "partly_cloudy" | "cloudy" | "rain" | "";
  targetVegetation: string[];
  targetVegOther: string;
  appMethod: "backpack" | "boom" | "handgun" | "utv" | "truck_rig" | "drone" | "";
  appType: "spraying" | "spreading" | "";
  startTime: string;
  endTime: string;
  attachedMixes: AttachableMixRecord[];
  pesticides: AppRecordPesticideDraft[];
  appFields: AppRecordFieldDraft[];
  totalGallons: string;
  gallonsPerAcre: string;
  acresTreated: string;
  tankMixRecord: string;
  equipmentNotes: string;
  equipmentId: string;
  truckId: string;
  nozzleType: string;
  rei: string;
  safeReentryDate: string;
  additionalNotes: string;
  certAttested: boolean;
  applicatorSig: string;
  licenseCertNo: string;
};

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

/**
 * Coerce unknown stored draft payloads (v1 scalar weather or v2 ranges) into the
 * current AppRecordDraft shape. Returns null when the payload is unusable.
 */
export function coerceAppRecordDraft(raw: unknown): AppRecordDraft | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const draft = raw as Record<string, unknown>;
  if (draft.v !== 1 && draft.v !== 2) {
    return null;
  }

  const legacyTempF = asString(draft.tempF);
  const legacyWind = asString(draft.windSpeedMph);

  const appFields = Array.isArray(draft.appFields)
    ? draft.appFields
        .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
        .map((item) => ({
          fieldId: asString(item.fieldId),
          fieldName: asString(item.fieldName),
          locationLat: typeof item.locationLat === "number" ? item.locationLat : null,
          locationLng: typeof item.locationLng === "number" ? item.locationLng : null,
        }))
        .filter((item) => item.fieldId.length > 0)
    : [];

  const pesticides = Array.isArray(draft.pesticides)
    ? (draft.pesticides as AppRecordPesticideDraft[])
    : [];

  const attachedMixes = Array.isArray(draft.attachedMixes)
    ? (draft.attachedMixes as AttachableMixRecord[])
    : [];

  const windDirection = asString(draft.windDirection);
  const skyCondition = asString(draft.skyCondition);
  const appMethod = asString(draft.appMethod);
  const appType = asString(draft.appType);

  return {
    v: 2,
    jobDate: asString(draft.jobDate),
    applicatorName: asString(draft.applicatorName),
    customerName: asString(draft.customerName),
    customerId: asString(draft.customerId),
    siteAddress: asString(draft.siteAddress),
    jobSiteId: asString(draft.jobSiteId),
    locationLat: asString(draft.locationLat),
    locationLng: asString(draft.locationLng),
    tempFMin: asString(draft.tempFMin) || legacyTempF,
    tempFMax: asString(draft.tempFMax),
    windSpeedMphMin: asString(draft.windSpeedMphMin) || legacyWind,
    windSpeedMphMax: asString(draft.windSpeedMphMax),
    windDirection:
      windDirection === "N" ||
      windDirection === "NE" ||
      windDirection === "E" ||
      windDirection === "SE" ||
      windDirection === "S" ||
      windDirection === "SW" ||
      windDirection === "W" ||
      windDirection === "NW"
        ? windDirection
        : "",
    skyCondition:
      skyCondition === "clear" ||
      skyCondition === "partly_cloudy" ||
      skyCondition === "cloudy" ||
      skyCondition === "rain"
        ? skyCondition
        : "",
    targetVegetation: asStringArray(draft.targetVegetation),
    targetVegOther: asString(draft.targetVegOther),
    appMethod:
      appMethod === "backpack" ||
      appMethod === "boom" ||
      appMethod === "handgun" ||
      appMethod === "utv" ||
      appMethod === "truck_rig" ||
      appMethod === "drone"
        ? appMethod
        : "",
    appType: appType === "spraying" || appType === "spreading" ? appType : "",
    startTime: asString(draft.startTime),
    endTime: asString(draft.endTime),
    attachedMixes,
    pesticides,
    appFields,
    totalGallons: asString(draft.totalGallons),
    gallonsPerAcre: asString(draft.gallonsPerAcre),
    acresTreated: asString(draft.acresTreated),
    tankMixRecord: asString(draft.tankMixRecord),
    equipmentNotes: asString(draft.equipmentNotes),
    equipmentId: asString(draft.equipmentId),
    truckId: asString(draft.truckId),
    nozzleType: asString(draft.nozzleType),
    rei: asString(draft.rei),
    safeReentryDate: asString(draft.safeReentryDate),
    additionalNotes: asString(draft.additionalNotes),
    certAttested: draft.certAttested === true,
    applicatorSig: asString(draft.applicatorSig),
    licenseCertNo: asString(draft.licenseCertNo),
  };
}

export function hasMeaningfulAppDraft(draft: AppRecordDraft): boolean {
  return Boolean(
    draft.jobDate.trim() ||
      draft.customerName.trim() ||
      draft.applicatorName.trim() ||
      draft.locationLat.trim() ||
      draft.locationLng.trim() ||
      draft.attachedMixes.length > 0 ||
      draft.pesticides.some((row) => row.productId || row.surfactantId || row.productName.trim()) ||
      draft.additionalNotes.trim(),
  );
}

export function summarizeAppRecordDraft(draft: AppRecordDraft): string {
  if (draft.customerName.trim()) {
    return draft.customerName.trim();
  }
  if (draft.attachedMixes.length > 0) {
    return `${draft.attachedMixes.length} mix record${draft.attachedMixes.length === 1 ? "" : "s"} attached`;
  }
  if (draft.jobDate.trim()) {
    return `Job date ${draft.jobDate}`;
  }
  return "In progress";
}

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

export type AppRecordDraft = {
  v: 1;
  jobDate: string;
  applicatorName: string;
  customerName: string;
  siteAddress: string;
  jobSiteId: string;
  locationLat: string;
  locationLng: string;
  tempF: string;
  windSpeedMph: string;
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
  totalGallons: string;
  gallonsPerAcre: string;
  acresTreated: string;
  tankMixRecord: string;
  equipmentNotes: string;
  truckId: string;
  nozzleType: string;
  rei: string;
  safeReentryDate: string;
  additionalNotes: string;
  certAttested: boolean;
  applicatorSig: string;
  licenseCertNo: string;
};

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

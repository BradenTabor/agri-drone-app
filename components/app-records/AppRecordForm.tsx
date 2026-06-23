"use client";

import type { ReactNode } from "react";
import { useActionState, useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { AppRecordFormState } from "@/app/(app)/app-records/actions";
import type { AttachableMixRecord } from "@/lib/app-records/mixAttach";
import { MixRecordPicker } from "@/components/app-records/MixRecordPicker";
import { FormDraftStatus } from "@/components/forms/FormDraftStatus";
import { useFormDraft } from "@/lib/formDrafts/useFormDraft";
import {
  hasMeaningfulAppDraft,
  type AppRecordDraft,
  type AppRecordPesticideDraft,
} from "@/lib/formDrafts/appRecordDraft";
import { DmsDecimalInput } from "@/components/fields/DmsDecimalInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DecimalInput } from "@/components/ui/decimal-input";
import { FormAlert } from "@/components/ui/form-alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  buildTankMixSummary,
  formatMixDetailLine,
  formatMixSummaryLine,
  mixAcres,
  trimNumber,
} from "@/lib/app-records/mixAttach";
import { WIND_DIRECTIONS } from "@/lib/constants";

const initialState: AppRecordFormState = { error: null };

type AppRecordFieldValues = {
  jobDate: string;
  applicatorName: string;
  customerName: string;
  siteAddress: string | null;
  jobSiteId: string | null;
  locationLat: string;
  locationLng: string;
  tempF: string;
  windSpeedMph: string;
  windDirection: (typeof WIND_DIRECTIONS)[number] | "";
  skyCondition: "clear" | "partly_cloudy" | "cloudy" | "rain" | "";
  targetVegOther: string | null;
  appMethod: "backpack" | "boom" | "handgun" | "utv" | "truck_rig" | "drone" | "";
  appType: "spraying" | "spreading" | "";
  startTime: string;
  endTime: string;
  totalGallons: string;
  gallonsPerAcre: string;
  acresTreated: string;
  tankMixRecord: string | null;
  equipmentNotes: string | null;
  truckId: string | null;
  nozzleType: string | null;
  rei: string | null;
  safeReentryDate: string;
  additionalNotes: string | null;
  certAttested: boolean;
  applicatorSig: string;
  licenseCertNo: string | null;
};

type ProductOption = {
  id: string;
  name: string;
  epaNumber: string | null;
  active: boolean;
};

type SurfactantOption = {
  id: string;
  name: string;
  epaNumber: string | null;
  active: boolean;
};

type PesticideRow = AppRecordPesticideDraft;

type AttachedMix = AttachableMixRecord;

type AppRecordFormProps = {
  action: (state: AppRecordFormState, formData: FormData) => Promise<AppRecordFormState>;
  submitLabel?: string;
  pendingLabel?: string;
  draftKey?: string | null;
  currentAppRecordId?: string | null;
  products: ProductOption[];
  surfactants: SurfactantOption[];
  defaultValues?: Partial<AppRecordFieldValues> & {
    targetVegetation?: string[];
    attachedMixes?: AttachedMix[];
    pesticides?: Array<{
      epaRegNumber: string | null;
      productName: string;
      activeIngredient: string | null;
      isSurfactant: boolean;
    }>;
  };
};

const targetVegetationOptions = [
  { value: "broadleaf", label: "Broadleaf" },
  { value: "grasses", label: "Grasses" },
  { value: "brush", label: "Brush" },
  { value: "woody", label: "Woody" },
  { value: "aquatic", label: "Aquatic" },
  { value: "other", label: "Other" },
] as const;

const appMethodOptions = [
  { value: "backpack", label: "Backpack" },
  { value: "boom", label: "Boom" },
  { value: "handgun", label: "Handgun" },
  { value: "utv", label: "UTV" },
  { value: "truck_rig", label: "Truck Rig" },
  { value: "drone", label: "Drone" },
] as const;

const appTypeOptions = [
  { value: "spraying", label: "Spraying" },
  { value: "spreading", label: "Spreading" },
] as const;

function newPesticideRow(isSurfactant = false): PesticideRow {
  return {
    rowId: crypto.randomUUID(),
    productId: "",
    surfactantId: "",
    epaRegNumber: "",
    productName: "",
    activeIngredient: "",
    isSurfactant,
    sourceMixIds: [],
  };
}

function isBlankStarterRow(row: PesticideRow): boolean {
  return (
    row.sourceMixIds.length === 0 &&
    !row.epaRegNumber.trim() &&
    !row.productName.trim() &&
    !row.activeIngredient.trim() &&
    !row.productId &&
    !row.surfactantId
  );
}

function productDedupeKey(productId: string | null, productName: string): string {
  return productId ?? productName.toLowerCase();
}

function matchProductId(
  products: ProductOption[],
  productName: string,
  epaRegNumber: string | null | undefined,
): string {
  const byName = products.find((product) => product.name === productName);
  if (byName) return byName.id;

  if (epaRegNumber) {
    const byEpa = products.find((product) => product.epaNumber === epaRegNumber);
    if (byEpa) return byEpa.id;
  }

  return "";
}

function matchSurfactantId(
  surfactants: SurfactantOption[],
  productName: string,
  epaRegNumber: string | null | undefined,
): string {
  const byName = surfactants.find((surfactant) => surfactant.name === productName);
  if (byName) return byName.id;

  if (epaRegNumber) {
    const byEpa = surfactants.find((surfactant) => surfactant.epaNumber === epaRegNumber);
    if (byEpa) return byEpa.id;
  }

  return "";
}

function parseDecimal(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function errorFor(state: AppRecordFormState, field: keyof AppRecordFieldValues | "targetVegetation" | "pesticides") {
  return state.fieldErrors?.[field]?.[0] ?? null;
}

export function AppRecordForm({
  action,
  submitLabel = "Submit Application Record",
  pendingLabel = "Submitting...",
  draftKey = null,
  currentAppRecordId = null,
  products,
  surfactants,
  defaultValues,
}: AppRecordFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [jobDate, setJobDate] = useState(defaultValues?.jobDate ?? "");
  const [applicatorName, setApplicatorName] = useState(defaultValues?.applicatorName ?? "");
  const [customerName, setCustomerName] = useState(defaultValues?.customerName ?? "");
  const [siteAddress, setSiteAddress] = useState(defaultValues?.siteAddress ?? "");
  const [jobSiteId, setJobSiteId] = useState(defaultValues?.jobSiteId ?? "");
  const [locationLat, setLocationLat] = useState(defaultValues?.locationLat ?? "");
  const [locationLng, setLocationLng] = useState(defaultValues?.locationLng ?? "");
  const [tempF, setTempF] = useState(defaultValues?.tempF ?? "");
  const [windSpeedMph, setWindSpeedMph] = useState(defaultValues?.windSpeedMph ?? "");
  const [windDirection, setWindDirection] = useState<AppRecordFieldValues["windDirection"]>(
    defaultValues?.windDirection ?? "",
  );
  const [skyCondition, setSkyCondition] = useState<AppRecordFieldValues["skyCondition"]>(
    defaultValues?.skyCondition ?? "",
  );
  const [targetVegetation, setTargetVegetation] = useState<string[]>(defaultValues?.targetVegetation ?? []);
  const [targetVegOther, setTargetVegOther] = useState(defaultValues?.targetVegOther ?? "");
  const [appMethod, setAppMethod] = useState<AppRecordFieldValues["appMethod"]>(defaultValues?.appMethod ?? "");
  const [appType, setAppType] = useState<AppRecordFieldValues["appType"]>(defaultValues?.appType ?? "");
  const [startTime, setStartTime] = useState(defaultValues?.startTime ?? "");
  const [endTime, setEndTime] = useState(defaultValues?.endTime ?? "");
  const [attachedMixes, setAttachedMixes] = useState<AttachedMix[]>(defaultValues?.attachedMixes ?? []);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pesticides, setPesticides] = useState<PesticideRow[]>(
    defaultValues?.pesticides?.length
      ? defaultValues.pesticides.map((row) => ({
          rowId: crypto.randomUUID(),
          productId: row.isSurfactant
            ? ""
            : matchProductId(products, row.productName, row.epaRegNumber),
          surfactantId: row.isSurfactant
            ? matchSurfactantId(surfactants, row.productName, row.epaRegNumber)
            : "",
          epaRegNumber: row.epaRegNumber ?? "",
          productName: row.productName,
          activeIngredient: row.activeIngredient ?? "",
          isSurfactant: row.isSurfactant,
          sourceMixIds: [],
        }))
      : [newPesticideRow(false)],
  );
  const [totalGallons, setTotalGallons] = useState(defaultValues?.totalGallons ?? "");
  const [gallonsPerAcre, setGallonsPerAcre] = useState(defaultValues?.gallonsPerAcre ?? "");
  const [acresTreated, setAcresTreated] = useState(defaultValues?.acresTreated ?? "");
  const [tankMixRecord, setTankMixRecord] = useState(defaultValues?.tankMixRecord ?? "");
  const [equipmentNotes, setEquipmentNotes] = useState(defaultValues?.equipmentNotes ?? "");
  const [truckId, setTruckId] = useState(defaultValues?.truckId ?? "");
  const [nozzleType, setNozzleType] = useState(defaultValues?.nozzleType ?? "");
  const [rei, setRei] = useState(defaultValues?.rei ?? "");
  const [safeReentryDate, setSafeReentryDate] = useState(defaultValues?.safeReentryDate ?? "");
  const [additionalNotes, setAdditionalNotes] = useState(defaultValues?.additionalNotes ?? "");
  const [certAttested, setCertAttested] = useState(defaultValues?.certAttested ?? false);
  const [applicatorSig, setApplicatorSig] = useState(defaultValues?.applicatorSig ?? "");
  const [licenseCertNo, setLicenseCertNo] = useState(defaultValues?.licenseCertNo ?? "");

  const applyDraft = useCallback(
    (draft: AppRecordDraft) => {
      if (draft.v !== 1) {
        return;
      }

      setJobDate(draft.jobDate);
      setApplicatorName(draft.applicatorName);
      setCustomerName(draft.customerName);
      setSiteAddress(draft.siteAddress);
      setJobSiteId(draft.jobSiteId);
      setLocationLat(draft.locationLat);
      setLocationLng(draft.locationLng);
      setTempF(draft.tempF);
      setWindSpeedMph(draft.windSpeedMph);
      setWindDirection(draft.windDirection);
      setSkyCondition(draft.skyCondition);
      setTargetVegetation(draft.targetVegetation);
      setTargetVegOther(draft.targetVegOther);
      setAppMethod(draft.appMethod);
      setAppType(draft.appType);
      setStartTime(draft.startTime);
      setEndTime(draft.endTime);
      setAttachedMixes(draft.attachedMixes);
      setPesticides(draft.pesticides.length > 0 ? draft.pesticides : [newPesticideRow(false)]);
      setTotalGallons(draft.totalGallons);
      setGallonsPerAcre(draft.gallonsPerAcre);
      setAcresTreated(draft.acresTreated);
      setTankMixRecord(draft.tankMixRecord);
      setEquipmentNotes(draft.equipmentNotes);
      setTruckId(draft.truckId);
      setNozzleType(draft.nozzleType);
      setRei(draft.rei);
      setSafeReentryDate(draft.safeReentryDate);
      setAdditionalNotes(draft.additionalNotes);
      setCertAttested(draft.certAttested);
      setApplicatorSig(draft.applicatorSig);
      setLicenseCertNo(draft.licenseCertNo);
    },
    [],
  );

  const draftValue = useMemo<AppRecordDraft>(
    () => ({
      v: 1,
      jobDate,
      applicatorName,
      customerName,
      siteAddress,
      jobSiteId,
      locationLat,
      locationLng,
      tempF,
      windSpeedMph,
      windDirection,
      skyCondition,
      targetVegetation,
      targetVegOther,
      appMethod,
      appType,
      startTime,
      endTime,
      attachedMixes,
      pesticides,
      totalGallons,
      gallonsPerAcre,
      acresTreated,
      tankMixRecord,
      equipmentNotes,
      truckId,
      nozzleType,
      rei,
      safeReentryDate,
      additionalNotes,
      certAttested,
      applicatorSig,
      licenseCertNo,
    }),
    [
      acresTreated,
      additionalNotes,
      appMethod,
      appType,
      applicatorName,
      applicatorSig,
      attachedMixes,
      certAttested,
      customerName,
      endTime,
      equipmentNotes,
      gallonsPerAcre,
      jobDate,
      jobSiteId,
      licenseCertNo,
      locationLat,
      locationLng,
      nozzleType,
      pesticides,
      rei,
      safeReentryDate,
      siteAddress,
      skyCondition,
      startTime,
      tankMixRecord,
      targetVegOther,
      targetVegetation,
      tempF,
      totalGallons,
      truckId,
      windDirection,
      windSpeedMph,
    ],
  );

  const { ready, restoredFromDraft, saveStatus, clearDraft, saveNow } = useFormDraft({
    draftKey,
    value: draftValue,
    onRestore: applyDraft,
    hasMeaningfulContent: hasMeaningfulAppDraft,
  });

  const saveNowRef = useRef(saveNow);
  useEffect(() => {
    saveNowRef.current = saveNow;
  });

  useEffect(() => {
    const hasError =
      Boolean(state.error) ||
      (state.fieldErrors != null && Object.keys(state.fieldErrors).length > 0);
    if (hasError) {
      saveNowRef.current();
    }
  }, [state]);

  const gallonsPerAcreHint = useMemo(() => {
    const gallons = parseDecimal(totalGallons);
    const acres = parseDecimal(acresTreated);
    if (gallons === null || acres === null || acres <= 0) return null;
    return (gallons / acres).toFixed(2);
  }, [acresTreated, totalGallons]);

  function toggleTargetVegetation(value: string) {
    setTargetVegetation((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    );
  }

  function updatePesticideRow(
    rowId: string,
    field: keyof Omit<PesticideRow, "rowId">,
    value: string | boolean,
  ) {
    setPesticides((current) =>
      current.map((row) => (row.rowId === rowId ? { ...row, [field]: value } : row)),
    );
  }

  function selectPesticideProduct(rowId: string, productId: string) {
    const selectedProduct = products.find((product) => product.id === productId) ?? null;

    setPesticides((current) =>
      current.map((row) =>
        row.rowId === rowId
          ? {
              ...row,
              productId,
              productName: selectedProduct?.name ?? "",
              epaRegNumber: selectedProduct?.epaNumber ?? "",
            }
          : row,
      ),
    );
  }

  function selectSurfactant(rowId: string, surfactantId: string) {
    const selectedSurfactant = surfactants.find((surfactant) => surfactant.id === surfactantId) ?? null;

    setPesticides((current) =>
      current.map((row) =>
        row.rowId === rowId
          ? {
              ...row,
              surfactantId,
              productName: selectedSurfactant?.name ?? "",
              epaRegNumber: selectedSurfactant?.epaNumber ?? "",
            }
          : row,
      ),
    );
  }

  function removePesticideRow(rowId: string) {
    setPesticides((current) => {
      if (current.length <= 1) return current;
      return current.filter((row) => row.rowId !== rowId);
    });
  }

  function recomputeTotalsFromMixes(mixes: AttachedMix[]) {
    if (mixes.length > 0) {
      const totalGal = mixes.reduce((sum, mix) => sum + mix.totalMixGal, 0);
      const acres = mixes.reduce((sum, mix) => sum + mixAcres(mix), 0);
      setTotalGallons(trimNumber(totalGal));
      setAcresTreated(trimNumber(acres));
      setGallonsPerAcre(acres > 0 ? (totalGal / acres).toFixed(2) : "");
      setTankMixRecord(buildTankMixSummary(mixes));
    }
  }

  function attachMix(mix: AttachedMix) {
    if (attachedMixes.some((item) => item.id === mix.id)) return;

    const isFirstAttach = attachedMixes.length === 0;
    const nextAttached = [...attachedMixes, mix];
    setAttachedMixes(nextAttached);

    setPesticides((current) => {
      let next = [...current];

      if (next.length === 1 && isBlankStarterRow(next[0]!)) {
        next = [];
      }

      for (const product of mix.products) {
        const key = productDedupeKey(product.productId, product.productName);
        const existingIndex = next.findIndex(
          (row) =>
            !row.isSurfactant &&
            row.sourceMixIds.length > 0 &&
            productDedupeKey(row.productId || null, row.productName) === key,
        );

        if (existingIndex >= 0) {
          const existing = next[existingIndex]!;
          if (!existing.sourceMixIds.includes(mix.id)) {
            next[existingIndex] = {
              ...existing,
              sourceMixIds: [...existing.sourceMixIds, mix.id],
            };
          }
          continue;
        }

        next.push({
          rowId: crypto.randomUUID(),
          productId: product.productId ?? matchProductId(products, product.productName, product.epaNumber) ?? "",
          surfactantId: "",
          epaRegNumber: product.epaNumber ?? "",
          productName: product.productName,
          activeIngredient: product.activeIngredient ?? "",
          isSurfactant: false,
          sourceMixIds: [mix.id],
        });
      }

      if (mix.surfactantName?.trim()) {
        const surfactantKey = mix.surfactantName.toLowerCase();
        const existingSurfactantIndex = next.findIndex(
          (row) =>
            row.isSurfactant &&
            row.sourceMixIds.length > 0 &&
            row.productName.toLowerCase() === surfactantKey,
        );

        if (existingSurfactantIndex >= 0) {
          const existing = next[existingSurfactantIndex]!;
          if (!existing.sourceMixIds.includes(mix.id)) {
            next[existingSurfactantIndex] = {
              ...existing,
              sourceMixIds: [...existing.sourceMixIds, mix.id],
            };
          }
        } else {
          next.push({
            rowId: crypto.randomUUID(),
            productId: "",
            surfactantId: "",
            epaRegNumber: "",
            productName: mix.surfactantName,
            activeIngredient: "",
            isSurfactant: true,
            sourceMixIds: [mix.id],
          });
        }
      }

      if (next.length === 0) {
        next = [newPesticideRow(false)];
      }

      return next;
    });

    recomputeTotalsFromMixes(nextAttached);

    if (isFirstAttach) {
      if (!jobDate.trim()) setJobDate(mix.recordDate);
      if (!customerName.trim() && mix.customerName) setCustomerName(mix.customerName);
      if (!applicatorName.trim() && mix.applicatorName) setApplicatorName(mix.applicatorName);
    }
  }

  function detachMix(mixId: string) {
    setAttachedMixes((current) => {
      const next = current.filter((mix) => mix.id !== mixId);
      if (next.length > 0) {
        recomputeTotalsFromMixes(next);
      }
      return next;
    });

    setPesticides((current) => {
      const updated = current
        .map((row) => {
          const hadMix = row.sourceMixIds.includes(mixId);
          const newSources = row.sourceMixIds.filter((id) => id !== mixId);
          return { row, hadMix, newSources };
        })
        .filter(({ hadMix, newSources }) => {
          if (newSources.length > 0) return true;
          if (hadMix) return false;
          return true;
        })
        .map(({ row, newSources }) => ({ ...row, sourceMixIds: newSources }));

      if (updated.length === 0) {
        return [newPesticideRow(false)];
      }
      return updated;
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    clearDraft();

    const form = event.currentTarget;
    const targetVegetationInput = form.elements.namedItem("targetVegetation") as HTMLInputElement;
    const pesticidesInput = form.elements.namedItem("pesticides") as HTMLInputElement;
    const mixRecordIdsInput = form.elements.namedItem("mixRecordIds") as HTMLInputElement;

    targetVegetationInput.value = JSON.stringify(targetVegetation);
    pesticidesInput.value = JSON.stringify(
      pesticides.map((row, index) => ({
        epaRegNumber: row.epaRegNumber || undefined,
        productName: row.productName,
        activeIngredient: row.activeIngredient || undefined,
        isSurfactant: row.isSurfactant,
        sortOrder: index,
      })),
    );
    mixRecordIdsInput.value = JSON.stringify(attachedMixes.map((mix) => mix.id));
  }

  function handleDiscardDraft() {
    clearDraft();
    setJobDate(defaultValues?.jobDate ?? "");
    setApplicatorName(defaultValues?.applicatorName ?? "");
    setCustomerName(defaultValues?.customerName ?? "");
    setSiteAddress(defaultValues?.siteAddress ?? "");
    setJobSiteId(defaultValues?.jobSiteId ?? "");
    setLocationLat(defaultValues?.locationLat ?? "");
    setLocationLng(defaultValues?.locationLng ?? "");
    setTempF(defaultValues?.tempF ?? "");
    setWindSpeedMph(defaultValues?.windSpeedMph ?? "");
    setWindDirection(defaultValues?.windDirection ?? "");
    setSkyCondition(defaultValues?.skyCondition ?? "");
    setTargetVegetation(defaultValues?.targetVegetation ?? []);
    setTargetVegOther(defaultValues?.targetVegOther ?? "");
    setAppMethod(defaultValues?.appMethod ?? "");
    setAppType(defaultValues?.appType ?? "");
    setStartTime(defaultValues?.startTime ?? "");
    setEndTime(defaultValues?.endTime ?? "");
    setAttachedMixes(defaultValues?.attachedMixes ?? []);
    setPesticides(
      defaultValues?.pesticides?.length
        ? defaultValues.pesticides.map((row) => ({
            rowId: crypto.randomUUID(),
            productId: row.isSurfactant
              ? ""
              : matchProductId(products, row.productName, row.epaRegNumber),
            surfactantId: row.isSurfactant
              ? matchSurfactantId(surfactants, row.productName, row.epaRegNumber)
              : "",
            epaRegNumber: row.epaRegNumber ?? "",
            productName: row.productName,
            activeIngredient: row.activeIngredient ?? "",
            isSurfactant: row.isSurfactant,
            sourceMixIds: [],
          }))
        : [newPesticideRow(false)],
    );
    setTotalGallons(defaultValues?.totalGallons ?? "");
    setGallonsPerAcre(defaultValues?.gallonsPerAcre ?? "");
    setAcresTreated(defaultValues?.acresTreated ?? "");
    setTankMixRecord(defaultValues?.tankMixRecord ?? "");
    setEquipmentNotes(defaultValues?.equipmentNotes ?? "");
    setTruckId(defaultValues?.truckId ?? "");
    setNozzleType(defaultValues?.nozzleType ?? "");
    setRei(defaultValues?.rei ?? "");
    setSafeReentryDate(defaultValues?.safeReentryDate ?? "");
    setAdditionalNotes(defaultValues?.additionalNotes ?? "");
    setCertAttested(defaultValues?.certAttested ?? false);
    setApplicatorSig(defaultValues?.applicatorSig ?? "");
    setLicenseCertNo(defaultValues?.licenseCertNo ?? "");
  }

  if (!ready) {
    return <p className="text-sm text-muted-foreground">Loading form...</p>;
  }

  return (
    <form action={formAction} onSubmit={handleSubmit} className="space-y-6">
      <FormDraftStatus restored={restoredFromDraft} saveStatus={saveStatus} onDiscard={handleDiscardDraft} />
      <input type="hidden" name="targetVegetation" defaultValue="[]" />
      <input type="hidden" name="pesticides" defaultValue="[]" />
      <input type="hidden" name="mixRecordIds" defaultValue="[]" />

      <FormSection title="Job Information">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="jobDate">Job date</Label>
            <Input
              id="jobDate"
              name="jobDate"
              type="date"
              value={jobDate}
              onChange={(event) => setJobDate(event.target.value)}
              aria-invalid={Boolean(errorFor(state, "jobDate"))}
              required
            />
            {errorFor(state, "jobDate") ? (
              <p className="text-sm text-destructive">{errorFor(state, "jobDate")}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="applicatorName">Applicator name</Label>
            <Input
              id="applicatorName"
              name="applicatorName"
              value={applicatorName}
              onChange={(event) => setApplicatorName(event.target.value)}
              aria-invalid={Boolean(errorFor(state, "applicatorName"))}
              required
            />
            {errorFor(state, "applicatorName") ? (
              <p className="text-sm text-destructive">{errorFor(state, "applicatorName")}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="customerName">Customer name</Label>
            <Input
              id="customerName"
              name="customerName"
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              aria-invalid={Boolean(errorFor(state, "customerName"))}
              required
            />
            {errorFor(state, "customerName") ? (
              <p className="text-sm text-destructive">{errorFor(state, "customerName")}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="siteAddress">Site address (optional)</Label>
            <Input
              id="siteAddress"
              name="siteAddress"
              value={siteAddress}
              onChange={(event) => setSiteAddress(event.target.value)}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="jobSiteId">Job / site ID (optional)</Label>
            <Input
              id="jobSiteId"
              name="jobSiteId"
              value={jobSiteId}
              onChange={(event) => setJobSiteId(event.target.value)}
              placeholder="e.g. Widner, Barns"
            />
          </div>
        </div>
      </FormSection>

      <FormSection title="GPS Coordinates">
        <div className="grid gap-4 md:grid-cols-2">
          <DmsDecimalInput
            name="locationLat"
            label="Latitude"
            axis="lat"
            value={locationLat}
            onValueChange={setLocationLat}
            error={errorFor(state, "locationLat")}
          />
          <DmsDecimalInput
            name="locationLng"
            label="Longitude"
            axis="lng"
            value={locationLng}
            onValueChange={setLocationLng}
            error={errorFor(state, "locationLng")}
          />
        </div>
      </FormSection>

      <FormSection title="Weather Conditions">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="tempF">Temperature (F)</Label>
            <DecimalInput id="tempF" name="tempF" value={tempF} onChange={(event) => setTempF(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="windSpeedMph">Wind speed (mph)</Label>
            <DecimalInput
              id="windSpeedMph"
              name="windSpeedMph"
              value={windSpeedMph}
              onChange={(event) => setWindSpeedMph(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="windDirection">Wind direction</Label>
            <Select
              id="windDirection"
              name="windDirection"
              value={windDirection}
              onChange={(event) =>
                setWindDirection(event.target.value as AppRecordFieldValues["windDirection"])
              }
            >
              <option value="">Select direction</option>
              {WIND_DIRECTIONS.map((direction) => (
                <option key={direction} value={direction}>
                  {direction}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="skyCondition">Sky condition</Label>
            <Select
              id="skyCondition"
              name="skyCondition"
              value={skyCondition}
              onChange={(event) =>
                setSkyCondition(event.target.value as AppRecordFieldValues["skyCondition"])
              }
            >
              <option value="">Select condition</option>
              <option value="clear">Clear</option>
              <option value="partly_cloudy">Partly Cloudy</option>
              <option value="cloudy">Cloudy</option>
              <option value="rain">Rain</option>
            </Select>
          </div>
        </div>
      </FormSection>

      <FormSection title="Target Vegetation">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {targetVegetationOptions.map((option) => (
            <Label key={option.value} className="flex min-h-11 items-center gap-3 rounded-md border px-3 py-2">
              <Checkbox
                checked={targetVegetation.includes(option.value)}
                onChange={() => toggleTargetVegetation(option.value)}
              />
              {option.label}
            </Label>
          ))}
        </div>
        {targetVegetation.includes("other") ? (
          <div className="space-y-2">
            <Label htmlFor="targetVegOther">Other vegetation</Label>
            <Input
              id="targetVegOther"
              name="targetVegOther"
              value={targetVegOther}
              onChange={(event) => setTargetVegOther(event.target.value)}
              placeholder="Describe vegetation"
            />
          </div>
        ) : null}
        {errorFor(state, "targetVegetation") ? (
          <p className="text-sm text-destructive">{errorFor(state, "targetVegetation")}</p>
        ) : null}
      </FormSection>

      <FormSection title="Application Method">
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Method</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {appMethodOptions.map((option) => (
                <Label key={option.value} className="flex min-h-11 items-center gap-3 rounded-md border px-3 py-2">
                  <input
                    type="radio"
                    name="appMethod"
                    value={option.value}
                    checked={appMethod === option.value}
                    onChange={() => setAppMethod(option.value)}
                    className="size-4"
                  />
                  {option.label}
                </Label>
              ))}
            </div>
            {errorFor(state, "appMethod") ? (
              <p className="text-sm text-destructive">{errorFor(state, "appMethod")}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Application type</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {appTypeOptions.map((option) => (
                <Label key={option.value} className="flex min-h-11 items-center gap-3 rounded-md border px-3 py-2">
                  <input
                    type="radio"
                    name="appType"
                    value={option.value}
                    checked={appType === option.value}
                    onChange={() => setAppType(option.value)}
                    className="size-4"
                  />
                  {option.label}
                </Label>
              ))}
            </div>
            {errorFor(state, "appType") ? (
              <p className="text-sm text-destructive">{errorFor(state, "appType")}</p>
            ) : null}
          </div>
        </div>
      </FormSection>

      <FormSection title="Application Timing">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="startTime">Start time</Label>
            <Input
              id="startTime"
              name="startTime"
              type="time"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endTime">End time</Label>
            <Input
              id="endTime"
              name="endTime"
              type="time"
              value={endTime}
              onChange={(event) => setEndTime(event.target.value)}
            />
          </div>
        </div>
      </FormSection>

      <FormSection title="Attached Mix Records">
        {attachedMixes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Attach the day&apos;s mix records to auto-fill products and totals.
          </p>
        ) : null}
        <div className="space-y-2">
          {attachedMixes.map((mix) => (
            <div key={mix.id} data-testid={`attached-mix-${mix.id}`} className="flex min-h-11 items-start justify-between gap-3 rounded-md border p-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">{formatMixSummaryLine(mix)}</p>
                <p className="text-xs text-muted-foreground">{formatMixDetailLine(mix)}</p>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => detachMix(mix.id)}>
                Remove
              </Button>
            </div>
          ))}
        </div>
        <Button type="button" variant="outline" size="sm" className="min-h-11" onClick={() => setPickerOpen(true)}>
          + Attach Mix Record
        </Button>
      </FormSection>

      <FormSection title="Pesticide Table">
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setPesticides((c) => [...c, newPesticideRow(false)])}>
            + Add Product
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setPesticides((c) => [...c, newPesticideRow(true)])}>
            + Add Surfactant
          </Button>
        </div>
        <div className="space-y-3">
          {pesticides.map((row, rowIndex) => {
            const selectedProduct = products.find((product) => product.id === row.productId) ?? null;
            const selectedSurfactant =
              surfactants.find((surfactant) => surfactant.id === row.surfactantId) ?? null;

            return (
              <div
                key={row.rowId}
                className={`space-y-3 rounded-md border p-3 ${row.isSurfactant ? "bg-muted/30" : ""}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Label className="flex min-h-11 items-center gap-3">
                      <Checkbox
                        checked={row.isSurfactant}
                        onChange={(e) => {
                          const isSurfactant = e.target.checked;
                          setPesticides((current) =>
                            current.map((item) =>
                              item.rowId === row.rowId
                                ? {
                                    ...item,
                                    isSurfactant,
                                    productId: "",
                                    surfactantId: "",
                                    productName: "",
                                    epaRegNumber: "",
                                  }
                                : item,
                            ),
                          );
                        }}
                      />
                      Surfactant / Adjuvant
                    </Label>
                    {row.sourceMixIds.length > 0 ? (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        from mix
                      </span>
                    ) : null}
                  </div>
                  {pesticides.length > 1 ? (
                    <Button type="button" variant="ghost" size="sm" onClick={() => removePesticideRow(row.rowId)}>
                      Remove
                    </Button>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label>{row.isSurfactant ? "Surfactant" : "Product"}</Label>
                  {row.isSurfactant ? (
                    <Select
                      id={`pesticide-surfactant-${rowIndex}`}
                      value={row.surfactantId}
                      onChange={(event) => selectSurfactant(row.rowId, event.target.value)}
                      required
                    >
                      <option value="">Select surfactant</option>
                      {surfactants.map((surfactant) => (
                        <option key={surfactant.id} value={surfactant.id}>
                          {surfactant.name}
                        </option>
                      ))}
                    </Select>
                  ) : (
                    <Select
                      id={`pesticide-product-${rowIndex}`}
                      value={row.productId}
                      onChange={(event) => selectPesticideProduct(row.rowId, event.target.value)}
                      required
                    >
                      <option value="">Select product</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </Select>
                  )}
                  <p className="text-xs text-muted-foreground">
                    EPA #:{" "}
                    {row.isSurfactant
                      ? selectedSurfactant?.epaNumber || row.epaRegNumber || "—"
                      : selectedProduct?.epaNumber || row.epaRegNumber || "—"}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Active ingredient</Label>
                  <Textarea
                    rows={2}
                    value={row.activeIngredient}
                    onChange={(e) => updatePesticideRow(row.rowId, "activeIngredient", e.target.value)}
                  />
                </div>
              </div>
            );
          })}
        </div>
        {errorFor(state, "pesticides") ? (
          <p className="text-sm text-destructive">{errorFor(state, "pesticides")}</p>
        ) : null}
      </FormSection>

      <FormSection title="Application Totals">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="totalGallons">Total gallons</Label>
            <DecimalInput
              id="totalGallons"
              name="totalGallons"
              value={totalGallons}
              onChange={(e) => setTotalGallons(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gallonsPerAcre">Gallons per acre</Label>
            <DecimalInput
              id="gallonsPerAcre"
              name="gallonsPerAcre"
              value={gallonsPerAcre}
              onChange={(event) => setGallonsPerAcre(event.target.value)}
            />
            {gallonsPerAcreHint ? (
              <p className="text-xs text-muted-foreground">Σ = {gallonsPerAcreHint} gpa</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="acresTreated">Acres treated</Label>
            <DecimalInput
              id="acresTreated"
              name="acresTreated"
              value={acresTreated}
              onChange={(e) => setAcresTreated(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tankMixRecord">Tank mix record</Label>
            <Input
              id="tankMixRecord"
              name="tankMixRecord"
              value={tankMixRecord}
              onChange={(event) => setTankMixRecord(event.target.value)}
              placeholder="e.g. SW1 & SW2 - 4-30"
            />
          </div>
        </div>
      </FormSection>

      <FormSection title="Equipment">
        <div className="space-y-2">
          <Label htmlFor="equipmentNotes">Equipment notes</Label>
          <Textarea
            id="equipmentNotes"
            name="equipmentNotes"
            value={equipmentNotes}
            onChange={(event) => setEquipmentNotes(event.target.value)}
            placeholder="e.g. DJI T-50 ID N#11347, DJI T-50 ID N#425AT"
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="truckId">Truck ID</Label>
            <Input id="truckId" name="truckId" value={truckId} onChange={(event) => setTruckId(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nozzleType">Nozzle type</Label>
            <Input
              id="nozzleType"
              name="nozzleType"
              value={nozzleType}
              onChange={(event) => setNozzleType(event.target.value)}
            />
          </div>
        </div>
      </FormSection>

      <FormSection title="Safety & Re-Entry">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="rei">REI</Label>
            <Input
              id="rei"
              name="rei"
              value={rei}
              onChange={(event) => setRei(event.target.value)}
              placeholder="e.g. 48 hours"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="safeReentryDate">Safe re-entry date</Label>
            <Input
              id="safeReentryDate"
              name="safeReentryDate"
              type="date"
              value={safeReentryDate}
              onChange={(event) => setSafeReentryDate(event.target.value)}
            />
          </div>
        </div>
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 dark:border-amber-700 dark:bg-amber-950/30">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-400">
            KEEP PEOPLE &amp; PETS OFF UNTIL DRY
          </p>
        </div>
      </FormSection>

      <FormSection title="Notes & Certification">
        <div className="space-y-2">
          <Label htmlFor="additionalNotes">Additional notes</Label>
          <Textarea
            id="additionalNotes"
            name="additionalNotes"
            value={additionalNotes}
            onChange={(event) => setAdditionalNotes(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="certAttested" className="flex items-start gap-3">
            <input type="hidden" name="certAttested" value="false" />
            <Checkbox
              id="certAttested"
              name="certAttested"
              value="true"
              checked={certAttested}
              onChange={(event) => setCertAttested(event.target.checked)}
            />
            <span className="text-sm leading-relaxed">
              I certify this application was made in accordance with the EPA-registered label and
              all applicable state laws.
            </span>
          </Label>
          {errorFor(state, "certAttested") ? (
            <p className="text-sm text-destructive">{errorFor(state, "certAttested")}</p>
          ) : null}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="applicatorSig">Applicator signature (type full name)</Label>
            <Input
              id="applicatorSig"
              name="applicatorSig"
              value={applicatorSig}
              onChange={(event) => setApplicatorSig(event.target.value)}
              aria-invalid={Boolean(errorFor(state, "applicatorSig"))}
              required
            />
            {errorFor(state, "applicatorSig") ? (
              <p className="text-sm text-destructive">{errorFor(state, "applicatorSig")}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="licenseCertNo">License / cert #</Label>
            <Input
              id="licenseCertNo"
              name="licenseCertNo"
              value={licenseCertNo}
              onChange={(event) => setLicenseCertNo(event.target.value)}
            />
          </div>
        </div>
      </FormSection>

      {state.error ? <FormAlert variant="error">{state.error}</FormAlert> : null}

      <Button type="submit" disabled={isPending}>
        {isPending ? pendingLabel : submitLabel}
      </Button>

      <MixRecordPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        currentAppRecordId={currentAppRecordId}
        attachedMixIds={attachedMixes.map((mix) => mix.id)}
        onSelect={attachMix}
      />
    </form>
  );
}

function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader className="p-4 pb-0">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-4">{children}</CardContent>
    </Card>
  );
}

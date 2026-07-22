"use client";

import type { ReactNode } from "react";
import { useActionState, useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { MixRecordFormState } from "@/app/(app)/records/actions";
import { FormDraftStatus } from "@/components/forms/FormDraftStatus";
import { GpsCapture } from "@/components/forms/GpsCapture";
import { SignatureBlock } from "@/components/forms/SignatureBlock";
import {
  hasMeaningfulMixDraft,
  type MixRecordDraft,
  type MixRecordProductLineDraft,
} from "@/lib/formDrafts/mixRecordDraft";
import { useFormDraft } from "@/lib/formDrafts/useFormDraft";
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
import { calculateExpectedAcres, calculateTotalMixGallonsHint } from "@/lib/calculations/mix";
import {
  firstFieldErrorKey,
  listFieldErrorMessages,
  mixRecordFieldTargetSelector,
} from "@/lib/form-errors";
import { cn } from "@/lib/utils";

const initialState: MixRecordFormState = { error: null };

type MixRecordFieldValues = {
  recordDate: string;
  timeMixed: string;
  applicatorId: string | null;
  applicatorNameOverride: string | null;
  licenseCertNo: string | null;
  equipmentIds: string[];
  customerId: string;
  fieldId: string;
  mixLat: string;
  mixLng: string;
  tankSizeGal: string;
  targetGpa: string;
  waterGal: string;
  surfactantName: string | null;
  surfactantAmount: string;
  surfactantUnit: "oz" | "fl_oz" | "gal" | "%" | "";
  totalMixGal: string;
  expectedAcres: string;
  actualAcres: string;
  notes: string | null;
  signedTypedName: string;
  signatureAttested: boolean;
};

type ProductLineValue = MixRecordProductLineDraft;

type MixRecordFormProps = {
  action: (state: MixRecordFormState, formData: FormData) => Promise<MixRecordFormState>;
  submitLabel: string;
  pendingLabel: string;
  draftKey?: string | null;
  defaultValues?: Partial<MixRecordFieldValues>;
  defaultProductLines?: ProductLineValue[];
  existingPhotos?: Array<{
    id: string;
    storagePath: string;
    previewUrl: string | null;
  }>;
  customers: Array<{ id: string; name: string }>;
  fields: Array<{
    id: string;
    name: string;
    customerId: string;
    defaultLat: number | null;
    defaultLng: number | null;
  }>;
  equipment: Array<{ id: string; identifier: string }>;
  products: Array<{
    id: string;
    name: string;
    epaNumber: string | null;
    active: boolean;
  }>;
  surfactants: Array<{
    id: string;
    name: string;
    epaNumber: string | null;
    defaultUnit: "oz" | "fl_oz" | "gal" | "%" | null;
    active: boolean;
  }>;
  applicators: Array<{
    id: string;
    label: string;
    fullName: string | null;
    licenseCertNo: string | null;
  }>;
};

function parseDecimal(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function newLine(): ProductLineValue {
  return {
    rowId: crypto.randomUUID(),
    productId: "",
    amountAdded: "",
    amountUnit: "gal",
    ratePerAcre: "",
    rateUnit: "",
  };
}

function toInputDate(now: Date): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toInputTime(now: Date): string {
  return now.toTimeString().slice(0, 5);
}

function errorFor(state: MixRecordFormState, field: keyof MixRecordFieldValues | "productLines") {
  return state.fieldErrors?.[field]?.[0] ?? null;
}

function matchSurfactantId(
  surfactants: MixRecordFormProps["surfactants"],
  surfactantName: string | null | undefined,
): string {
  if (!surfactantName) return "";
  const match = surfactants.find((surfactant) => surfactant.name === surfactantName);
  return match?.id ?? "";
}

export function MixRecordForm({
  action,
  submitLabel,
  pendingLabel,
  draftKey = null,
  defaultValues,
  defaultProductLines,
  existingPhotos,
  customers,
  fields,
  equipment,
  products,
  surfactants,
  applicators,
}: MixRecordFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const now = useMemo(() => new Date(), []);
  const [recordDate, setRecordDate] = useState(defaultValues?.recordDate ?? toInputDate(now));
  const [timeMixed, setTimeMixed] = useState(defaultValues?.timeMixed ?? toInputTime(now));
  const [applicatorId, setApplicatorId] = useState(defaultValues?.applicatorId ?? "");
  const [applicatorNameOverride, setApplicatorNameOverride] = useState(defaultValues?.applicatorNameOverride ?? "");
  const [licenseCertNo, setLicenseCertNo] = useState(defaultValues?.licenseCertNo ?? "");
  const [mixLat, setMixLat] = useState(defaultValues?.mixLat ?? "");
  const [mixLng, setMixLng] = useState(defaultValues?.mixLng ?? "");
  const [selectedCustomerId, setSelectedCustomerId] = useState(defaultValues?.customerId ?? "");
  const [selectedFieldId, setSelectedFieldId] = useState(defaultValues?.fieldId ?? "");
  const [lines, setLines] = useState<ProductLineValue[]>(defaultProductLines?.length ? defaultProductLines : [newLine()]);
  const autoCaptureAttemptedRef = useRef(false);
  const [tankSizeGal, setTankSizeGal] = useState(defaultValues?.tankSizeGal ?? "");
  const [targetGpa, setTargetGpa] = useState(defaultValues?.targetGpa ?? "");
  const [waterGal, setWaterGal] = useState(defaultValues?.waterGal ?? "");
  const [surfactantAmount, setSurfactantAmount] = useState(defaultValues?.surfactantAmount ?? "");
  const [surfactantUnit, setSurfactantUnit] = useState<MixRecordFieldValues["surfactantUnit"]>(
    defaultValues?.surfactantUnit ?? "",
  );
  const [surfactantId, setSurfactantId] = useState(
    matchSurfactantId(surfactants, defaultValues?.surfactantName),
  );
  const [surfactantName, setSurfactantName] = useState(defaultValues?.surfactantName ?? "");
  const [equipmentIds, setEquipmentIds] = useState<string[]>(defaultValues?.equipmentIds ?? []);
  const [totalMixGal, setTotalMixGal] = useState(defaultValues?.totalMixGal ?? "");
  const [expectedAcres, setExpectedAcres] = useState(defaultValues?.expectedAcres ?? "");
  const [actualAcres, setActualAcres] = useState(defaultValues?.actualAcres ?? "");
  const [notes, setNotes] = useState(defaultValues?.notes ?? "");
  const [signedTypedName, setSignedTypedName] = useState(defaultValues?.signedTypedName ?? "");
  const [signatureAttested, setSignatureAttested] = useState(defaultValues?.signatureAttested ?? false);

  const applyDraft = useCallback(
    (draft: MixRecordDraft) => {
      if (draft.v !== 1) {
        return;
      }

      setRecordDate(draft.recordDate);
      setTimeMixed(draft.timeMixed);
      setApplicatorId(draft.applicatorId);
      setApplicatorNameOverride(draft.applicatorNameOverride);
      setLicenseCertNo(draft.licenseCertNo);
      setEquipmentIds(
        draft.equipmentIds?.length
          ? draft.equipmentIds
          : draft.equipmentId
            ? [draft.equipmentId]
            : [],
      );
      setSelectedCustomerId(draft.customerId);
      setSelectedFieldId(draft.fieldId);
      setMixLat(draft.mixLat);
      setMixLng(draft.mixLng);
      setTankSizeGal(draft.tankSizeGal);
      setTargetGpa(draft.targetGpa);
      setWaterGal(draft.waterGal);
      setSurfactantId(draft.surfactantId);
      setSurfactantName(draft.surfactantName);
      setSurfactantAmount(draft.surfactantAmount);
      setSurfactantUnit(draft.surfactantUnit);
      setLines(draft.lines.length > 0 ? draft.lines : [newLine()]);
      setTotalMixGal(draft.totalMixGal);
      setExpectedAcres(draft.expectedAcres);
      setActualAcres(draft.actualAcres);
      setNotes(draft.notes);
      setSignedTypedName(draft.signedTypedName);
      setSignatureAttested(draft.signatureAttested);
    },
    [],
  );

  const visibleFields = useMemo(
    () => fields.filter((field) => field.customerId === selectedCustomerId),
    [fields, selectedCustomerId],
  );

  const effectiveFieldId =
    selectedFieldId && visibleFields.some((field) => field.id === selectedFieldId)
      ? selectedFieldId
      : "";

  const draftValue = useMemo<MixRecordDraft>(
    () => ({
      v: 1,
      recordDate,
      timeMixed,
      applicatorId,
      applicatorNameOverride,
      licenseCertNo,
      equipmentIds,
      customerId: selectedCustomerId,
      fieldId: effectiveFieldId,
      mixLat,
      mixLng,
      tankSizeGal,
      targetGpa,
      waterGal,
      surfactantId,
      surfactantName,
      surfactantAmount,
      surfactantUnit,
      lines,
      totalMixGal,
      expectedAcres,
      actualAcres,
      notes,
      signedTypedName,
      signatureAttested,
    }),
    [
      actualAcres,
      applicatorId,
      applicatorNameOverride,
      equipmentIds,
      expectedAcres,
      licenseCertNo,
      lines,
      mixLat,
      mixLng,
      notes,
      recordDate,
      selectedCustomerId,
      effectiveFieldId,
      signatureAttested,
      signedTypedName,
      surfactantAmount,
      surfactantId,
      surfactantName,
      surfactantUnit,
      tankSizeGal,
      targetGpa,
      timeMixed,
      totalMixGal,
      waterGal,
    ],
  );

  const { ready, restoredFromDraft, saveStatus, clearDraft, saveNow } = useFormDraft({
    draftKey,
    value: draftValue,
    onRestore: applyDraft,
    hasMeaningfulContent: hasMeaningfulMixDraft,
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

  const validationMessages = useMemo(() => listFieldErrorMessages(state.fieldErrors), [state.fieldErrors]);
  const productLinesError = errorFor(state, "productLines");

  useEffect(() => {
    const firstErrorField = firstFieldErrorKey(state.fieldErrors);
    if (!firstErrorField) {
      return;
    }

    const target = document.querySelector(mixRecordFieldTargetSelector(firstErrorField));
    if (!(target instanceof HTMLElement)) {
      return;
    }

    target.scrollIntoView({ behavior: "smooth", block: "center" });
    if (target.matches("input, select, textarea, button")) {
      target.focus({ preventScroll: true });
    }
  }, [state.fieldErrors]);

  useEffect(() => {
    if (autoCaptureAttemptedRef.current || mixLat || mixLng || !("geolocation" in navigator)) {
      return;
    }
    autoCaptureAttemptedRef.current = true;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setMixLat(position.coords.latitude.toFixed(6));
        setMixLng(position.coords.longitude.toFixed(6));
      },
      () => {
        // Silent fallback to manual entry.
      },
      { enableHighAccuracy: true, maximumAge: 60_000, timeout: 10_000 },
    );
  }, [mixLat, mixLng]);

  const expectedAcresHint = calculateExpectedAcres({
    tankSizeGal: parseDecimal(tankSizeGal) ?? 0,
    targetGpa: parseDecimal(targetGpa) ?? 0,
  });

  const totalMixHint = calculateTotalMixGallonsHint({
    waterGal: parseDecimal(waterGal) ?? 0,
    productLines: lines
      .map((line) => ({
        amountAdded: parseDecimal(line.amountAdded),
        amountUnit: line.amountUnit,
      }))
      .filter((line): line is { amountAdded: number; amountUnit: "gal" | "oz" | "fl_oz" | "lb" } =>
        line.amountAdded !== null,
      ),
    surfactantAmount: parseDecimal(surfactantAmount),
    surfactantUnit: surfactantUnit || null,
  });

  const productLinesPayload = JSON.stringify(
    lines.map((line) => ({
      productId: line.productId || "",
      amountAdded: line.amountAdded,
      amountUnit: line.amountUnit,
      ratePerAcre: line.ratePerAcre,
      rateUnit: line.rateUnit,
    })),
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    clearDraft();

    const productLinesInput = event.currentTarget.elements.namedItem(
      "productLinesJson",
    ) as HTMLInputElement | null;
    if (productLinesInput) {
      productLinesInput.value = productLinesPayload;
    }
  }

  function handleDiscardDraft() {
    clearDraft();
    setRecordDate(defaultValues?.recordDate ?? toInputDate(now));
    setTimeMixed(defaultValues?.timeMixed ?? toInputTime(now));
    setApplicatorId(defaultValues?.applicatorId ?? "");
    setApplicatorNameOverride(defaultValues?.applicatorNameOverride ?? "");
    setLicenseCertNo(defaultValues?.licenseCertNo ?? "");
    setEquipmentIds(defaultValues?.equipmentIds ?? []);
    setSelectedCustomerId(defaultValues?.customerId ?? "");
    setSelectedFieldId(defaultValues?.fieldId ?? "");
    setMixLat(defaultValues?.mixLat ?? "");
    setMixLng(defaultValues?.mixLng ?? "");
    setTankSizeGal(defaultValues?.tankSizeGal ?? "");
    setTargetGpa(defaultValues?.targetGpa ?? "");
    setWaterGal(defaultValues?.waterGal ?? "");
    setSurfactantId(matchSurfactantId(surfactants, defaultValues?.surfactantName));
    setSurfactantName(defaultValues?.surfactantName ?? "");
    setSurfactantAmount(defaultValues?.surfactantAmount ?? "");
    setSurfactantUnit(defaultValues?.surfactantUnit ?? "");
    setLines(defaultProductLines?.length ? defaultProductLines : [newLine()]);
    setTotalMixGal(defaultValues?.totalMixGal ?? "");
    setExpectedAcres(defaultValues?.expectedAcres ?? "");
    setActualAcres(defaultValues?.actualAcres ?? "");
    setNotes(defaultValues?.notes ?? "");
    setSignedTypedName(defaultValues?.signedTypedName ?? "");
    setSignatureAttested(defaultValues?.signatureAttested ?? false);
  }

  if (!ready) {
    return <p className="text-sm text-muted-foreground">Loading form...</p>;
  }

  return (
    <form action={formAction} onSubmit={handleSubmit} className="space-y-6">
      <FormDraftStatus restored={restoredFromDraft} saveStatus={saveStatus} onDiscard={handleDiscardDraft} />
      <input type="hidden" name="productLinesJson" defaultValue="[]" />

      <FormSection title="Header">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="recordDate">Date</Label>
            <Input
              id="recordDate"
              name="recordDate"
              type="date"
              value={recordDate}
              onChange={(event) => setRecordDate(event.target.value)}
              aria-invalid={Boolean(errorFor(state, "recordDate"))}
              required
            />
            {errorFor(state, "recordDate") ? (
              <p className="text-sm text-destructive">{errorFor(state, "recordDate")}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeMixed">Time mixed</Label>
            <Input
              id="timeMixed"
              name="timeMixed"
              type="time"
              value={timeMixed}
              onChange={(event) => setTimeMixed(event.target.value)}
              aria-invalid={Boolean(errorFor(state, "timeMixed"))}
              required
            />
            {errorFor(state, "timeMixed") ? (
              <p className="text-sm text-destructive">{errorFor(state, "timeMixed")}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="applicatorId">Applicator</Label>
            <Select
              id="applicatorId"
              name="applicatorId"
              value={applicatorId}
              onChange={(event) => {
                const nextApplicatorId = event.target.value;
                const selectedApplicator =
                  applicators.find((applicator) => applicator.id === nextApplicatorId) ?? null;
                setApplicatorId(nextApplicatorId);
                if (selectedApplicator) {
                  setApplicatorNameOverride(selectedApplicator.fullName ?? "");
                  setLicenseCertNo(selectedApplicator.licenseCertNo ?? "");
                }
              }}
            >
              <option value="">Unassigned</option>
              {applicators.map((applicator) => (
                <option key={applicator.id} value={applicator.id}>
                  {applicator.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="applicatorNameOverride">Applicator name override</Label>
            <Input
              id="applicatorNameOverride"
              name="applicatorNameOverride"
              value={applicatorNameOverride}
              onChange={(event) => setApplicatorNameOverride(event.target.value)}
              aria-invalid={Boolean(errorFor(state, "applicatorNameOverride"))}
              placeholder="Optional handwritten name"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label id="equipmentIds-label">Equipment</Label>
            {/* Hidden inputs own form submission so soft-deleted / inactive
                selections still persist even when no checkbox is rendered. */}
            {equipmentIds.map((id) => (
              <input key={`equipment-hidden-${id}`} type="hidden" name="equipmentIds" value={id} />
            ))}
            <div
              role="group"
              aria-labelledby="equipmentIds-label"
              className="max-h-48 space-y-2 overflow-y-auto rounded-md border border-input bg-background p-3"
            >
              {equipment.length === 0 && equipmentIds.length === 0 ? (
                <p className="text-sm text-muted-foreground">No equipment available.</p>
              ) : (
                <>
                  {equipment.map((item) => {
                    const checked = equipmentIds.includes(item.id);
                    return (
                      <label
                        key={item.id}
                        className="flex cursor-pointer items-start gap-3 text-sm"
                      >
                        <Checkbox
                          value={item.id}
                          checked={checked}
                          onChange={(event) => {
                            const nextChecked = event.target.checked;
                            setEquipmentIds((current) => {
                              if (nextChecked) {
                                return current.includes(item.id)
                                  ? current
                                  : [...current, item.id];
                              }
                              return current.filter((id) => id !== item.id);
                            });
                          }}
                          className="mt-0.5"
                        />
                        <span>{item.identifier}</span>
                      </label>
                    );
                  })}
                  {equipmentIds
                    .filter((id) => !equipment.some((item) => item.id === id))
                    .map((id) => (
                      <label
                        key={`orphan-${id}`}
                        className="flex cursor-pointer items-start gap-3 text-sm text-muted-foreground"
                      >
                        <Checkbox
                          value={id}
                          checked
                          onChange={() => {
                            setEquipmentIds((current) => current.filter((itemId) => itemId !== id));
                          }}
                          className="mt-0.5"
                        />
                        <span>Previously selected equipment (unavailable)</span>
                      </label>
                    ))}
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Select one or more pieces of equipment used for this mix.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="licenseCertNo">License / cert #</Label>
            <Input
              id="licenseCertNo"
              name="licenseCertNo"
              value={licenseCertNo}
              onChange={(event) => setLicenseCertNo(event.target.value)}
              aria-invalid={Boolean(errorFor(state, "licenseCertNo"))}
              placeholder="TX-123456"
            />
          </div>
        </div>
      </FormSection>

      <FormSection title="Location">
        <GpsCapture
          onCapture={({ lat, lng }) => {
            setMixLat(lat.toString());
            setMixLng(lng.toString());
          }}
        />
        <div className="grid gap-4 md:grid-cols-2">
          <DmsDecimalInput
            name="mixLat"
            label="Mix latitude"
            axis="lat"
            value={mixLat}
            onValueChange={setMixLat}
            error={errorFor(state, "mixLat")}
            required
          />
          <DmsDecimalInput
            name="mixLng"
            label="Mix longitude"
            axis="lng"
            value={mixLng}
            onValueChange={setMixLng}
            error={errorFor(state, "mixLng")}
            required
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="customerId">Customer</Label>
            <Select
              id="customerId"
              name="customerId"
              value={selectedCustomerId}
              onChange={(event) => {
                setSelectedCustomerId(event.target.value);
                setSelectedFieldId("");
              }}
              aria-invalid={Boolean(errorFor(state, "customerId"))}
              required
            >
              <option value="">Select customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </Select>
            {errorFor(state, "customerId") ? (
              <p className="text-sm text-destructive">{errorFor(state, "customerId")}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="fieldId">Field</Label>
            <Select
              id="fieldId"
              name="fieldId"
              value={effectiveFieldId}
              onChange={(event) => {
                const nextFieldId = event.target.value;
                const selectedField = fields.find((field) => field.id === nextFieldId) ?? null;
                setSelectedFieldId(nextFieldId);
                if (selectedField?.defaultLat != null && selectedField.defaultLng != null) {
                  setMixLat(String(selectedField.defaultLat));
                  setMixLng(String(selectedField.defaultLng));
                }
              }}
              aria-invalid={Boolean(errorFor(state, "fieldId"))}
              required
              disabled={!selectedCustomerId || visibleFields.length === 0}
            >
              <option value="">Select field</option>
              {visibleFields.map((field) => (
                <option key={field.id} value={field.id}>
                  {field.name}
                </option>
              ))}
            </Select>
            {selectedCustomerId && visibleFields.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                This customer has no fields yet. Add a field on the customer page before submitting.
              </p>
            ) : null}
            {errorFor(state, "fieldId") ? (
              <p className="text-sm text-destructive">{errorFor(state, "fieldId")}</p>
            ) : null}
          </div>
        </div>
      </FormSection>

      <FormSection title="Mix details">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="tankSizeGal">Tank size (gal)</Label>
            <DecimalInput
              id="tankSizeGal"
              name="tankSizeGal"
              value={tankSizeGal}
              onChange={(event) => setTankSizeGal(event.target.value)}
              aria-invalid={Boolean(errorFor(state, "tankSizeGal"))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="targetGpa">Target GPA</Label>
            <DecimalInput
              id="targetGpa"
              name="targetGpa"
              value={targetGpa}
              onChange={(event) => setTargetGpa(event.target.value)}
              aria-invalid={Boolean(errorFor(state, "targetGpa"))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="waterGal">Water (gal)</Label>
            <DecimalInput
              id="waterGal"
              name="waterGal"
              value={waterGal}
              onChange={(event) => setWaterGal(event.target.value)}
              aria-invalid={Boolean(errorFor(state, "waterGal"))}
              required
            />
          </div>
        </div>

        <div className="space-y-3 rounded-md border border-dashed p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-medium">Products</h3>
            <Button type="button" variant="outline" size="sm" onClick={() => setLines((current) => [...current, newLine()])}>
              + Add product
            </Button>
          </div>
          {lines.map((line) => {
            const selectedProduct = products.find((product) => product.id === line.productId) ?? null;

            return (
              <div key={line.rowId} className="space-y-2 rounded-md border p-3">
                <div className="grid gap-3 md:grid-cols-6">
                  <div className="space-y-1 md:col-span-2">
                    <Label>Product</Label>
                    <Select
                      value={line.productId}
                      onChange={(event) =>
                        setLines((current) =>
                          current.map((item) =>
                            item.rowId === line.rowId ? { ...item, productId: event.target.value } : item,
                          ),
                        )
                      }
                    >
                      <option value="">Select product</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Amount</Label>
                    <DecimalInput
                      value={line.amountAdded}
                      onChange={(event) =>
                        setLines((current) =>
                          current.map((item) =>
                            item.rowId === line.rowId ? { ...item, amountAdded: event.target.value } : item,
                          ),
                        )
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Unit</Label>
                    <Select
                      value={line.amountUnit}
                      onChange={(event) =>
                        setLines((current) =>
                          current.map((item) =>
                            item.rowId === line.rowId
                              ? { ...item, amountUnit: event.target.value as ProductLineValue["amountUnit"] }
                              : item,
                          ),
                        )
                      }
                    >
                      <option value="gal">gal</option>
                      <option value="oz">oz</option>
                      <option value="fl_oz">fl oz</option>
                      <option value="lb">lb</option>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Rate / ac</Label>
                    <DecimalInput
                      value={line.ratePerAcre}
                      onChange={(event) => {
                        const ratePerAcre = event.target.value;
                        setLines((current) =>
                          current.map((item) =>
                            item.rowId === line.rowId
                              ? {
                                  ...item,
                                  ratePerAcre,
                                  rateUnit:
                                    item.rateUnit || (ratePerAcre.trim() ? item.amountUnit : item.rateUnit),
                                }
                              : item,
                          ),
                        );
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Rate unit</Label>
                    <Select
                      value={line.rateUnit}
                      onChange={(event) =>
                        setLines((current) =>
                          current.map((item) =>
                            item.rowId === line.rowId
                              ? { ...item, rateUnit: event.target.value as ProductLineValue["rateUnit"] }
                              : item,
                          ),
                        )
                      }
                      aria-invalid={Boolean(
                        productLinesError && line.ratePerAcre.trim() && !line.rateUnit,
                      )}
                      className={cn(
                        productLinesError && line.ratePerAcre.trim() && !line.rateUnit
                          ? "border-destructive"
                          : "",
                      )}
                    >
                      <option value="">None</option>
                      <option value="oz">oz</option>
                      <option value="fl_oz">fl oz</option>
                      <option value="gal">gal</option>
                      <option value="lb">lb</option>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>EPA #: {selectedProduct?.epaNumber || "—"}</span>
                  {lines.length > 1 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() =>
                        setLines((current) => current.filter((item) => item.rowId !== line.rowId))
                      }
                    >
                      Remove
                    </Button>
                  ) : null}
                </div>

              </div>
            );
          })}
          {productLinesError ? (
            <p className="text-sm text-destructive">{productLinesError}</p>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="surfactantId">Surfactant</Label>
            <Select
              id="surfactantId"
              value={surfactantId}
              onChange={(event) => {
                const nextId = event.target.value;
                const selectedSurfactant = surfactants.find((item) => item.id === nextId) ?? null;
                setSurfactantId(nextId);
                setSurfactantName(selectedSurfactant?.name ?? "");
                if (selectedSurfactant?.defaultUnit) {
                  setSurfactantUnit(selectedSurfactant.defaultUnit);
                }
              }}
            >
              <option value="">None</option>
              {surfactants.map((surfactant) => (
                <option key={surfactant.id} value={surfactant.id}>
                  {surfactant.name}
                </option>
              ))}
            </Select>
            <input type="hidden" name="surfactantName" value={surfactantName} />
            <p className="text-xs text-muted-foreground">
              EPA #:{" "}
              {surfactants.find((item) => item.id === surfactantId)?.epaNumber || "—"}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="surfactantAmount">Surfactant amount</Label>
            <DecimalInput
              id="surfactantAmount"
              name="surfactantAmount"
              value={surfactantAmount}
              onChange={(event) => setSurfactantAmount(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="surfactantUnit">Surfactant unit</Label>
            <Select
              id="surfactantUnit"
              name="surfactantUnit"
              value={surfactantUnit}
              onChange={(event) =>
                setSurfactantUnit(event.target.value as MixRecordFieldValues["surfactantUnit"])
              }
            >
              <option value="">None</option>
              <option value="oz">oz</option>
              <option value="fl_oz">fl oz</option>
              <option value="gal">gal</option>
              <option value="%">%</option>
            </Select>
          </div>
        </div>
      </FormSection>

      <FormSection title="Totals">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="totalMixGal">Total mix (gal)</Label>
            <DecimalInput
              id="totalMixGal"
              name="totalMixGal"
              value={totalMixGal}
              onChange={(event) => setTotalMixGal(event.target.value)}
              aria-invalid={Boolean(errorFor(state, "totalMixGal"))}
              required
            />
            {totalMixHint !== null ? (
              <p className="text-xs text-muted-foreground">Calculated hint: {totalMixHint} gal</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Calculated hint unavailable when non-gallon units are used.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="expectedAcres">Expected acres</Label>
            <DecimalInput
              id="expectedAcres"
              name="expectedAcres"
              value={expectedAcres}
              onChange={(event) => setExpectedAcres(event.target.value)}
              aria-invalid={Boolean(errorFor(state, "expectedAcres"))}
              required
            />
            {expectedAcresHint !== null ? (
              <p className="text-xs text-muted-foreground">Suggested from tank/GPA: {expectedAcresHint}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="actualAcres">Actual acres (optional)</Label>
            <DecimalInput
              id="actualAcres"
              name="actualAcres"
              value={actualAcres}
              onChange={(event) => setActualAcres(event.target.value)}
            />
          </div>
        </div>
      </FormSection>

      <FormSection title="Photos">
        <div className="space-y-2">
          <Label htmlFor="photos">Upload photos</Label>
          <Input id="photos" name="photos" type="file" accept="image/*" multiple />
          <p className="text-xs text-muted-foreground">
            Images are stored with the record and visible to authenticated team members.
          </p>
        </div>
        {existingPhotos?.length ? (
          <div className="space-y-2">
            <p className="text-sm font-medium">Existing photos</p>
            <div className="grid gap-3 md:grid-cols-2">
              {existingPhotos.map((photo) => (
                <label key={photo.id} className="flex min-h-11 items-start gap-3 rounded border p-2 text-sm">
                  <Checkbox name="removePhotoIds" value={photo.id} className="mt-1" />
                  <div className="space-y-2">
                    {photo.previewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photo.previewUrl}
                        alt="Mix record photo"
                        className="h-24 w-24 rounded object-cover"
                      />
                    ) : null}
                    <p className="break-all text-xs text-muted-foreground">{photo.storagePath}</p>
                    <p className="text-xs text-muted-foreground">Select to remove on save</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        ) : null}
      </FormSection>

      <FormSection title="Notes & Signature">
        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" name="notes" value={notes} onChange={(event) => setNotes(event.target.value)} />
        </div>
        <SignatureBlock
          typedNameValue={signedTypedName}
          onTypedNameChange={setSignedTypedName}
          attestedChecked={signatureAttested}
          onAttestedChange={setSignatureAttested}
          typedNameError={errorFor(state, "signedTypedName")}
          attestedError={errorFor(state, "signatureAttested")}
        />
      </FormSection>

      {state.error ? (
        <FormAlert variant="error">
          <span className="font-medium">{state.error}</span>
          {validationMessages.length > 0 ? (
            <ul className="mt-2 list-disc space-y-1 pl-5 font-normal">
              {validationMessages.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          ) : null}
        </FormAlert>
      ) : null}

      <Button type="submit" className="w-full sm:w-auto" disabled={isPending}>
        {isPending ? pendingLabel : submitLabel}
      </Button>
    </form>
  );
}

function FormSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="p-4 pb-0">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-4">{children}</CardContent>
    </Card>
  );
}

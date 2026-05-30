"use client";

import type { ReactNode } from "react";
import { useActionState, useMemo, useState } from "react";

import type { AppRecordFormState } from "@/app/(app)/app-records/actions";
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

type PesticideRow = {
  rowId: string;
  epaRegNumber: string;
  productName: string;
  activeIngredient: string;
  isSurfactant: boolean;
};

type AppRecordFormProps = {
  action: (state: AppRecordFormState, formData: FormData) => Promise<AppRecordFormState>;
  submitLabel?: string;
  pendingLabel?: string;
  defaultValues?: Partial<AppRecordFieldValues> & {
    targetVegetation?: string[];
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

function newPesticideRow(isSurfactant = false): PesticideRow {
  return {
    rowId: crypto.randomUUID(),
    epaRegNumber: "",
    productName: "",
    activeIngredient: "",
    isSurfactant,
  };
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
  defaultValues,
}: AppRecordFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [locationLat, setLocationLat] = useState(defaultValues?.locationLat ?? "");
  const [locationLng, setLocationLng] = useState(defaultValues?.locationLng ?? "");
  const [targetVegetation, setTargetVegetation] = useState<string[]>(defaultValues?.targetVegetation ?? []);
  const [pesticides, setPesticides] = useState<PesticideRow[]>(
    defaultValues?.pesticides?.length
      ? defaultValues.pesticides.map((row) => ({
          rowId: crypto.randomUUID(),
          epaRegNumber: row.epaRegNumber ?? "",
          productName: row.productName,
          activeIngredient: row.activeIngredient ?? "",
          isSurfactant: row.isSurfactant,
        }))
      : [newPesticideRow(false)],
  );
  const [totalGallons, setTotalGallons] = useState(defaultValues?.totalGallons ?? "");
  const [acresTreated, setAcresTreated] = useState(defaultValues?.acresTreated ?? "");

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

  function removePesticideRow(rowId: string) {
    setPesticides((current) => {
      if (current.length <= 1) return current;
      return current.filter((row) => row.rowId !== rowId);
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    const targetVegetationInput = form.elements.namedItem("targetVegetation") as HTMLInputElement;
    const pesticidesInput = form.elements.namedItem("pesticides") as HTMLInputElement;

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
  }

  return (
    <form action={formAction} onSubmit={handleSubmit} className="space-y-6">
      <input type="hidden" name="targetVegetation" defaultValue="[]" />
      <input type="hidden" name="pesticides" defaultValue="[]" />

      <FormSection title="Job Information">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="jobDate">Job date</Label>
            <Input
              id="jobDate"
              name="jobDate"
              type="date"
              defaultValue={defaultValues?.jobDate ?? ""}
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
              defaultValue={defaultValues?.applicatorName ?? ""}
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
              defaultValue={defaultValues?.customerName ?? ""}
              aria-invalid={Boolean(errorFor(state, "customerName"))}
              required
            />
            {errorFor(state, "customerName") ? (
              <p className="text-sm text-destructive">{errorFor(state, "customerName")}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="siteAddress">Site address (optional)</Label>
            <Input id="siteAddress" name="siteAddress" defaultValue={defaultValues?.siteAddress ?? ""} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="jobSiteId">Job / site ID (optional)</Label>
            <Input
              id="jobSiteId"
              name="jobSiteId"
              defaultValue={defaultValues?.jobSiteId ?? ""}
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
            <DecimalInput id="tempF" name="tempF" defaultValue={defaultValues?.tempF ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="windSpeedMph">Wind speed (mph)</Label>
            <DecimalInput id="windSpeedMph" name="windSpeedMph" defaultValue={defaultValues?.windSpeedMph ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="windDirection">Wind direction</Label>
            <Select id="windDirection" name="windDirection" defaultValue={defaultValues?.windDirection ?? ""}>
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
            <Select id="skyCondition" name="skyCondition" defaultValue={defaultValues?.skyCondition ?? ""}>
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
              defaultValue={defaultValues?.targetVegOther ?? ""}
              placeholder="Describe vegetation"
            />
          </div>
        ) : null}
        {errorFor(state, "targetVegetation") ? (
          <p className="text-sm text-destructive">{errorFor(state, "targetVegetation")}</p>
        ) : null}
      </FormSection>

      <FormSection title="Application Method">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {appMethodOptions.map((option) => (
            <Label key={option.value} className="flex min-h-11 items-center gap-3 rounded-md border px-3 py-2">
              <input
                type="radio"
                name="appMethod"
                value={option.value}
                defaultChecked={defaultValues?.appMethod === option.value}
                className="size-4"
              />
              {option.label}
            </Label>
          ))}
        </div>
      </FormSection>

      <FormSection title="Application Timing">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="startTime">Start time</Label>
            <Input id="startTime" name="startTime" type="time" defaultValue={defaultValues?.startTime ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endTime">End time</Label>
            <Input id="endTime" name="endTime" type="time" defaultValue={defaultValues?.endTime ?? ""} />
          </div>
        </div>
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
          {pesticides.map((row) => (
            <div
              key={row.rowId}
              className={`space-y-3 rounded-md border p-3 ${row.isSurfactant ? "bg-muted/30" : ""}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label className="flex min-h-11 items-center gap-3">
                  <Checkbox
                    checked={row.isSurfactant}
                    onChange={(e) => updatePesticideRow(row.rowId, "isSurfactant", e.target.checked)}
                  />
                  Surfactant / Adjuvant
                </Label>
                {pesticides.length > 1 ? (
                  <Button type="button" variant="ghost" size="sm" onClick={() => removePesticideRow(row.rowId)}>
                    Remove
                  </Button>
                ) : null}
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>EPA registration number</Label>
                  <Input
                    value={row.epaRegNumber}
                    onChange={(e) => updatePesticideRow(row.rowId, "epaRegNumber", e.target.value)}
                    disabled={row.isSurfactant}
                    placeholder={row.isSurfactant ? "Not required for surfactants" : "1234-567"}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Product name</Label>
                  <Input
                    value={row.productName}
                    onChange={(e) => updatePesticideRow(row.rowId, "productName", e.target.value)}
                    required
                  />
                </div>
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
          ))}
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
              defaultValue={defaultValues?.gallonsPerAcre ?? ""}
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
              defaultValue={defaultValues?.tankMixRecord ?? ""}
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
            defaultValue={defaultValues?.equipmentNotes ?? ""}
            placeholder="e.g. DJI T-50 ID N#11347, DJI T-50 ID N#425AT"
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="truckId">Truck ID</Label>
            <Input id="truckId" name="truckId" defaultValue={defaultValues?.truckId ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nozzleType">Nozzle type</Label>
            <Input id="nozzleType" name="nozzleType" defaultValue={defaultValues?.nozzleType ?? ""} />
          </div>
        </div>
      </FormSection>

      <FormSection title="Safety & Re-Entry">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="rei">REI</Label>
            <Input id="rei" name="rei" defaultValue={defaultValues?.rei ?? ""} placeholder="e.g. 48 hours" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="safeReentryDate">Safe re-entry date</Label>
            <Input
              id="safeReentryDate"
              name="safeReentryDate"
              type="date"
              defaultValue={defaultValues?.safeReentryDate ?? ""}
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
            defaultValue={defaultValues?.additionalNotes ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="certAttested" className="flex items-start gap-3">
            <input type="hidden" name="certAttested" value="false" />
            <Checkbox
              id="certAttested"
              name="certAttested"
              value="true"
              defaultChecked={defaultValues?.certAttested ?? false}
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
              defaultValue={defaultValues?.applicatorSig ?? ""}
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
              defaultValue={defaultValues?.licenseCertNo ?? ""}
            />
          </div>
        </div>
      </FormSection>

      {state.error ? <FormAlert variant="error">{state.error}</FormAlert> : null}

      <Button type="submit" disabled={isPending}>
        {isPending ? pendingLabel : submitLabel}
      </Button>
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

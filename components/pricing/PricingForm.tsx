"use client";

import { useActionState, useState } from "react";

import type { PricingFormState } from "@/app/(app)/pricing/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DecimalInput } from "@/components/ui/decimal-input";
import { FormAlert } from "@/components/ui/form-alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const initialState: PricingFormState = { error: null };

type SpecialRate = {
  rowId: string;
  name: string;
  rate: string;
  unit: "per_acre" | "per_hour" | "flat" | "other";
  notes: string;
};

type PricingFormDefaultValues = {
  aerialRatePerAcre: number | null;
  minimumJobFee: number | null;
  travelFeePerMile: number | null;
  setupFee: number | null;
  productMarkupPct: number | null;
  markupCap: number | null;
  paymentTerms: string | null;
  specialRates: Array<{ name: string; rate: number; unit: string; notes: string | null }>;
};

type PricingFormProps = {
  action: (state: PricingFormState, formData: FormData) => Promise<PricingFormState>;
  defaultValues?: PricingFormDefaultValues;
};

function newSpecialRate(): SpecialRate {
  return { rowId: crypto.randomUUID(), name: "", rate: "", unit: "per_acre", notes: "" };
}

const UNIT_LABELS: Record<SpecialRate["unit"], string> = {
  per_acre: "Per acre",
  per_hour: "Per hour",
  flat: "Flat fee",
  other: "Other",
};

export function PricingForm({ action, defaultValues }: PricingFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  const [specialRates, setSpecialRates] = useState<SpecialRate[]>(
    () =>
      defaultValues?.specialRates.map((r) => ({
        rowId: crypto.randomUUID(),
        name: r.name,
        rate: String(r.rate),
        unit: (r.unit as SpecialRate["unit"]) ?? "per_acre",
        notes: r.notes ?? "",
      })) ?? [],
  );

  function addSpecialRate() {
    setSpecialRates((prev) => [...prev, newSpecialRate()]);
  }

  function removeSpecialRate(rowId: string) {
    setSpecialRates((prev) => prev.filter((r) => r.rowId !== rowId));
  }

  function updateSpecialRate(
    rowId: string,
    field: keyof Omit<SpecialRate, "rowId">,
    value: string,
  ) {
    setSpecialRates((prev) => prev.map((r) => (r.rowId === rowId ? { ...r, [field]: value } : r)));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const form = e.currentTarget;
    const hidden = form.elements.namedItem("specialRates") as HTMLInputElement;
    hidden.value = JSON.stringify(
      specialRates.map(({ name, rate, unit, notes }) => ({
        name,
        rate: Number(rate),
        unit,
        notes: notes || undefined,
      })),
    );
  }

  return (
    <form action={formAction} onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      <input type="hidden" name="specialRates" defaultValue="[]" />

      <Card className="rounded-xl sm:rounded-lg">
        <CardHeader className="p-3 pb-2 sm:p-6 sm:pb-2">
          <CardTitle className="text-base">Service rates</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 p-3 pt-0 sm:gap-4 sm:p-6 sm:pt-0 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="aerialRatePerAcre">Aerial application rate (per acre)</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <DecimalInput
                id="aerialRatePerAcre"
                name="aerialRatePerAcre"
                className="pl-7"
                defaultValue={defaultValues?.aerialRatePerAcre ?? ""}
                placeholder="12.00"
              />
            </div>
            {state.fieldErrors?.aerialRatePerAcre ? (
              <p className="text-sm text-destructive">{state.fieldErrors.aerialRatePerAcre[0]}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="minimumJobFee">Minimum job fee</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <DecimalInput
                id="minimumJobFee"
                name="minimumJobFee"
                className="pl-7"
                defaultValue={defaultValues?.minimumJobFee ?? ""}
                placeholder="250.00"
              />
            </div>
            {state.fieldErrors?.minimumJobFee ? (
              <p className="text-sm text-destructive">{state.fieldErrors.minimumJobFee[0]}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="travelFeePerMile">Ferry / travel fee (per mile)</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <DecimalInput
                id="travelFeePerMile"
                name="travelFeePerMile"
                className="pl-7"
                defaultValue={defaultValues?.travelFeePerMile ?? ""}
                placeholder="2.50"
              />
            </div>
            {state.fieldErrors?.travelFeePerMile ? (
              <p className="text-sm text-destructive">{state.fieldErrors.travelFeePerMile[0]}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="setupFee">Setup / mobilization fee</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <DecimalInput
                id="setupFee"
                name="setupFee"
                className="pl-7"
                defaultValue={defaultValues?.setupFee ?? ""}
                placeholder="100.00"
              />
            </div>
            {state.fieldErrors?.setupFee ? (
              <p className="text-sm text-destructive">{state.fieldErrors.setupFee[0]}</p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl sm:rounded-lg">
        <CardHeader className="p-3 pb-2 sm:p-6 sm:pb-2">
          <CardTitle className="text-base">Product markup</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 p-3 pt-0 sm:gap-4 sm:p-6 sm:pt-0 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="productMarkupPct">Markup percentage</Label>
            <div className="relative">
              <DecimalInput
                id="productMarkupPct"
                name="productMarkupPct"
                className="pr-7"
                defaultValue={defaultValues?.productMarkupPct ?? ""}
                placeholder="15"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                %
              </span>
            </div>
            {state.fieldErrors?.productMarkupPct ? (
              <p className="text-sm text-destructive">{state.fieldErrors.productMarkupPct[0]}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="markupCap">Markup cap (optional)</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <DecimalInput
                id="markupCap"
                name="markupCap"
                className="pl-7"
                defaultValue={defaultValues?.markupCap ?? ""}
                placeholder="500.00"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Maximum markup charged per job, regardless of percentage.
            </p>
            {state.fieldErrors?.markupCap ? (
              <p className="text-sm text-destructive">{state.fieldErrors.markupCap[0]}</p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl sm:rounded-lg">
        <CardHeader className="flex flex-col gap-2 p-3 pb-2 sm:flex-row sm:items-center sm:justify-between sm:p-6 sm:pb-2">
          <CardTitle className="text-base">Special rates</CardTitle>
          <Button type="button" variant="outline" size="sm" className="w-full sm:w-auto" onClick={addSpecialRate}>
            + Add rate
          </Button>
        </CardHeader>
        <CardContent className="space-y-3 p-3 pt-0 sm:p-6 sm:pt-0">
          {specialRates.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No special rates added. Use this to track custom line items like spot treatments or
              re-application fees.
            </p>
          ) : (
            specialRates.map((row) => (
              <div
                key={row.rowId}
                className="grid gap-2 rounded-md border p-3 sm:grid-cols-[1fr_auto_auto_auto]"
              >
                <Input
                  placeholder="Service name"
                  value={row.name}
                  onChange={(e) => updateSpecialRate(row.rowId, "name", e.target.value)}
                />
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <Input
                    className="w-full pl-7 sm:w-28"
                    placeholder="0.00"
                    value={row.rate}
                    onChange={(e) => updateSpecialRate(row.rowId, "rate", e.target.value)}
                    inputMode="decimal"
                  />
                </div>
                <Select
                  value={row.unit}
                  onChange={(e) =>
                    updateSpecialRate(row.rowId, "unit", e.target.value as SpecialRate["unit"])
                  }
                  className="w-full sm:w-32"
                >
                  {(Object.entries(UNIT_LABELS) as [SpecialRate["unit"], string][]).map(
                    ([val, label]) => (
                      <option key={val} value={val}>
                        {label}
                      </option>
                    ),
                  )}
                </Select>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full justify-center sm:w-auto"
                  onClick={() => removeSpecialRate(row.rowId)}
                >
                  Remove
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="rounded-xl sm:rounded-lg">
        <CardHeader className="p-3 pb-2 sm:p-6 sm:pb-2">
          <CardTitle className="text-base">Payment terms &amp; notes</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
          <Textarea
            id="paymentTerms"
            name="paymentTerms"
            defaultValue={defaultValues?.paymentTerms ?? ""}
            placeholder="e.g. Net 30. 50% deposit required before scheduling. Cash, check, or ACH accepted."
            rows={4}
          />
          {state.fieldErrors?.paymentTerms ? (
            <p className="mt-1 text-sm text-destructive">{state.fieldErrors.paymentTerms[0]}</p>
          ) : null}
        </CardContent>
      </Card>

      {state.error ? <FormAlert variant="error">{state.error}</FormAlert> : null}
      {state.success ? <FormAlert variant="success">Pricing saved.</FormAlert> : null}

      <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
        {isPending ? "Saving..." : "Save pricing"}
      </Button>
    </form>
  );
}

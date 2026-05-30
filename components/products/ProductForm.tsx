"use client";

import { useActionState } from "react";

import type { ProductFormState } from "@/app/(app)/products/actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DecimalInput } from "@/components/ui/decimal-input";
import { FormAlert } from "@/components/ui/form-alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const initialState: ProductFormState = { error: null };

type ProductFormValues = {
  name: string;
  manufacturer: string | null;
  epaNumber: string | null;
  labelMinRate: number | null;
  labelMaxRate: number | null;
  rateUnit: "oz" | "fl_oz" | "gal" | "lb" | null;
  active: boolean;
  notes: string | null;
};

type ProductFormProps = {
  action: (state: ProductFormState, formData: FormData) => Promise<ProductFormState>;
  submitLabel: string;
  pendingLabel: string;
  defaultValues?: ProductFormValues;
};

function errorFor(state: ProductFormState, field: keyof ProductFormValues) {
  return state.fieldErrors?.[field]?.[0] ?? null;
}

export function ProductForm({
  action,
  submitLabel,
  pendingLabel,
  defaultValues,
}: ProductFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          defaultValue={defaultValues?.name}
          aria-invalid={Boolean(errorFor(state, "name"))}
          placeholder="Aerial Max 4L"
          required
        />
        {errorFor(state, "name") ? (
          <p className="text-sm text-destructive">{errorFor(state, "name")}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="manufacturer">Manufacturer</Label>
        <Input
          id="manufacturer"
          name="manufacturer"
          defaultValue={defaultValues?.manufacturer ?? ""}
          aria-invalid={Boolean(errorFor(state, "manufacturer"))}
          placeholder="Example Ag Chemicals"
        />
        {errorFor(state, "manufacturer") ? (
          <p className="text-sm text-destructive">{errorFor(state, "manufacturer")}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="epaNumber">EPA Number</Label>
        <Input
          id="epaNumber"
          name="epaNumber"
          defaultValue={defaultValues?.epaNumber ?? ""}
          aria-invalid={Boolean(errorFor(state, "epaNumber"))}
          placeholder="1234-56"
        />
        {errorFor(state, "epaNumber") ? (
          <p className="text-sm text-destructive">{errorFor(state, "epaNumber")}</p>
        ) : null}
      </div>

      <section className="space-y-3 rounded-md border border-border/80 p-4">
        <h2 className="text-sm font-medium">Label rate range</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="labelMinRate">Label minimum rate</Label>
            <DecimalInput
              id="labelMinRate"
              name="labelMinRate"
              type="text"
              inputMode="decimal"
              defaultValue={defaultValues?.labelMinRate ?? ""}
              aria-invalid={Boolean(errorFor(state, "labelMinRate"))}
              placeholder="28"
            />
            {errorFor(state, "labelMinRate") ? (
              <p className="text-sm text-destructive">{errorFor(state, "labelMinRate")}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="labelMaxRate">Label maximum rate</Label>
            <DecimalInput
              id="labelMaxRate"
              name="labelMaxRate"
              type="text"
              inputMode="decimal"
              defaultValue={defaultValues?.labelMaxRate ?? ""}
              aria-invalid={Boolean(errorFor(state, "labelMaxRate"))}
              placeholder="32"
            />
            {errorFor(state, "labelMaxRate") ? (
              <p className="text-sm text-destructive">{errorFor(state, "labelMaxRate")}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="rateUnit">Rate unit</Label>
            <Select
              id="rateUnit"
              name="rateUnit"
              defaultValue={defaultValues?.rateUnit ?? ""}
              aria-invalid={Boolean(errorFor(state, "rateUnit"))}
            >
              <option value="">No rate unit selected</option>
              <option value="oz">oz</option>
              <option value="fl_oz">fl oz</option>
              <option value="gal">gal</option>
              <option value="lb">lb</option>
            </Select>
            {errorFor(state, "rateUnit") ? (
              <p className="text-sm text-destructive">{errorFor(state, "rateUnit")}</p>
            ) : null}
          </div>
        </div>
      </section>

      <div className="space-y-2">
        <Label htmlFor="active" className="flex min-h-11 items-center gap-3">
          <input type="hidden" name="active" value="false" />
          <Checkbox
            id="active"
            name="active"
            value="true"
            defaultChecked={defaultValues?.active ?? true}
          />
          Active
        </Label>
        {errorFor(state, "active") ? (
          <p className="text-sm text-destructive">{errorFor(state, "active")}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={defaultValues?.notes ?? ""}
          aria-invalid={Boolean(errorFor(state, "notes"))}
        />
        {errorFor(state, "notes") ? (
          <p className="text-sm text-destructive">{errorFor(state, "notes")}</p>
        ) : null}
      </div>

      {state.error ? (
        <FormAlert variant="error">
          {state.error}
        </FormAlert>
      ) : null}

      <Button type="submit" disabled={isPending}>
        {isPending ? pendingLabel : submitLabel}
      </Button>
    </form>
  );
}

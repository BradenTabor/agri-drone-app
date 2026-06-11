"use client";

import { useActionState } from "react";

import type { SurfactantFormState } from "@/app/(app)/products/surfactants/actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DecimalInput } from "@/components/ui/decimal-input";
import { FormAlert } from "@/components/ui/form-alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const initialState: SurfactantFormState = { error: null };

type SurfactantFormValues = {
  name: string;
  manufacturer: string | null;
  epaNumber: string | null;
  defaultUnit: "oz" | "fl_oz" | "gal" | "%" | null;
  unitCost: number | null;
  costUnit: "gal" | "oz" | "fl_oz" | "lb" | null;
  active: boolean;
  notes: string | null;
};

type SurfactantFormProps = {
  action: (state: SurfactantFormState, formData: FormData) => Promise<SurfactantFormState>;
  submitLabel: string;
  pendingLabel: string;
  defaultValues?: SurfactantFormValues;
};

function errorFor(state: SurfactantFormState, field: keyof SurfactantFormValues) {
  return state.fieldErrors?.[field]?.[0] ?? null;
}

export function SurfactantForm({
  action,
  submitLabel,
  pendingLabel,
  defaultValues,
}: SurfactantFormProps) {
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
          placeholder="Non-Ionic Spreader"
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

      <div className="space-y-2">
        <Label htmlFor="defaultUnit">Default unit</Label>
        <Select
          id="defaultUnit"
          name="defaultUnit"
          defaultValue={defaultValues?.defaultUnit ?? ""}
          aria-label="Default unit"
        >
          <option value="">None</option>
          <option value="oz">oz</option>
          <option value="fl_oz">fl oz</option>
          <option value="gal">gal</option>
          <option value="%">%</option>
        </Select>
        <p className="text-xs text-muted-foreground">
          Pre-selects the unit when this surfactant is chosen in mix records.
        </p>
        {errorFor(state, "defaultUnit") ? (
          <p className="text-sm text-destructive">{errorFor(state, "defaultUnit")}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="unitCost">Product cost</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              $
            </span>
            <DecimalInput
              id="unitCost"
              name="unitCost"
              className="pl-7"
              defaultValue={defaultValues?.unitCost ?? ""}
              placeholder="0.00"
              aria-invalid={Boolean(errorFor(state, "unitCost"))}
            />
          </div>
          <Select
            name="costUnit"
            defaultValue={defaultValues?.costUnit ?? ""}
            className="w-28"
            aria-label="Cost unit"
          >
            <option value="">Unit</option>
            <option value="gal">per gal</option>
            <option value="oz">per oz</option>
            <option value="fl_oz">per fl oz</option>
            <option value="lb">per lb</option>
          </Select>
        </div>
        {errorFor(state, "unitCost") ? (
          <p className="text-sm text-destructive">{errorFor(state, "unitCost")}</p>
        ) : null}
      </div>

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

      {state.error ? <FormAlert variant="error">{state.error}</FormAlert> : null}

      <Button type="submit" disabled={isPending}>
        {isPending ? pendingLabel : submitLabel}
      </Button>
    </form>
  );
}

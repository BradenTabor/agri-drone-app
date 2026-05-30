"use client";

import { useActionState } from "react";

import { DmsDecimalInput } from "@/components/fields/DmsDecimalInput";
import { Button } from "@/components/ui/button";
import { DecimalInput } from "@/components/ui/decimal-input";
import { FormAlert } from "@/components/ui/form-alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { FieldFormState } from "@/app/(app)/customers/[id]/fields/actions";

const initialState: FieldFormState = { error: null };

type FieldFormValues = {
  name: string;
  defaultLat: number | null;
  defaultLng: number | null;
  acres: number | null;
  notes: string | null;
};

type FieldFormProps = {
  action: (state: FieldFormState, formData: FormData) => Promise<FieldFormState>;
  submitLabel: string;
  pendingLabel: string;
  defaultValues?: FieldFormValues;
};

function errorFor(state: FieldFormState, field: keyof FieldFormValues) {
  return state.fieldErrors?.[field]?.[0] ?? null;
}

export function FieldForm({
  action,
  submitLabel,
  pendingLabel,
  defaultValues,
}: FieldFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">
          Field Name
        </Label>
        <Input
          id="name"
          name="name"
          defaultValue={defaultValues?.name}
          aria-invalid={Boolean(errorFor(state, "name"))}
          required
        />
        {errorFor(state, "name") ? (
          <p className="text-sm text-destructive">{errorFor(state, "name")}</p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <DmsDecimalInput
          name="defaultLat"
          label="Default Latitude"
          axis="lat"
          defaultValue={defaultValues?.defaultLat}
          error={errorFor(state, "defaultLat")}
        />

        <DmsDecimalInput
          name="defaultLng"
          label="Default Longitude"
          axis="lng"
          defaultValue={defaultValues?.defaultLng}
          error={errorFor(state, "defaultLng")}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="acres">
          Acres
        </Label>
        <DecimalInput
          id="acres"
          name="acres"
          defaultValue={defaultValues?.acres?.toString() ?? ""}
          aria-invalid={Boolean(errorFor(state, "acres"))}
        />
        {errorFor(state, "acres") ? (
          <p className="text-sm text-destructive">{errorFor(state, "acres")}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">
          Notes
        </Label>
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

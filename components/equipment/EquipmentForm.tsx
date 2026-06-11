"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormAlert } from "@/components/ui/form-alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { EquipmentFormState } from "@/app/(app)/equipment/actions";

const initialState: EquipmentFormState = { error: null };

const SUGGESTED_EQUIPMENT_TYPES = ["Truck", "Sprayer", "Drone"] as const;

type EquipmentFormValues = {
  identifier: string;
  type: string | null;
  active: boolean;
  notes: string | null;
};

type EquipmentFormProps = {
  action: (
    state: EquipmentFormState,
    formData: FormData,
  ) => Promise<EquipmentFormState>;
  submitLabel: string;
  pendingLabel: string;
  defaultValues?: EquipmentFormValues;
};

function errorFor(state: EquipmentFormState, field: keyof EquipmentFormValues) {
  return state.fieldErrors?.[field]?.[0] ?? null;
}

export function EquipmentForm({
  action,
  submitLabel,
  pendingLabel,
  defaultValues,
}: EquipmentFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="identifier">
          Identifier
        </Label>
        <Input
          id="identifier"
          name="identifier"
          defaultValue={defaultValues?.identifier}
          aria-invalid={Boolean(errorFor(state, "identifier"))}
          placeholder="Truck #1"
          required
        />
        {errorFor(state, "identifier") ? (
          <p className="text-sm text-destructive">{errorFor(state, "identifier")}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">
          Type
        </Label>
        <Input
          id="type"
          name="type"
          list="equipment-type-suggestions"
          defaultValue={defaultValues?.type ?? ""}
          aria-invalid={Boolean(errorFor(state, "type"))}
          placeholder="Truck, Sprayer, Drone, or enter your own"
          autoComplete="off"
        />
        <datalist id="equipment-type-suggestions">
          {SUGGESTED_EQUIPMENT_TYPES.map((type) => (
            <option key={type} value={type} />
          ))}
        </datalist>
        <p className="text-sm text-muted-foreground">
          Pick a common type from the list or type a custom equipment category.
        </p>
        {errorFor(state, "type") ? (
          <p className="text-sm text-destructive">{errorFor(state, "type")}</p>
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

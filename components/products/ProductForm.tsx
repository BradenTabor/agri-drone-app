"use client";

import { useActionState } from "react";

import type { ProductFormState } from "@/app/(app)/products/actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormAlert } from "@/components/ui/form-alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState: ProductFormState = { error: null };

type ProductFormValues = {
  name: string;
  manufacturer: string | null;
  epaNumber: string | null;
  restrictedUse: boolean;
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

      <div className="space-y-2">
        <Label htmlFor="restrictedUse" className="flex min-h-11 items-center gap-3">
          <input type="hidden" name="restrictedUse" value="false" />
          <Checkbox
            id="restrictedUse"
            name="restrictedUse"
            value="true"
            defaultChecked={defaultValues?.restrictedUse ?? false}
          />
          Restricted Use Pesticide (RUP)
        </Label>
        <p className="pl-7 text-sm text-muted-foreground">
          Restricted Use Pesticides require a certified applicator license to purchase and apply.
        </p>
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

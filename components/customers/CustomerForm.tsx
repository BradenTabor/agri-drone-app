"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import type { CustomerFormState } from "@/app/(app)/customers/actions";

const initialState: CustomerFormState = { error: null };

type CustomerFormValues = {
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  notes: string | null;
};

type CustomerFormProps = {
  action: (
    state: CustomerFormState,
    formData: FormData,
  ) => Promise<CustomerFormState>;
  submitLabel: string;
  pendingLabel: string;
  defaultValues?: CustomerFormValues;
};

function errorFor(state: CustomerFormState, field: keyof CustomerFormValues) {
  return state.fieldErrors?.[field]?.[0] ?? null;
}

export function CustomerForm({
  action,
  submitLabel,
  pendingLabel,
  defaultValues,
}: CustomerFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">
          Customer Name
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

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contactName">
            Contact Name
          </Label>
          <Input
            id="contactName"
            name="contactName"
            defaultValue={defaultValues?.contactName ?? ""}
            aria-invalid={Boolean(errorFor(state, "contactName"))}
          />
          {errorFor(state, "contactName") ? (
            <p className="text-sm text-destructive">
              {errorFor(state, "contactName")}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">
            Email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={defaultValues?.email ?? ""}
            aria-invalid={Boolean(errorFor(state, "email"))}
          />
          {errorFor(state, "email") ? (
            <p className="text-sm text-destructive">{errorFor(state, "email")}</p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2 sm:col-span-1">
          <Label htmlFor="phone">
            Phone
          </Label>
          <Input
            id="phone"
            name="phone"
            defaultValue={defaultValues?.phone ?? ""}
            aria-invalid={Boolean(errorFor(state, "phone"))}
          />
          {errorFor(state, "phone") ? (
            <p className="text-sm text-destructive">{errorFor(state, "phone")}</p>
          ) : null}
        </div>
        <div className="space-y-2 sm:col-span-1">
          <Label htmlFor="city">
            City
          </Label>
          <Input
            id="city"
            name="city"
            defaultValue={defaultValues?.city ?? ""}
            aria-invalid={Boolean(errorFor(state, "city"))}
          />
          {errorFor(state, "city") ? (
            <p className="text-sm text-destructive">{errorFor(state, "city")}</p>
          ) : null}
        </div>
        <div className="space-y-2 sm:col-span-1">
          <Label htmlFor="state">
            State
          </Label>
          <Input
            id="state"
            name="state"
            defaultValue={defaultValues?.state ?? ""}
            aria-invalid={Boolean(errorFor(state, "state"))}
          />
          {errorFor(state, "state") ? (
            <p className="text-sm text-destructive">{errorFor(state, "state")}</p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="space-y-2 sm:col-span-3">
          <Label htmlFor="address">
            Address
          </Label>
          <Input
            id="address"
            name="address"
            defaultValue={defaultValues?.address ?? ""}
            aria-invalid={Boolean(errorFor(state, "address"))}
          />
          {errorFor(state, "address") ? (
            <p className="text-sm text-destructive">{errorFor(state, "address")}</p>
          ) : null}
        </div>
        <div className="space-y-2 sm:col-span-1">
          <Label htmlFor="zip">
            ZIP
          </Label>
          <Input
            id="zip"
            name="zip"
            defaultValue={defaultValues?.zip ?? ""}
            aria-invalid={Boolean(errorFor(state, "zip"))}
          />
          {errorFor(state, "zip") ? (
            <p className="text-sm text-destructive">{errorFor(state, "zip")}</p>
          ) : null}
        </div>
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

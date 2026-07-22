"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProfileFormState } from "@/app/(app)/profile/actions";

const initialState: ProfileFormState = { error: null };

type ProfileFormValues = {
  fullName: string | null;
  licenseCertNo: string | null;
  phone: string | null;
};

type ProfileFormProps = {
  action: (
    state: ProfileFormState,
    formData: FormData,
  ) => Promise<ProfileFormState>;
  email: string;
  defaultValues?: ProfileFormValues;
};

function errorFor(state: ProfileFormState, field: keyof ProfileFormValues) {
  return state.fieldErrors?.[field]?.[0] ?? null;
}

export function ProfileForm({ action, email, defaultValues }: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label>Email</Label>
        <p className="text-sm text-muted-foreground">{email || "—"}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="fullName">Full name</Label>
        <Input
          id="fullName"
          name="fullName"
          defaultValue={defaultValues?.fullName ?? ""}
          aria-invalid={Boolean(errorFor(state, "fullName"))}
          placeholder="Jane Doe"
          autoComplete="name"
        />
        {errorFor(state, "fullName") ? (
          <p className="text-sm text-destructive">{errorFor(state, "fullName")}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="licenseCertNo">License / cert #</Label>
        <Input
          id="licenseCertNo"
          name="licenseCertNo"
          defaultValue={defaultValues?.licenseCertNo ?? ""}
          aria-invalid={Boolean(errorFor(state, "licenseCertNo"))}
          placeholder="TX-123456"
          autoComplete="off"
        />
        <p className="text-sm text-muted-foreground">
          Used to auto-fill the applicator license on new mix records.
        </p>
        {errorFor(state, "licenseCertNo") ? (
          <p className="text-sm text-destructive">{errorFor(state, "licenseCertNo")}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={defaultValues?.phone ?? ""}
          aria-invalid={Boolean(errorFor(state, "phone"))}
          placeholder="(512) 555-0100"
          autoComplete="tel"
        />
        {errorFor(state, "phone") ? (
          <p className="text-sm text-destructive">{errorFor(state, "phone")}</p>
        ) : null}
      </div>

      {state.error ? <FormAlert variant="error">{state.error}</FormAlert> : null}
      {state.success ? <FormAlert variant="success">Profile saved.</FormAlert> : null}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}

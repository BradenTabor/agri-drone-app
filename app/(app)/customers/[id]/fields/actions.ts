"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  fieldCreateSchema,
  fieldUpdateSchema,
  type FieldCreateInput,
} from "@/lib/validation/schemas";
import { createClient } from "@/lib/supabase/server";

type FieldErrors = Partial<Record<keyof FieldCreateInput, string[]>>;

export type FieldFormState = {
  error: string | null;
  fieldErrors?: FieldErrors;
};

function extractFieldFormData(formData: FormData) {
  return {
    name: String(formData.get("name") ?? ""),
    defaultLat: String(formData.get("defaultLat") ?? ""),
    defaultLng: String(formData.get("defaultLng") ?? ""),
    acres: String(formData.get("acres") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  };
}

function normalizeFieldInput(input: FieldCreateInput) {
  return {
    name: input.name,
    default_lat: input.defaultLat ?? null,
    default_lng: input.defaultLng ?? null,
    acres: input.acres ?? null,
    notes: input.notes ?? null,
  };
}

async function assertParentCustomerExists(customerId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .select("id")
    .eq("id", customerId)
    .is("deleted_at", null)
    .single();

  return { exists: Boolean(data) && !error };
}

export async function createFieldAction(
  customerId: string,
  _previousState: FieldFormState,
  formData: FormData,
): Promise<FieldFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Your session expired. Please sign in again." };
  }

  const { exists } = await assertParentCustomerExists(customerId);
  if (!exists) {
    redirect("/customers");
  }

  const parsed = fieldCreateSchema.safeParse(extractFieldFormData(formData));
  if (!parsed.success) {
    return {
      error: "Please correct the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const payload = normalizeFieldInput(parsed.data);
  const { data, error } = await supabase
    .from("fields")
    .insert({
      ...payload,
      customer_id: customerId,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: "Unable to create field. Please try again." };
  }

  revalidatePath(`/customers/${customerId}`);
  redirect(`/customers/${customerId}`);
}

export async function updateFieldAction(
  customerId: string,
  fieldId: string,
  _previousState: FieldFormState,
  formData: FormData,
): Promise<FieldFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Your session expired. Please sign in again." };
  }

  const { exists } = await assertParentCustomerExists(customerId);
  if (!exists) {
    redirect("/customers");
  }

  const parsed = fieldUpdateSchema.safeParse(extractFieldFormData(formData));
  if (!parsed.success) {
    return {
      error: "Please correct the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const payload = normalizeFieldInput(parsed.data);
  const { data, error } = await supabase
    .from("fields")
    .update(payload)
    .eq("id", fieldId)
    .eq("customer_id", customerId)
    .is("deleted_at", null)
    .select("id")
    .single();

  if (error || !data) {
    return { error: "Unable to update field. Please try again." };
  }

  revalidatePath(`/customers/${customerId}`);
  redirect(`/customers/${customerId}`);
}

export async function softDeleteFieldAction(
  customerId: string,
  fieldId: string,
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { exists } = await assertParentCustomerExists(customerId);
  if (!exists) {
    redirect("/customers");
  }

  const { error } = await supabase
    .from("fields")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", fieldId)
    .eq("customer_id", customerId)
    .is("deleted_at", null);

  if (error) {
    throw new Error("Unable to delete field.");
  }

  revalidatePath(`/customers/${customerId}`);
  redirect(`/customers/${customerId}`);
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  customerCreateSchema,
  customerUpdateSchema,
  type CustomerCreateInput,
} from "@/lib/validation/schemas";
import { createClient } from "@/lib/supabase/server";

type CustomerFieldErrors = Partial<Record<keyof CustomerCreateInput, string[]>>;

export type CustomerFormState = {
  error: string | null;
  fieldErrors?: CustomerFieldErrors;
};

function normalizeCustomerInput(input: CustomerCreateInput) {
  return {
    name: input.name,
    contact_name: input.contactName ?? null,
    email: input.email ?? null,
    phone: input.phone ?? null,
    address: input.address ?? null,
    city: input.city ?? null,
    state: input.state ?? null,
    zip: input.zip ?? null,
    notes: input.notes ?? null,
  };
}

function extractCustomerFormData(formData: FormData) {
  return {
    name: String(formData.get("name") ?? ""),
    contactName: String(formData.get("contactName") ?? ""),
    email: String(formData.get("email") ?? "").toLowerCase(),
    phone: String(formData.get("phone") ?? ""),
    address: String(formData.get("address") ?? ""),
    city: String(formData.get("city") ?? ""),
    state: String(formData.get("state") ?? ""),
    zip: String(formData.get("zip") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  };
}

export async function createCustomerAction(
  _previousState: CustomerFormState,
  formData: FormData,
): Promise<CustomerFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Your session expired. Please sign in again." };
  }

  const parsed = customerCreateSchema.safeParse(extractCustomerFormData(formData));
  if (!parsed.success) {
    return {
      error: "Please correct the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const payload = normalizeCustomerInput(parsed.data);
  const { data, error } = await supabase
    .from("customers")
    .insert({
      ...payload,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: "Unable to create customer. Please try again." };
  }

  revalidatePath("/customers");
  redirect(`/customers/${data.id}`);
}

export async function updateCustomerAction(
  customerId: string,
  _previousState: CustomerFormState,
  formData: FormData,
): Promise<CustomerFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Your session expired. Please sign in again." };
  }

  const parsed = customerUpdateSchema.safeParse(extractCustomerFormData(formData));
  if (!parsed.success) {
    return {
      error: "Please correct the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const payload = normalizeCustomerInput(parsed.data);
  const { data, error } = await supabase
    .from("customers")
    .update(payload)
    .eq("id", customerId)
    .is("deleted_at", null)
    .select("id")
    .single();

  if (error || !data) {
    return { error: "Unable to update customer. Please try again." };
  }

  revalidatePath("/customers");
  revalidatePath(`/customers/${customerId}`);
  redirect(`/customers/${customerId}`);
}

export async function softDeleteCustomerAction(customerId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase
    .from("customers")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", customerId)
    .is("deleted_at", null);

  if (error) {
    throw new Error("Unable to delete customer.");
  }

  revalidatePath("/customers");
  redirect("/customers");
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  surfactantCreateSchema,
  surfactantUpdateSchema,
  type SurfactantCreateInput,
} from "@/lib/validation/schemas";
import { checkboxValue } from "@/lib/form-data";
import { createClient } from "@/lib/supabase/server";

type SurfactantFieldErrors = Partial<Record<keyof SurfactantCreateInput, string[]>>;

export type SurfactantFormState = {
  error: string | null;
  fieldErrors?: SurfactantFieldErrors;
};

function extractSurfactantFormData(formData: FormData) {
  return {
    name: String(formData.get("name") ?? ""),
    manufacturer: String(formData.get("manufacturer") ?? ""),
    epaNumber: String(formData.get("epaNumber") ?? ""),
    defaultUnit: String(formData.get("defaultUnit") ?? ""),
    unitCost: String(formData.get("unitCost") ?? ""),
    costUnit: String(formData.get("costUnit") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    active: checkboxValue(formData, "active"),
  };
}

function normalizeSurfactantInput(input: SurfactantCreateInput) {
  return {
    name: input.name,
    manufacturer: input.manufacturer ?? null,
    epa_number: input.epaNumber ?? null,
    default_unit: input.defaultUnit ?? null,
    unit_cost: input.unitCost ?? null,
    cost_unit: input.costUnit ?? null,
    notes: input.notes ?? null,
    active: input.active,
  };
}

export async function createSurfactantAction(
  _previousState: SurfactantFormState,
  formData: FormData,
): Promise<SurfactantFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Your session expired. Please sign in again." };
  }

  const parsed = surfactantCreateSchema.safeParse(extractSurfactantFormData(formData));
  if (!parsed.success) {
    return {
      error: "Please correct the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { error } = await supabase.from("surfactants").insert(normalizeSurfactantInput(parsed.data));

  if (error) {
    return { error: "Unable to create surfactant. Please try again." };
  }

  revalidatePath("/products");
  redirect("/products?tab=surfactants");
}

export async function updateSurfactantAction(
  surfactantId: string,
  _previousState: SurfactantFormState,
  formData: FormData,
): Promise<SurfactantFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Your session expired. Please sign in again." };
  }

  const parsed = surfactantUpdateSchema.safeParse(extractSurfactantFormData(formData));
  if (!parsed.success) {
    return {
      error: "Please correct the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { data, error } = await supabase
    .from("surfactants")
    .update(normalizeSurfactantInput(parsed.data))
    .eq("id", surfactantId)
    .is("deleted_at", null)
    .select("id")
    .single();

  if (error || !data) {
    return { error: "Unable to update surfactant. Please try again." };
  }

  revalidatePath("/products");
  redirect("/products?tab=surfactants");
}

export async function softDeleteSurfactantAction(surfactantId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase
    .from("surfactants")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", surfactantId)
    .is("deleted_at", null);

  if (error) {
    throw new Error("Unable to delete surfactant.");
  }

  revalidatePath("/products");
  redirect("/products?tab=surfactants");
}

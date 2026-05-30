"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  equipmentCreateSchema,
  equipmentUpdateSchema,
  type EquipmentCreateInput,
} from "@/lib/validation/schemas";
import { checkboxValue } from "@/lib/form-data";
import { createClient } from "@/lib/supabase/server";

type EquipmentFieldErrors = Partial<Record<keyof EquipmentCreateInput, string[]>>;

export type EquipmentFormState = {
  error: string | null;
  fieldErrors?: EquipmentFieldErrors;
};

function extractEquipmentFormData(formData: FormData) {
  return {
    identifier: String(formData.get("identifier") ?? ""),
    type: String(formData.get("type") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    active: checkboxValue(formData, "active"),
  };
}

function normalizeEquipmentInput(input: EquipmentCreateInput) {
  return {
    identifier: input.identifier,
    type: input.type ?? null,
    notes: input.notes ?? null,
    active: input.active,
  };
}

export async function createEquipmentAction(
  _previousState: EquipmentFormState,
  formData: FormData,
): Promise<EquipmentFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Your session expired. Please sign in again." };
  }

  const parsed = equipmentCreateSchema.safeParse(extractEquipmentFormData(formData));
  if (!parsed.success) {
    return {
      error: "Please correct the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { error } = await supabase.from("equipment").insert(normalizeEquipmentInput(parsed.data));

  if (error) {
    return { error: "Unable to create equipment. Please try again." };
  }

  revalidatePath("/equipment");
  redirect("/equipment");
}

export async function updateEquipmentAction(
  equipmentId: string,
  _previousState: EquipmentFormState,
  formData: FormData,
): Promise<EquipmentFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Your session expired. Please sign in again." };
  }

  const parsed = equipmentUpdateSchema.safeParse(extractEquipmentFormData(formData));
  if (!parsed.success) {
    return {
      error: "Please correct the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { data, error } = await supabase
    .from("equipment")
    .update(normalizeEquipmentInput(parsed.data))
    .eq("id", equipmentId)
    .is("deleted_at", null)
    .select("id")
    .single();

  if (error || !data) {
    return { error: "Unable to update equipment. Please try again." };
  }

  revalidatePath("/equipment");
  redirect("/equipment");
}

export async function softDeleteEquipmentAction(equipmentId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase
    .from("equipment")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", equipmentId)
    .is("deleted_at", null);

  if (error) {
    throw new Error("Unable to delete equipment.");
  }

  revalidatePath("/equipment");
  redirect("/equipment");
}

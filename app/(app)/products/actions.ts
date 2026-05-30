"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  productCreateSchema,
  productUpdateSchema,
  type ProductCreateInput,
} from "@/lib/validation/schemas";
import { checkboxValue } from "@/lib/form-data";
import { createClient } from "@/lib/supabase/server";

type ProductFieldErrors = Partial<Record<keyof ProductCreateInput, string[]>>;

export type ProductFormState = {
  error: string | null;
  fieldErrors?: ProductFieldErrors;
};

function extractProductFormData(formData: FormData) {
  return {
    name: String(formData.get("name") ?? ""),
    manufacturer: String(formData.get("manufacturer") ?? ""),
    epaNumber: String(formData.get("epaNumber") ?? ""),
    labelMinRate: String(formData.get("labelMinRate") ?? ""),
    labelMaxRate: String(formData.get("labelMaxRate") ?? ""),
    rateUnit: String(formData.get("rateUnit") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    active: checkboxValue(formData, "active"),
  };
}

function normalizeProductInput(input: ProductCreateInput) {
  return {
    name: input.name,
    manufacturer: input.manufacturer ?? null,
    epa_number: input.epaNumber ?? null,
    label_min_rate: input.labelMinRate ?? null,
    label_max_rate: input.labelMaxRate ?? null,
    rate_unit: input.rateUnit ?? null,
    notes: input.notes ?? null,
    active: input.active,
  };
}

export async function createProductAction(
  _previousState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Your session expired. Please sign in again." };
  }

  const parsed = productCreateSchema.safeParse(extractProductFormData(formData));
  if (!parsed.success) {
    return {
      error: "Please correct the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { error } = await supabase.from("products").insert(normalizeProductInput(parsed.data));

  if (error) {
    return { error: "Unable to create product. Please try again." };
  }

  revalidatePath("/products");
  redirect("/products");
}

export async function updateProductAction(
  productId: string,
  _previousState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Your session expired. Please sign in again." };
  }

  const parsed = productUpdateSchema.safeParse(extractProductFormData(formData));
  if (!parsed.success) {
    return {
      error: "Please correct the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { data, error } = await supabase
    .from("products")
    .update(normalizeProductInput(parsed.data))
    .eq("id", productId)
    .is("deleted_at", null)
    .select("id")
    .single();

  if (error || !data) {
    return { error: "Unable to update product. Please try again." };
  }

  revalidatePath("/products");
  redirect("/products");
}

export async function softDeleteProductAction(productId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase
    .from("products")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", productId)
    .is("deleted_at", null);

  if (error) {
    throw new Error("Unable to delete product.");
  }

  revalidatePath("/products");
  redirect("/products");
}

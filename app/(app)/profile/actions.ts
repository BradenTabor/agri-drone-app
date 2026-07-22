"use server";

import { revalidatePath } from "next/cache";

import {
  profileUpdateSchema,
  type ProfileUpdateInput,
} from "@/lib/validation/schemas";
import { createClient } from "@/lib/supabase/server";

type ProfileFieldErrors = Partial<Record<keyof ProfileUpdateInput, string[]>>;

export type ProfileFormState = {
  error: string | null;
  fieldErrors?: ProfileFieldErrors;
  success?: boolean;
};

export async function updateProfileAction(
  _previousState: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Your session expired. Please sign in again." };
  }

  const parsed = profileUpdateSchema.safeParse({
    fullName: String(formData.get("fullName") ?? ""),
    licenseCertNo: String(formData.get("licenseCertNo") ?? ""),
    phone: String(formData.get("phone") ?? ""),
  });

  if (!parsed.success) {
    return {
      error: "Please correct the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName ?? null,
      license_cert_no: parsed.data.licenseCertNo ?? null,
      phone: parsed.data.phone ?? null,
    })
    .eq("id", user.id)
    .select("id")
    .single();

  if (error) {
    return { error: "Unable to save your profile. Please try again." };
  }

  revalidatePath("/profile");
  revalidatePath("/records/new");
  return { error: null, success: true };
}

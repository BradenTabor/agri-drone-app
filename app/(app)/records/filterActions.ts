"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export async function saveRecordFilterAction(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const name = String(formData.get("savedFilterName") ?? "").trim();
  if (!name) {
    return;
  }

  const filters = {
    q: String(formData.get("q") ?? ""),
    dateFrom: String(formData.get("dateFrom") ?? ""),
    dateTo: String(formData.get("dateTo") ?? ""),
    customerId: String(formData.get("customerId") ?? ""),
    applicatorId: String(formData.get("applicatorId") ?? ""),
    productId: String(formData.get("productId") ?? ""),
  };

  const { error } = await supabase.from("saved_filters").insert({
    user_id: user.id,
    name,
    filters,
  });
  if (error) {
    throw new Error("Unable to save filter.");
  }

  revalidatePath("/records");
}

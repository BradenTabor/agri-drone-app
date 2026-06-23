"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  normalizeAppRecordPayload,
  normalizePesticidesForRpc,
} from "@/lib/app-records/normalize";
import {
  mapMixRow,
  MIX_RECORD_ATTACH_SELECT,
  type AttachableMixRecord,
} from "@/lib/app-records/mixAttach";
import { checkboxValue } from "@/lib/form-data";
import {
  appRecordCreateSchema,
  appRecordUpdateSchema,
  type AppRecordCreateInput,
} from "@/lib/validation/schemas";
import { createClient } from "@/lib/supabase/server";

type AppRecordFieldErrors = Partial<Record<keyof AppRecordCreateInput, string[]>>;

export type AppRecordFormState = {
  error: string | null;
  fieldErrors?: AppRecordFieldErrors;
};

function extractAppRecordFormData(formData: FormData) {
  return {
    jobDate: String(formData.get("jobDate") ?? ""),
    applicatorName: String(formData.get("applicatorName") ?? ""),
    customerName: String(formData.get("customerName") ?? ""),
    siteAddress: String(formData.get("siteAddress") ?? ""),
    jobSiteId: String(formData.get("jobSiteId") ?? ""),
    locationLat: String(formData.get("locationLat") ?? ""),
    locationLng: String(formData.get("locationLng") ?? ""),
    tempF: String(formData.get("tempF") ?? ""),
    windSpeedMph: String(formData.get("windSpeedMph") ?? ""),
    windDirection: String(formData.get("windDirection") ?? ""),
    skyCondition: String(formData.get("skyCondition") ?? ""),
    targetVegetation: JSON.parse(String(formData.get("targetVegetation") ?? "[]")),
    targetVegOther: String(formData.get("targetVegOther") ?? ""),
    appMethod: String(formData.get("appMethod") ?? ""),
    appType: String(formData.get("appType") ?? ""),
    startTime: String(formData.get("startTime") ?? ""),
    endTime: String(formData.get("endTime") ?? ""),
    totalGallons: String(formData.get("totalGallons") ?? ""),
    gallonsPerAcre: String(formData.get("gallonsPerAcre") ?? ""),
    acresTreated: String(formData.get("acresTreated") ?? ""),
    tankMixRecord: String(formData.get("tankMixRecord") ?? ""),
    equipmentNotes: String(formData.get("equipmentNotes") ?? ""),
    truckId: String(formData.get("truckId") ?? ""),
    nozzleType: String(formData.get("nozzleType") ?? ""),
    rei: String(formData.get("rei") ?? ""),
    safeReentryDate: String(formData.get("safeReentryDate") ?? ""),
    additionalNotes: String(formData.get("additionalNotes") ?? ""),
    certAttested: checkboxValue(formData, "certAttested"),
    applicatorSig: String(formData.get("applicatorSig") ?? ""),
    licenseCertNo: String(formData.get("licenseCertNo") ?? ""),
    pesticides: JSON.parse(String(formData.get("pesticides") ?? "[]")),
    mixRecordIds: JSON.parse(String(formData.get("mixRecordIds") ?? "[]")),
  };
}

function rpcErrorMessage(error: { message: string } | null): string | null {
  if (!error) return null;
  if (error.message.includes("already attached")) {
    return error.message;
  }
  if (error.message.includes("no longer exist")) {
    return error.message;
  }
  return null;
}

export async function createAppRecordAction(
  _previousState: AppRecordFormState,
  formData: FormData,
): Promise<AppRecordFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired. Please sign in again." };

  const parsed = appRecordCreateSchema.safeParse(extractAppRecordFormData(formData));
  if (!parsed.success) {
    return {
      error: "Please correct the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors as AppRecordFieldErrors,
    };
  }

  const d = parsed.data;
  const { data: recordId, error } = await supabase.rpc("create_app_record_with_children", {
    p_record: normalizeAppRecordPayload(d),
    p_pesticides: normalizePesticidesForRpc(d.pesticides),
    p_mix_record_ids: d.mixRecordIds,
  });

  const specificError = rpcErrorMessage(error);
  if (specificError) return { error: specificError };
  if (error || !recordId) return { error: "Unable to create record. Please try again." };

  revalidatePath("/app-records");
  redirect(`/app-records/${recordId}`);
}

export async function updateAppRecordAction(
  recordId: string,
  _previousState: AppRecordFormState,
  formData: FormData,
): Promise<AppRecordFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired. Please sign in again." };

  const parsed = appRecordUpdateSchema.safeParse(extractAppRecordFormData(formData));
  if (!parsed.success) {
    return {
      error: "Please correct the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors as AppRecordFieldErrors,
    };
  }

  const d = parsed.data;
  const { error } = await supabase.rpc("update_app_record_with_children", {
    p_record_id: recordId,
    p_record: normalizeAppRecordPayload(d),
    p_pesticides: normalizePesticidesForRpc(d.pesticides),
    p_mix_record_ids: d.mixRecordIds,
  });

  const specificError = rpcErrorMessage(error);
  if (specificError) return { error: specificError };
  if (error) return { error: "Unable to update record. Please try again." };

  revalidatePath("/app-records");
  redirect(`/app-records/${recordId}`);
}

export async function searchAttachableMixRecords(
  search: string,
  currentAppRecordId: string | null,
): Promise<AttachableMixRecord[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  let takenQuery = supabase.from("app_record_mix_records").select("mix_record_id");
  if (currentAppRecordId) {
    takenQuery = takenQuery.neq("app_record_id", currentAppRecordId);
  }
  const { data: takenRows, error: takenError } = await takenQuery;
  if (takenError) {
    throw new Error("Unable to load attached mix records.");
  }

  const taken = (takenRows ?? []).map((row) => row.mix_record_id);

  let mixQuery = supabase
    .from("mix_records")
    .select(MIX_RECORD_ATTACH_SELECT)
    .is("deleted_at", null)
    .is("mix_record_products.deleted_at", null)
    .order("record_date", { ascending: false })
    .order("time_mixed", { ascending: false })
    .order("sort_order", { referencedTable: "mix_record_products", ascending: true })
    .limit(25);

  if (taken.length > 0) {
    mixQuery = mixQuery.not("id", "in", `(${taken.join(",")})`);
  }

  const sanitized = search.replace(/[,()]/g, " ").trim();
  if (sanitized) {
    mixQuery = mixQuery.or(
      `customer_name_snapshot.ilike.%${sanitized}%,field_name_snapshot.ilike.%${sanitized}%`,
    );
  }

  const { data: rows, error: mixError } = await mixQuery;
  if (mixError) {
    throw new Error("Unable to search mix records.");
  }

  return (rows ?? []).map((row) => mapMixRow(row as Parameters<typeof mapMixRow>[0]));
}

export async function loadAttachedMixRecords(mixRecordIds: string[]): Promise<AttachableMixRecord[]> {
  if (mixRecordIds.length === 0) return [];

  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("mix_records")
    .select(MIX_RECORD_ATTACH_SELECT)
    .in("id", mixRecordIds)
    .is("deleted_at", null)
    .is("mix_record_products.deleted_at", null)
    .order("sort_order", { referencedTable: "mix_record_products", ascending: true });

  if (error) {
    throw new Error("Unable to load attached mix records.");
  }

  const byId = new Map(
    (rows ?? []).map((row) => [row.id, mapMixRow(row as Parameters<typeof mapMixRow>[0])]),
  );
  return mixRecordIds.flatMap((id) => {
    const mix = byId.get(id);
    return mix ? [mix] : [];
  });
}

export async function softDeleteAppRecordAction(recordId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("app_records")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", recordId)
    .is("deleted_at", null);

  revalidatePath("/app-records");
  redirect("/app-records");
}

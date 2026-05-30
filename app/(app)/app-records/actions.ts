"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  appRecordCreateSchema,
  appRecordUpdateSchema,
  type AppRecordCreateInput,
} from "@/lib/validation/schemas";
import { checkboxValue } from "@/lib/form-data";
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
  };
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
  const { data: record, error: recordError } = await supabase
    .from("app_records")
    .insert({
      job_date: d.jobDate,
      applicator_name: d.applicatorName,
      customer_name: d.customerName,
      site_address: d.siteAddress ?? null,
      job_site_id: d.jobSiteId ?? null,
      location_lat: d.locationLat ?? null,
      location_lng: d.locationLng ?? null,
      temp_f: d.tempF ?? null,
      wind_speed_mph: d.windSpeedMph ?? null,
      wind_direction: d.windDirection ?? null,
      sky_condition: d.skyCondition ?? null,
      target_vegetation: d.targetVegetation,
      target_veg_other: d.targetVegOther ?? null,
      app_method: d.appMethod ?? null,
      start_time: d.startTime || null,
      end_time: d.endTime || null,
      total_gallons: d.totalGallons ?? null,
      gallons_per_acre: d.gallonsPerAcre ?? null,
      acres_treated: d.acresTreated ?? null,
      tank_mix_record: d.tankMixRecord ?? null,
      equipment_notes: d.equipmentNotes ?? null,
      truck_id: d.truckId ?? null,
      nozzle_type: d.nozzleType ?? null,
      rei: d.rei ?? null,
      safe_reentry_date: d.safeReentryDate || null,
      additional_notes: d.additionalNotes ?? null,
      cert_attested: d.certAttested,
      applicator_sig: d.applicatorSig,
      license_cert_no: d.licenseCertNo ?? null,
      submitted_by: user.id,
    })
    .select("id")
    .single();

  if (recordError || !record) return { error: "Unable to create record. Please try again." };

  if (d.pesticides.length > 0) {
    const { error: pesticideError } = await supabase.from("app_record_pesticides").insert(
      d.pesticides.map((p, i) => ({
        app_record_id: record.id,
        sort_order: i,
        is_surfactant: p.isSurfactant,
        epa_reg_number: p.epaRegNumber ?? null,
        product_name: p.productName,
        active_ingredient: p.activeIngredient ?? null,
      })),
    );
    if (pesticideError) return { error: "Record created but failed to save products. Please edit to fix." };
  }

  revalidatePath("/app-records");
  redirect(`/app-records/${record.id}`);
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
  const { error: updateError } = await supabase
    .from("app_records")
    .update({
      job_date: d.jobDate,
      applicator_name: d.applicatorName,
      customer_name: d.customerName,
      site_address: d.siteAddress ?? null,
      job_site_id: d.jobSiteId ?? null,
      location_lat: d.locationLat ?? null,
      location_lng: d.locationLng ?? null,
      temp_f: d.tempF ?? null,
      wind_speed_mph: d.windSpeedMph ?? null,
      wind_direction: d.windDirection ?? null,
      sky_condition: d.skyCondition ?? null,
      target_vegetation: d.targetVegetation,
      target_veg_other: d.targetVegOther ?? null,
      app_method: d.appMethod ?? null,
      start_time: d.startTime || null,
      end_time: d.endTime || null,
      total_gallons: d.totalGallons ?? null,
      gallons_per_acre: d.gallonsPerAcre ?? null,
      acres_treated: d.acresTreated ?? null,
      tank_mix_record: d.tankMixRecord ?? null,
      equipment_notes: d.equipmentNotes ?? null,
      truck_id: d.truckId ?? null,
      nozzle_type: d.nozzleType ?? null,
      rei: d.rei ?? null,
      safe_reentry_date: d.safeReentryDate || null,
      additional_notes: d.additionalNotes ?? null,
      cert_attested: d.certAttested,
      applicator_sig: d.applicatorSig,
      license_cert_no: d.licenseCertNo ?? null,
      last_modified_by: user.id,
      last_modified_at: new Date().toISOString(),
    })
    .eq("id", recordId)
    .is("deleted_at", null);

  if (updateError) return { error: "Unable to update record. Please try again." };

  await supabase.from("app_record_pesticides").delete().eq("app_record_id", recordId);
  if (d.pesticides.length > 0) {
    await supabase.from("app_record_pesticides").insert(
      d.pesticides.map((p, i) => ({
        app_record_id: recordId,
        sort_order: i,
        is_surfactant: p.isSurfactant,
        epa_reg_number: p.epaRegNumber ?? null,
        product_name: p.productName,
        active_ingredient: p.activeIngredient ?? null,
      })),
    );
  }

  revalidatePath("/app-records");
  redirect(`/app-records/${recordId}`);
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

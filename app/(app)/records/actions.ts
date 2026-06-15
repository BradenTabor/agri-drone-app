"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  mixRecordCreateSchema,
  mixRecordUpdateSchema,
  type MixRecordCreateInput,
  type MixRecordProductLineInput,
} from "@/lib/validation/schemas";
import { checkboxValue } from "@/lib/form-data";
import { createClient } from "@/lib/supabase/server";

type MixRecordFieldErrors = Partial<Record<keyof MixRecordCreateInput, string[]>>;

export type MixRecordFormState = {
  error: string | null;
  fieldErrors?: MixRecordFieldErrors;
};

const PHOTO_BUCKET = "mix-record-photos";
const MAX_PHOTO_COUNT = 8;
const MAX_PHOTO_BYTES = 15 * 1024 * 1024;

function sanitizeExtension(value: string): string {
  const cleaned = value.toLowerCase().replace(/[^a-z0-9]/g, "");
  return cleaned || "jpg";
}

function inferFileExtension(file: File): string {
  const nameParts = file.name.split(".");
  const fromName = nameParts.length > 1 ? sanitizeExtension(nameParts[nameParts.length - 1]) : "";
  if (fromName) return fromName;

  const mimeParts = file.type.split("/");
  const fromMime = mimeParts.length > 1 ? sanitizeExtension(mimeParts[1]) : "";
  return fromMime || "jpg";
}

function extractPhotoFiles(formData: FormData): File[] {
  return formData
    .getAll("photos")
    .filter((value): value is File => value instanceof File)
    .filter((file) => file.size > 0 && file.name.trim() !== "");
}

function extractRemovePhotoIds(formData: FormData): string[] {
  return formData.getAll("removePhotoIds").map(String).filter(Boolean);
}

function validatePhotoFiles(photos: File[]): string | null {
  if (photos.length > MAX_PHOTO_COUNT) {
    return `Please upload ${MAX_PHOTO_COUNT} photos or fewer.`;
  }
  if (photos.some((photo) => photo.size > MAX_PHOTO_BYTES)) {
    return "Each photo must be 15MB or smaller.";
  }
  if (photos.some((photo) => !photo.type.startsWith("image/"))) {
    return "Only image file uploads are supported.";
  }
  return null;
}

function parseProductLines(raw: string): MixRecordProductLineInput[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function extractMixRecordFormData(formData: FormData) {
  const productLines = parseProductLines(String(formData.get("productLinesJson") ?? "[]")).map(
    (line, index) => ({
      ...line,
      sortOrder: index,
    }),
  );

  return {
    recordDate: String(formData.get("recordDate") ?? ""),
    timeMixed: String(formData.get("timeMixed") ?? ""),
    applicatorId: String(formData.get("applicatorId") ?? ""),
    applicatorNameOverride: String(formData.get("applicatorNameOverride") ?? ""),
    licenseCertNo: String(formData.get("licenseCertNo") ?? ""),
    equipmentId: String(formData.get("equipmentId") ?? ""),
    customerId: String(formData.get("customerId") ?? ""),
    fieldId: String(formData.get("fieldId") ?? ""),
    mixLat: String(formData.get("mixLat") ?? ""),
    mixLng: String(formData.get("mixLng") ?? ""),
    tankSizeGal: String(formData.get("tankSizeGal") ?? ""),
    targetGpa: String(formData.get("targetGpa") ?? ""),
    waterGal: String(formData.get("waterGal") ?? ""),
    surfactantName: String(formData.get("surfactantName") ?? ""),
    surfactantAmount: String(formData.get("surfactantAmount") ?? ""),
    surfactantUnit: String(formData.get("surfactantUnit") ?? ""),
    totalMixGal: String(formData.get("totalMixGal") ?? ""),
    expectedAcres: String(formData.get("expectedAcres") ?? ""),
    actualAcres: String(formData.get("actualAcres") ?? ""),
    windSpeedMph: String(formData.get("windSpeedMph") ?? ""),
    windDirection: String(formData.get("windDirection") ?? ""),
    tempF: String(formData.get("tempF") ?? ""),
    humidityPct: String(formData.get("humidityPct") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    signedTypedName: String(formData.get("signedTypedName") ?? ""),
    signatureAttested: checkboxValue(formData, "signatureAttested"),
    productLines,
  };
}

function normalizeMixRecordPayload(input: MixRecordCreateInput) {
  return {
    record_date: input.recordDate,
    time_mixed: input.timeMixed,
    applicator_id: input.applicatorId ?? null,
    applicator_name_override: input.applicatorNameOverride ?? null,
    license_cert_no: input.licenseCertNo ?? null,
    equipment_id: input.equipmentId ?? null,
    customer_id: input.customerId,
    field_id: input.fieldId,
    mix_lat: input.mixLat,
    mix_lng: input.mixLng,
    tank_size_gal: input.tankSizeGal,
    target_gpa: input.targetGpa,
    water_gal: input.waterGal,
    surfactant_name: input.surfactantName ?? null,
    surfactant_amount: input.surfactantAmount ?? null,
    surfactant_unit: input.surfactantUnit ?? null,
    total_mix_gal: input.totalMixGal,
    expected_acres: input.expectedAcres,
    actual_acres: input.actualAcres ?? null,
    wind_speed_mph: input.windSpeedMph,
    wind_direction: input.windDirection,
    temp_f: input.tempF ?? null,
    humidity_pct: input.humidityPct ?? null,
    notes: input.notes ?? null,
    signed_typed_name: input.signedTypedName,
    signature_attested: input.signatureAttested,
  };
}

function normalizeProductLinesForRpc(lines: MixRecordProductLineInput[]) {
  return lines.map((line, index) => ({
    product_id: line.productId ?? null,
    amount_added: line.amountAdded,
    amount_unit: line.amountUnit,
    rate_per_acre: line.ratePerAcre ?? null,
    rate_unit: line.rateUnit ?? null,
    sort_order: index,
  }));
}

function formatMixRecordRpcError(message: string): string {
  if (message.includes("does not belong to customer")) {
    return "Selected field does not belong to the chosen customer. Please reselect the field.";
  }
  if (message.includes("Invalid customer_id") || message.includes("Invalid field_id")) {
    return "Customer or field is no longer valid. Refresh the page and try again.";
  }
  return "Unable to save mix record. Please try again.";
}

async function validateFieldBelongsToCustomer(args: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  customerId: string;
  fieldId: string;
}): Promise<MixRecordFormState | null> {
  const { supabase, customerId, fieldId } = args;
  const { data: field, error } = await supabase
    .from("fields")
    .select("id,customer_id")
    .eq("id", fieldId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    console.error("[validateFieldBelongsToCustomer] Unable to verify field:", error);
    return { error: "Unable to verify the selected field. Please try again." };
  }

  if (!field) {
    return {
      error: "Selected field was not found. Choose another field.",
      fieldErrors: { fieldId: ["Field is required."] },
    };
  }

  if (field.customer_id !== customerId) {
    return {
      error: "Selected field does not belong to the chosen customer. Please reselect the field.",
      fieldErrors: { fieldId: ["Field must belong to the selected customer."] },
    };
  }

  return null;
}

async function uploadPhotosForRecord(args: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  recordId: string;
  photos: File[];
}): Promise<{ uploadedPaths: string[]; error: string | null }> {
  const { supabase, recordId, photos } = args;
  const uploadedPaths: string[] = [];

  for (const photo of photos) {
    const extension = inferFileExtension(photo);
    const storagePath = `${recordId}/${crypto.randomUUID()}.${extension}`;
    const bytes = new Uint8Array(await photo.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from(PHOTO_BUCKET)
      .upload(storagePath, bytes, {
        contentType: photo.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      if (uploadedPaths.length) {
        await supabase.storage.from(PHOTO_BUCKET).remove(uploadedPaths);
      }
      return { uploadedPaths, error: "Unable to upload one or more photos." };
    }

    uploadedPaths.push(storagePath);
  }

  if (!uploadedPaths.length) {
    return { uploadedPaths, error: null };
  }

  const { error: insertError } = await supabase.from("mix_record_photos").insert(
    uploadedPaths.map((storagePath) => ({
      mix_record_id: recordId,
      storage_path: storagePath,
      caption: null,
    })),
  );

  if (insertError) {
    await supabase.storage.from(PHOTO_BUCKET).remove(uploadedPaths);
    return { uploadedPaths, error: "Photos uploaded, but database records failed." };
  }

  return { uploadedPaths, error: null };
}

export async function createMixRecordAction(
  _previousState: MixRecordFormState,
  formData: FormData,
): Promise<MixRecordFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Your session expired. Please sign in again." };
  }
  const photos = extractPhotoFiles(formData);
  const photoValidationError = validatePhotoFiles(photos);
  if (photoValidationError) {
    return { error: photoValidationError };
  }

  const parsed = mixRecordCreateSchema.safeParse(extractMixRecordFormData(formData));
  if (!parsed.success) {
    return {
      error: "Please correct the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const fieldValidationError = await validateFieldBelongsToCustomer({
    supabase,
    customerId: parsed.data.customerId,
    fieldId: parsed.data.fieldId,
  });
  if (fieldValidationError) {
    return fieldValidationError;
  }

  const { data: insertedRecordId, error: recordError } = await supabase.rpc(
    "create_mix_record_with_lines",
    {
      p_record: normalizeMixRecordPayload(parsed.data),
      p_lines: normalizeProductLinesForRpc(parsed.data.productLines),
    },
  );

  if (recordError || !insertedRecordId) {
    const message = recordError?.message ?? "Unknown RPC error";
    console.error("[createMixRecordAction] RPC failed:", message);
    return { error: formatMixRecordRpcError(message) };
  }

  const photoResult = await uploadPhotosForRecord({
    supabase,
    recordId: insertedRecordId,
    photos,
  });
  if (photoResult.error) {
    return { error: `${photoResult.error} Mix record saved; open it from the list and retry uploads.` };
  }

  revalidatePath("/");
  revalidatePath("/records");
  redirect(`/records/${insertedRecordId}`);
}

export async function updateMixRecordAction(
  recordId: string,
  _previousState: MixRecordFormState,
  formData: FormData,
): Promise<MixRecordFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Your session expired. Please sign in again." };
  }
  const photos = extractPhotoFiles(formData);
  const photoValidationError = validatePhotoFiles(photos);
  if (photoValidationError) {
    return { error: photoValidationError };
  }
  const removePhotoIds = extractRemovePhotoIds(formData);

  const parsed = mixRecordUpdateSchema.safeParse(extractMixRecordFormData(formData));
  if (!parsed.success) {
    return {
      error: "Please correct the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const fieldValidationError = await validateFieldBelongsToCustomer({
    supabase,
    customerId: parsed.data.customerId,
    fieldId: parsed.data.fieldId,
  });
  if (fieldValidationError) {
    return fieldValidationError;
  }

  const { data: updated, error: updateError } = await supabase.rpc(
    "update_mix_record_with_lines",
    {
      p_record_id: recordId,
      p_record: normalizeMixRecordPayload(parsed.data),
      p_lines: normalizeProductLinesForRpc(parsed.data.productLines),
    },
  );

  if (updateError || !updated) {
    const message = updateError?.message ?? "Unknown RPC error";
    console.error("[updateMixRecordAction] RPC failed:", message);
    return { error: formatMixRecordRpcError(message) };
  }

  if (removePhotoIds.length) {
    const { data: removablePhotos, error: removablePhotosError } = await supabase
      .from("mix_record_photos")
      .select("id,storage_path")
      .eq("mix_record_id", recordId)
      .in("id", removePhotoIds)
      .is("deleted_at", null);

    if (removablePhotosError) {
      return { error: "Unable to remove selected photos." };
    }

    const paths = (removablePhotos ?? []).map((photo) => photo.storage_path);
    const { error: softDeletePhotoError } = await supabase
      .from("mix_record_photos")
      .update({ deleted_at: new Date().toISOString() })
      .eq("mix_record_id", recordId)
      .in("id", removePhotoIds)
      .is("deleted_at", null);

    if (softDeletePhotoError) {
      return { error: "Photo removal failed. Please retry." };
    }

    if (paths.length) {
      const { error: removeError } = await supabase.storage.from(PHOTO_BUCKET).remove(paths);
      if (removeError) {
        console.error("[updateMixRecordAction] Orphaned storage objects after row soft-delete:", {
          recordId,
          paths,
          error: removeError,
        });
        return { error: "Photos hidden, but file cleanup failed. Files will be reclaimed later." };
      }
    }
  }

  const photoResult = await uploadPhotosForRecord({
    supabase,
    recordId,
    photos,
  });
  if (photoResult.error) {
    return { error: `${photoResult.error} Mix record saved; open it from the detail page and retry uploads.` };
  }

  revalidatePath("/");
  revalidatePath("/records");
  revalidatePath(`/records/${recordId}`);
  redirect(`/records/${recordId}`);
}

export async function softDeleteMixRecordAction(recordId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase
    .from("mix_records")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", recordId)
    .is("deleted_at", null);

  if (error) {
    throw new Error("Unable to delete mix record.");
  }

  revalidatePath("/");
  revalidatePath("/records");
  redirect("/records");
}

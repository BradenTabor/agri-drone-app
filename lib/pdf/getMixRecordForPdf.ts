import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

export type MixRecordPdfData = {
  record: {
    id: string;
    record_date: string;
    time_mixed: string;
    customer_name_snapshot: string | null;
    field_name_snapshot: string | null;
    applicator_name_override: string | null;
    applicator_display_name: string | null;
    license_cert_no: string | null;
    equipment_identifier: string | null;
    mix_lat: number;
    mix_lng: number;
    tank_size_gal: number;
    target_gpa: number;
    water_gal: number;
    surfactant_name: string | null;
    surfactant_amount: number | null;
    surfactant_unit: string | null;
    total_mix_gal: number;
    expected_acres: number;
    actual_acres: number | null;
    notes: string | null;
    signed_typed_name: string;
    signature_attested: boolean;
    submitted_at: string;
    submitted_by_name: string | null;
    last_modified_at: string | null;
    last_modified_by_name: string | null;
  };
  productLines: Array<{
    product_name: string | null;
    epa_number: string | null;
    amount_added: number;
    amount_unit: string;
    rate_per_acre: number | null;
    rate_unit: string | null;
  }>;
  photoCount: number;
};

type ProfileNameRow = {
  full_name: string | null;
  deleted_at?: string | null;
};

type ProductLookupRow = {
  name: string | null;
  epa_number: string | null;
  deleted_at?: string | null;
};

type MixRecordProductJoinRow = {
  amount_added: number;
  amount_unit: string;
  deleted_at: string | null;
  rate_per_acre: number | null;
  rate_unit: string | null;
  sort_order: number;
  products: ProductLookupRow | ProductLookupRow[] | null;
};

type MixRecordEquipmentJoinRow = {
  sort_order: number;
  equipment: { identifier: string } | { identifier: string }[] | null;
};

type MixRecordForPdfRow = {
  id: string;
  record_date: string;
  time_mixed: string;
  customer_name_snapshot: string | null;
  field_name_snapshot: string | null;
  applicator_name_override: string | null;
  license_cert_no: string | null;
  mix_lat: number;
  mix_lng: number;
  tank_size_gal: number;
  target_gpa: number;
  water_gal: number;
  surfactant_name: string | null;
  surfactant_amount: number | null;
  surfactant_unit: string | null;
  total_mix_gal: number;
  expected_acres: number;
  actual_acres: number | null;
  notes: string | null;
  signed_typed_name: string;
  signature_attested: boolean;
  submitted_at: string;
  last_modified_at: string | null;
  equipment: { identifier: string } | { identifier: string }[] | null;
  mix_record_equipment: MixRecordEquipmentJoinRow[] | null;
  applicator_profile: ProfileNameRow | ProfileNameRow[] | null;
  submitted_by_profile: ProfileNameRow | ProfileNameRow[] | null;
  last_modified_by_profile: ProfileNameRow | ProfileNameRow[] | null;
  mix_record_products: MixRecordProductJoinRow[] | null;
};

function asSingle<T>(value: T | T[] | null): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function getMixRecordForPdf(
  mixRecordId: string,
  supabase: SupabaseClient<Database>,
): Promise<MixRecordPdfData | null> {
  const { data: row, error: recordError } = await supabase
    .from("mix_records")
    .select(
      `
      id,
      record_date,
      time_mixed,
      customer_name_snapshot,
      field_name_snapshot,
      applicator_name_override,
      license_cert_no,
      mix_lat,
      mix_lng,
      tank_size_gal,
      target_gpa,
      water_gal,
      surfactant_name,
      surfactant_amount,
      surfactant_unit,
      total_mix_gal,
      expected_acres,
      actual_acres,
      notes,
      signed_typed_name,
      signature_attested,
      submitted_at,
      last_modified_at,
      equipment:equipment!mix_records_equipment_id_fkey(identifier),
      mix_record_equipment!mix_record_equipment_mix_record_id_fkey(
        sort_order,
        equipment(identifier)
      ),
      applicator_profile:profiles!mix_records_applicator_id_fkey(full_name,deleted_at),
      submitted_by_profile:profiles!mix_records_submitted_by_fkey(full_name,deleted_at),
      last_modified_by_profile:profiles!mix_records_last_modified_by_fkey(full_name,deleted_at),
      mix_record_products!mix_record_products_mix_record_id_fkey(
        amount_added,
        amount_unit,
        deleted_at,
        rate_per_acre,
        rate_unit,
        sort_order,
        products(name,epa_number,deleted_at)
      )
    `,
    )
    .eq("id", mixRecordId)
    .is("deleted_at", null)
    .is("mix_record_products.deleted_at", null)
    .order("sort_order", { referencedTable: "mix_record_products", ascending: true })
    .order("sort_order", { referencedTable: "mix_record_equipment", ascending: true })
    .single();

  if (recordError) {
    if (recordError.code === "PGRST116") {
      return null;
    }
    throw new Error(`Unable to load mix record for PDF: ${recordError.message}`);
  }

  if (!row) {
    return null;
  }

  const { count: photoCount, error: photoCountError } = await supabase
    .from("mix_record_photos")
    .select("id", { count: "exact", head: true })
    .eq("mix_record_id", mixRecordId)
    .is("deleted_at", null);

  if (photoCountError) {
    throw new Error(`Unable to load mix record photo count: ${photoCountError.message}`);
  }

  // NOTE: keep MixRecordForPdfRow in sync with the select string above.
  // Supabase's generated types don't infer embedded relation shapes.
  const typedRow = row as unknown as MixRecordForPdfRow;
  const legacyEquipment = asSingle(typedRow.equipment);
  const linkedEquipmentLabels = (typedRow.mix_record_equipment ?? [])
    .map((link) => asSingle(link.equipment)?.identifier)
    .filter((label): label is string => Boolean(label));
  const equipmentIdentifier =
    linkedEquipmentLabels.length > 0
      ? linkedEquipmentLabels.join(", ")
      : (legacyEquipment?.identifier ?? null);
  const applicatorProfile = asSingle(typedRow.applicator_profile);
  const submittedByProfile = asSingle(typedRow.submitted_by_profile);
  const lastModifiedByProfile = asSingle(typedRow.last_modified_by_profile);
  const applicatorProfileName =
    applicatorProfile && !applicatorProfile.deleted_at ? applicatorProfile.full_name : null;

  const submittedByName =
    submittedByProfile && !submittedByProfile.deleted_at ? submittedByProfile.full_name : null;
  const lastModifiedByName =
    lastModifiedByProfile && !lastModifiedByProfile.deleted_at
      ? lastModifiedByProfile.full_name
      : null;

  const productLines = (typedRow.mix_record_products ?? [])
    .filter((line) => line.deleted_at === null)
    .map((line) => {
    const product = asSingle(line.products);
    const productName = product && !product.deleted_at ? product.name : null;
    const epaNumber = product && !product.deleted_at ? product.epa_number : null;

    return {
      product_name: productName,
      epa_number: epaNumber,
      amount_added: line.amount_added,
      amount_unit: line.amount_unit,
      rate_per_acre: line.rate_per_acre,
      rate_unit: line.rate_unit,
    };
    });

  return {
    record: {
      id: typedRow.id,
      record_date: typedRow.record_date,
      time_mixed: typedRow.time_mixed,
      customer_name_snapshot: typedRow.customer_name_snapshot,
      field_name_snapshot: typedRow.field_name_snapshot,
      applicator_name_override: typedRow.applicator_name_override,
      applicator_display_name: typedRow.applicator_name_override ?? applicatorProfileName,
      license_cert_no: typedRow.license_cert_no,
      equipment_identifier: equipmentIdentifier,
      mix_lat: typedRow.mix_lat,
      mix_lng: typedRow.mix_lng,
      tank_size_gal: typedRow.tank_size_gal,
      target_gpa: typedRow.target_gpa,
      water_gal: typedRow.water_gal,
      surfactant_name: typedRow.surfactant_name,
      surfactant_amount: typedRow.surfactant_amount,
      surfactant_unit: typedRow.surfactant_unit,
      total_mix_gal: typedRow.total_mix_gal,
      expected_acres: typedRow.expected_acres,
      actual_acres: typedRow.actual_acres,
      notes: typedRow.notes,
      signed_typed_name: typedRow.signed_typed_name,
      signature_attested: typedRow.signature_attested,
      submitted_at: typedRow.submitted_at,
      submitted_by_name: submittedByName,
      last_modified_at: typedRow.last_modified_at,
      last_modified_by_name: lastModifiedByName,
    },
    productLines,
    photoCount: photoCount ?? 0,
  };
}

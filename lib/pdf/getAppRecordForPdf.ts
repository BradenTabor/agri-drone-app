import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import { getMixRecordForPdf, type MixRecordPdfData } from "./getMixRecordForPdf";

export type AppRecordPdfData = {
  record: {
    id: string;
    job_date: string;
    applicator_name: string;
    customer_name: string;
    site_address: string | null;
    job_site_id: string | null;
    location_lat: number | null;
    location_lng: number | null;
    temp_f: number | null;
    temp_f_min: number | null;
    temp_f_max: number | null;
    wind_speed_mph: number | null;
    wind_speed_mph_min: number | null;
    wind_speed_mph_max: number | null;
    wind_direction: string | null;
    sky_condition: string | null;
    target_vegetation: string[];
    target_veg_other: string | null;
    app_method: string | null;
    app_type: string | null;
    start_time: string | null;
    end_time: string | null;
    total_gallons: number | null;
    gallons_per_acre: number | null;
    acres_treated: number | null;
    tank_mix_record: string | null;
    equipment_notes: string | null;
    equipment_id: string | null;
    truck_id: string | null;
    nozzle_type: string | null;
    rei: string | null;
    safe_reentry_date: string | null;
    additional_notes: string | null;
    cert_attested: boolean;
    applicator_sig: string | null;
    license_cert_no: string | null;
    submitted_at: string;
    submitted_by_name: string | null;
    last_modified_at: string | null;
    last_modified_by_name: string | null;
  };
  pesticides: Array<{
    is_surfactant: boolean;
    epa_reg_number: string | null;
    product_name: string;
    active_ingredient: string | null;
  }>;
  linkedMixRecords: Array<{
    record_date: string;
    customer_name: string | null;
    field_name: string | null;
  }>;
  /**
   * Full PDF data for each linked mix record, in link sort order. Used to embed
   * the complete mix record page(s) inside the application record PDF. Empty when
   * no (non-deleted) mix records are linked.
   */
  linkedMixRecordDocs: MixRecordPdfData[];
  fields: Array<{
    fieldName: string;
    lat: number | null;
    lng: number | null;
  }>;
};

type ProfileNameRow = {
  full_name: string | null;
  deleted_at?: string | null;
};

type LinkedMixRecordRow = {
  id: string;
  record_date: string;
  customer_name_snapshot: string | null;
  field_name_snapshot: string | null;
  deleted_at: string | null;
};

type MixRecordLinkRow = {
  sort_order: number;
  mix_records: LinkedMixRecordRow | LinkedMixRecordRow[] | null;
};

type AppRecordForPdfRow = {
  id: string;
  job_date: string;
  applicator_name: string;
  customer_name: string;
  site_address: string | null;
  job_site_id: string | null;
  location_lat: number | null;
  location_lng: number | null;
  temp_f: number | null;
  temp_f_min: number | null;
  temp_f_max: number | null;
  wind_speed_mph: number | null;
  wind_speed_mph_min: number | null;
  wind_speed_mph_max: number | null;
  wind_direction: string | null;
  sky_condition: string | null;
  target_vegetation: unknown;
  target_veg_other: string | null;
  app_method: string | null;
  app_type: string | null;
  start_time: string | null;
  end_time: string | null;
  total_gallons: number | null;
  gallons_per_acre: number | null;
  acres_treated: number | null;
  tank_mix_record: string | null;
  equipment_notes: string | null;
  equipment_id: string | null;
  truck_id: string | null;
  nozzle_type: string | null;
  rei: string | null;
  safe_reentry_date: string | null;
  additional_notes: string | null;
  cert_attested: boolean;
  applicator_sig: string | null;
  license_cert_no: string | null;
  submitted_at: string;
  last_modified_at: string | null;
  submitted_by_profile: ProfileNameRow | ProfileNameRow[] | null;
  last_modified_by_profile: ProfileNameRow | ProfileNameRow[] | null;
  app_record_pesticides: Array<{
    is_surfactant: boolean;
    epa_reg_number: string | null;
    product_name: string;
    active_ingredient: string | null;
    sort_order: number;
  }> | null;
  app_record_mix_records: MixRecordLinkRow[] | null;
};

function asSingle<T>(value: T | T[] | null): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function parseTargetVegetation(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export async function getAppRecordForPdf(
  appRecordId: string,
  supabase: SupabaseClient<Database>,
): Promise<AppRecordPdfData | null> {
  const { data: row, error: recordError } = await supabase
    .from("app_records")
    .select(
      `
      id,
      job_date,
      applicator_name,
      customer_name,
      site_address,
      job_site_id,
      location_lat,
      location_lng,
      temp_f,
      temp_f_min,
      temp_f_max,
      wind_speed_mph,
      wind_speed_mph_min,
      wind_speed_mph_max,
      wind_direction,
      sky_condition,
      target_vegetation,
      target_veg_other,
      app_method,
      app_type,
      start_time,
      end_time,
      total_gallons,
      gallons_per_acre,
      acres_treated,
      tank_mix_record,
      equipment_notes,
      equipment_id,
      truck_id,
      nozzle_type,
      rei,
      safe_reentry_date,
      additional_notes,
      cert_attested,
      applicator_sig,
      license_cert_no,
      submitted_at,
      last_modified_at,
      submitted_by_profile:profiles!app_records_submitted_by_fkey(full_name,deleted_at),
      last_modified_by_profile:profiles!app_records_last_modified_by_fkey(full_name,deleted_at),
      app_record_pesticides(
        is_surfactant,
        epa_reg_number,
        product_name,
        active_ingredient,
        sort_order
      ),
      app_record_mix_records(
        sort_order,
        mix_records(id,record_date,customer_name_snapshot,field_name_snapshot,deleted_at)
      )
    `,
    )
    .eq("id", appRecordId)
    .is("deleted_at", null)
    .order("sort_order", { referencedTable: "app_record_pesticides", ascending: true })
    .order("sort_order", { referencedTable: "app_record_mix_records", ascending: true })
    .single();

  if (recordError) {
    if (recordError.code === "PGRST116") {
      return null;
    }
    throw new Error(`Unable to load application record for PDF: ${recordError.message}`);
  }

  if (!row) {
    return null;
  }

  const typedRow = row as unknown as AppRecordForPdfRow;
  const submittedByProfile = asSingle(typedRow.submitted_by_profile);
  const lastModifiedByProfile = asSingle(typedRow.last_modified_by_profile);

  const submittedByName =
    submittedByProfile && !submittedByProfile.deleted_at ? submittedByProfile.full_name : null;
  const lastModifiedByName =
    lastModifiedByProfile && !lastModifiedByProfile.deleted_at
      ? lastModifiedByProfile.full_name
      : null;

  const pesticides = (typedRow.app_record_pesticides ?? []).map((line) => ({
    is_surfactant: line.is_surfactant,
    epa_reg_number: line.epa_reg_number,
    product_name: line.product_name,
    active_ingredient: line.active_ingredient,
  }));

  const linkedMixRecordRows = (typedRow.app_record_mix_records ?? [])
    .map((link) => asSingle(link.mix_records))
    .filter((mix): mix is LinkedMixRecordRow => mix != null && mix.deleted_at == null);

  const linkedMixRecords = linkedMixRecordRows.map((mix) => ({
    record_date: mix.record_date,
    customer_name: mix.customer_name_snapshot,
    field_name: mix.field_name_snapshot,
  }));

  // Load the full mix record(s) so their complete page(s) can be embedded in the
  // application record PDF. Reuses getMixRecordForPdf for a single source of truth.
  // Order is preserved (rows are already sorted by link sort_order); any record
  // soft-deleted between the join read and this load resolves to null and is dropped.
  const linkedMixRecordDocs = (
    await Promise.all(linkedMixRecordRows.map((mix) => getMixRecordForPdf(mix.id, supabase)))
  ).filter((doc): doc is MixRecordPdfData => doc != null);

  const { data: fieldRows, error: fieldsError } = await supabase
    .from("app_record_fields")
    .select("field_name_snapshot,location_lat,location_lng")
    .eq("app_record_id", appRecordId)
    .order("sort_order", { ascending: true });

  if (fieldsError) {
    throw new Error(`Unable to load application record fields for PDF: ${fieldsError.message}`);
  }

  const fields = (fieldRows ?? []).map((field) => ({
    fieldName: field.field_name_snapshot ?? "",
    lat: field.location_lat,
    lng: field.location_lng,
  }));

  return {
    record: {
      id: typedRow.id,
      job_date: typedRow.job_date,
      applicator_name: typedRow.applicator_name,
      customer_name: typedRow.customer_name,
      site_address: typedRow.site_address,
      job_site_id: typedRow.job_site_id,
      location_lat: typedRow.location_lat,
      location_lng: typedRow.location_lng,
      temp_f: typedRow.temp_f,
      temp_f_min: typedRow.temp_f_min,
      temp_f_max: typedRow.temp_f_max,
      wind_speed_mph: typedRow.wind_speed_mph,
      wind_speed_mph_min: typedRow.wind_speed_mph_min,
      wind_speed_mph_max: typedRow.wind_speed_mph_max,
      wind_direction: typedRow.wind_direction,
      sky_condition: typedRow.sky_condition,
      target_vegetation: parseTargetVegetation(typedRow.target_vegetation),
      target_veg_other: typedRow.target_veg_other,
      app_method: typedRow.app_method,
      app_type: typedRow.app_type,
      start_time: typedRow.start_time,
      end_time: typedRow.end_time,
      total_gallons: typedRow.total_gallons,
      gallons_per_acre: typedRow.gallons_per_acre,
      acres_treated: typedRow.acres_treated,
      tank_mix_record: typedRow.tank_mix_record,
      equipment_notes: typedRow.equipment_notes,
      equipment_id: typedRow.equipment_id,
      truck_id: typedRow.truck_id,
      nozzle_type: typedRow.nozzle_type,
      rei: typedRow.rei,
      safe_reentry_date: typedRow.safe_reentry_date,
      additional_notes: typedRow.additional_notes,
      cert_attested: typedRow.cert_attested,
      applicator_sig: typedRow.applicator_sig,
      license_cert_no: typedRow.license_cert_no,
      submitted_at: typedRow.submitted_at,
      submitted_by_name: submittedByName,
      last_modified_at: typedRow.last_modified_at,
      last_modified_by_name: lastModifiedByName,
    },
    pesticides,
    linkedMixRecords,
    linkedMixRecordDocs,
    fields,
  };
}

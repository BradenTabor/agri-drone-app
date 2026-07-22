import type { AppRecordCreateInput } from "@/lib/validation/schemas";

export function normalizeAppRecordPayload(d: AppRecordCreateInput) {
  return {
    job_date: d.jobDate,
    applicator_name: d.applicatorName,
    customer_name: d.customerName,
    customer_id: d.customerId ?? "",
    site_address: d.siteAddress ?? "",
    job_site_id: d.jobSiteId ?? "",
    location_lat: d.locationLat?.toString() ?? "",
    location_lng: d.locationLng?.toString() ?? "",
    // Keep legacy scalar columns in sync with min when only ranges are posted,
    // so older readers and edit fallbacks still see weather after save.
    temp_f: d.tempF?.toString() ?? d.tempFMin?.toString() ?? "",
    temp_f_min: d.tempFMin?.toString() ?? "",
    temp_f_max: d.tempFMax?.toString() ?? "",
    wind_speed_mph:
      d.windSpeedMph?.toString() ?? d.windSpeedMphMin?.toString() ?? "",
    wind_speed_mph_min: d.windSpeedMphMin?.toString() ?? "",
    wind_speed_mph_max: d.windSpeedMphMax?.toString() ?? "",
    wind_direction: d.windDirection ?? "",
    sky_condition: d.skyCondition ?? "",
    target_vegetation: d.targetVegetation,
    target_veg_other: d.targetVegOther ?? "",
    app_method: d.appMethod ?? "",
    app_type: d.appType ?? "",
    start_time: d.startTime ?? "",
    end_time: d.endTime ?? "",
    total_gallons: d.totalGallons?.toString() ?? "",
    gallons_per_acre: d.gallonsPerAcre?.toString() ?? "",
    acres_treated: d.acresTreated?.toString() ?? "",
    tank_mix_record: d.tankMixRecord ?? "",
    equipment_notes: d.equipmentNotes ?? "",
    equipment_id: d.equipmentId ?? "",
    truck_id: d.truckId ?? "",
    nozzle_type: d.nozzleType ?? "",
    rei: d.rei ?? "",
    safe_reentry_date: d.safeReentryDate ?? "",
    additional_notes: d.additionalNotes ?? "",
    cert_attested: d.certAttested,
    applicator_sig: d.applicatorSig,
    license_cert_no: d.licenseCertNo ?? "",
  };
}

export function normalizePesticidesForRpc(pesticides: AppRecordCreateInput["pesticides"]) {
  return pesticides.map((p, i) => ({
    sort_order: i,
    is_surfactant: p.isSurfactant,
    epa_reg_number: p.epaRegNumber ?? null,
    product_name: p.productName,
    active_ingredient: p.activeIngredient ?? null,
  }));
}

export function normalizeAppFieldsForRpc(fields: AppRecordCreateInput["appFields"]) {
  return fields.map((f, i) => ({
    field_id: f.fieldId,
    field_name_snapshot: f.fieldName ?? "",
    location_lat: f.locationLat != null ? String(f.locationLat) : "",
    location_lng: f.locationLng != null ? String(f.locationLng) : "",
    sort_order: i,
  }));
}

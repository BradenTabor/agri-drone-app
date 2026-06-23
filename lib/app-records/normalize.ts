import type { AppRecordCreateInput } from "@/lib/validation/schemas";

export function normalizeAppRecordPayload(d: AppRecordCreateInput) {
  return {
    job_date: d.jobDate,
    applicator_name: d.applicatorName,
    customer_name: d.customerName,
    site_address: d.siteAddress ?? "",
    job_site_id: d.jobSiteId ?? "",
    location_lat: d.locationLat?.toString() ?? "",
    location_lng: d.locationLng?.toString() ?? "",
    temp_f: d.tempF?.toString() ?? "",
    wind_speed_mph: d.windSpeedMph?.toString() ?? "",
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

import type {
  MixRecordCreateInput,
  MixRecordProductLineInput,
} from "@/lib/validation/schemas";

export function normalizeMixRecordPayload(input: MixRecordCreateInput) {
  const equipmentIds = [...new Set(input.equipmentIds)];
  return {
    record_date: input.recordDate,
    time_mixed: input.timeMixed,
    applicator_id: input.applicatorId ?? null,
    applicator_name_override: input.applicatorNameOverride ?? null,
    license_cert_no: input.licenseCertNo ?? null,
    equipment_id: equipmentIds[0] ?? null,
    equipment_ids: equipmentIds,
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
    notes: input.notes ?? null,
    signed_typed_name: input.signedTypedName,
    signature_attested: input.signatureAttested,
  };
}

export function normalizeProductLinesForRpc(lines: MixRecordProductLineInput[]) {
  return lines.map((line, index) => ({
    product_id: line.productId ?? null,
    amount_added: line.amountAdded,
    amount_unit: line.amountUnit,
    rate_per_acre: line.ratePerAcre ?? null,
    rate_unit: line.rateUnit ?? null,
    sort_order: index,
  }));
}

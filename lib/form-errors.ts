export function listFieldErrorMessages(
  fieldErrors: Record<string, string[] | undefined> | undefined,
): string[] {
  if (!fieldErrors) {
    return [];
  }

  return [...new Set(Object.values(fieldErrors).flatMap((messages) => messages ?? []))];
}

export function firstFieldErrorKey(
  fieldErrors: Record<string, string[] | undefined> | undefined,
): string | null {
  if (!fieldErrors) {
    return null;
  }

  for (const [field, messages] of Object.entries(fieldErrors)) {
    if (messages?.length) {
      return field;
    }
  }

  return null;
}

const MIX_RECORD_FIELD_TARGETS: Record<string, string> = {
  recordDate: "#recordDate",
  timeMixed: "#timeMixed",
  mixLat: "#mixLat",
  mixLng: "#mixLng",
  customerId: "#customerId",
  fieldId: "#fieldId",
  productLines: '[data-form-section="products"]',
  signatureAttested: "#signatureAttested",
  signedTypedName: "#signedTypedName",
};

export function mixRecordFieldTargetSelector(field: string): string {
  return MIX_RECORD_FIELD_TARGETS[field] ?? `[name="${field}"]`;
}

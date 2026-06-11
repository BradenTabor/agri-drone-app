export type AttachableMixRecord = {
  id: string;
  recordDate: string;
  timeMixed: string;
  customerName: string | null;
  fieldName: string | null;
  applicatorName: string | null;
  totalMixGal: number;
  expectedAcres: number;
  actualAcres: number | null;
  surfactantName: string | null;
  surfactantAmount: number | null;
  surfactantUnit: string | null;
  products: Array<{
    productId: string | null;
    productName: string;
    epaNumber: string | null;
    activeIngredient: string | null;
  }>;
};

export const MIX_RECORD_ATTACH_SELECT = `
  id,
  record_date,
  time_mixed,
  customer_name_snapshot,
  field_name_snapshot,
  applicator_name_override,
  total_mix_gal,
  expected_acres,
  actual_acres,
  surfactant_name,
  surfactant_amount,
  surfactant_unit,
  applicator_profile:profiles!mix_records_applicator_id_fkey(full_name),
  mix_record_products!mix_record_products_mix_record_id_fkey(
    product_id,
    sort_order,
    deleted_at,
    products(name, epa_number, ingredients, deleted_at)
  )
`;

type MixRecordProductRow = {
  product_id: string | null;
  sort_order: number;
  deleted_at: string | null;
  products:
    | {
        name: string;
        epa_number: string | null;
        ingredients: string[] | null;
        deleted_at: string | null;
      }
    | {
        name: string;
        epa_number: string | null;
        ingredients: string[] | null;
        deleted_at: string | null;
      }[]
    | null;
};

type MixRecordAttachRow = {
  id: string;
  record_date: string;
  time_mixed: string;
  customer_name_snapshot: string | null;
  field_name_snapshot: string | null;
  applicator_name_override: string | null;
  total_mix_gal: number;
  expected_acres: number;
  actual_acres: number | null;
  surfactant_name: string | null;
  surfactant_amount: number | null;
  surfactant_unit: string | null;
  applicator_profile: { full_name: string } | { full_name: string }[] | null;
  mix_record_products: MixRecordProductRow[] | null;
};

function asSingle<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export function mapMixRow(row: MixRecordAttachRow): AttachableMixRecord {
  const applicatorProfile = asSingle(row.applicator_profile);
  const productLines = (row.mix_record_products ?? [])
    .filter((line) => line.deleted_at == null)
    .sort((a, b) => a.sort_order - b.sort_order);

  return {
    id: row.id,
    recordDate: row.record_date,
    timeMixed: row.time_mixed,
    customerName: row.customer_name_snapshot,
    fieldName: row.field_name_snapshot,
    applicatorName: row.applicator_name_override ?? applicatorProfile?.full_name ?? null,
    totalMixGal: row.total_mix_gal,
    expectedAcres: row.expected_acres,
    actualAcres: row.actual_acres,
    surfactantName: row.surfactant_name,
    surfactantAmount: row.surfactant_amount,
    surfactantUnit: row.surfactant_unit,
    products: productLines.map((line) => {
      const product = asSingle(line.products);
      const productDeleted = product?.deleted_at != null;
      return {
        productId: line.product_id,
        productName: productDeleted || !product ? "Unknown product" : product.name,
        epaNumber: productDeleted || !product ? null : product.epa_number,
        activeIngredient: productDeleted || !product
          ? null
          : product.ingredients?.length
            ? product.ingredients.join(", ")
            : null,
      };
    }),
  };
}

export function trimNumber(n: number): string {
  return Number(n.toFixed(2)).toString();
}

function formatShortDate(recordDate: string): string {
  const [year, month, day] = recordDate.split("-").map(Number);
  if (!year || !month || !day) return recordDate;
  return `${month}/${day}`;
}

export function buildTankMixSummary(mixes: AttachableMixRecord[]): string {
  const fieldNames = [
    ...new Set(
      mixes
        .map((mix) => mix.fieldName?.trim())
        .filter((name): name is string => Boolean(name)),
    ),
  ];
  const fieldsLabel = fieldNames.length > 0 ? fieldNames.join(" & ") : "Mix";
  const dateLabel = mixes[0] ? formatShortDate(mixes[0].recordDate) : "";
  return dateLabel ? `${fieldsLabel} — ${dateLabel}` : fieldsLabel;
}

export function mixAcres(mix: AttachableMixRecord): number {
  return mix.actualAcres ?? mix.expectedAcres;
}

export function formatMixSummaryLine(mix: AttachableMixRecord): string {
  const customer = mix.customerName ?? "—";
  const field = mix.fieldName ?? "—";
  return `${mix.recordDate} · ${customer} — ${field}`;
}

export function formatMixDetailLine(mix: AttachableMixRecord): string {
  const acres = mixAcres(mix);
  const productCount = mix.products.length;
  return `${mix.totalMixGal} gal · ${acres} ac · ${productCount} products`;
}

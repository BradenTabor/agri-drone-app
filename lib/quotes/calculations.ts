export type SeededLineItem = {
  kind: "aerial" | "product" | "fee" | "custom";
  productId: string | null;
  description: string;
  basis: "per_acre" | "flat";
  quantity: number;
  unitPrice: number;
  amount: number;
};

export type PricingConfigForSeed = {
  aerial_rate_per_acre: number | null;
  minimum_job_fee: number | null;
  travel_fee_per_mile: number | null;
  setup_fee: number | null;
  product_markup_pct: number | null;
  markup_cap: number | null;
  special_rates: Array<{ name: string; rate: number; unit: string; notes?: string | null }> | null;
};

export type ProductForSeed = {
  id: string;
  name: string;
  unit_cost: number | null;
  cost_unit: string | null;
};

export type SurfactantForQuote = {
  id: string;
  name: string;
  unit_cost: number | null;
  cost_unit: string | null;
};

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function applyMarkup(baseCost: number, markupPct: number | null, markupCap: number | null): number {
  const pct = markupPct ?? 0;
  let markupAmount = baseCost * (pct / 100);
  if (markupCap != null && markupAmount > markupCap) {
    markupAmount = markupCap;
  }
  return round2(baseCost + markupAmount);
}

export function seedAerialLine(config: PricingConfigForSeed, acres: number | null): SeededLineItem | null {
  if (config.aerial_rate_per_acre == null || acres == null || acres <= 0) return null;
  const unitPrice = round2(config.aerial_rate_per_acre);
  return {
    kind: "aerial",
    productId: null,
    description: "Aerial application",
    basis: "per_acre",
    quantity: acres,
    unitPrice,
    amount: round2(unitPrice * acres),
  };
}

export function seedProductLine(
  product: ProductForSeed,
  config: PricingConfigForSeed,
  acres: number | null,
): SeededLineItem {
  const baseCost = product.unit_cost ?? 0;
  const unitPrice = applyMarkup(baseCost, config.product_markup_pct, config.markup_cap);
  const basis: "per_acre" | "flat" = acres != null && acres > 0 ? "per_acre" : "flat";
  const quantity = basis === "per_acre" ? (acres ?? 0) : 1;
  const unitLabel = product.cost_unit ? `/${product.cost_unit}` : "";
  return {
    kind: "product",
    productId: product.id,
    description: `${product.name}${unitLabel ? ` (${unitLabel.slice(1)})` : ""}`,
    basis,
    quantity,
    unitPrice,
    amount: round2(unitPrice * quantity),
  };
}

export function seedFeeLines(config: PricingConfigForSeed): SeededLineItem[] {
  const lines: SeededLineItem[] = [];
  if (config.setup_fee != null && config.setup_fee > 0) {
    lines.push({
      kind: "fee",
      productId: null,
      description: "Setup / mobilization fee",
      basis: "flat",
      quantity: 1,
      unitPrice: round2(config.setup_fee),
      amount: round2(config.setup_fee),
    });
  }
  return lines;
}

/**
 * Cost contribution of a selected surfactant to a quote. Surfactants are priced
 * like products (per-acre when acres are known, otherwise flat), so the charge
 * is unit cost multiplied by acres (defaulting to a single unit). Returns 0 when
 * no surfactant is selected or it has no usable cost.
 */
export function surfactantCharge(
  surfactant: Pick<SurfactantForQuote, "unit_cost"> | null | undefined,
  acres: number | null,
): number {
  if (!surfactant || surfactant.unit_cost == null) return 0;
  const unitCost = Number(surfactant.unit_cost);
  if (!Number.isFinite(unitCost) || unitCost <= 0) return 0;
  const multiplier = acres != null && acres > 0 ? acres : 1;
  return round2(unitCost * multiplier);
}

export function computeTotals(
  lineItems: Array<{ amount: number }>,
  taxRate: number = 0,
  otherAmount: number = 0,
  surfactantAmount: number = 0,
): { subtotal: number; tax: number; total: number } {
  const lineSubtotal = lineItems.reduce((sum, li) => sum + (Number(li.amount) || 0), 0);
  const subtotal = round2(lineSubtotal + (Number(surfactantAmount) || 0));
  const tax = round2(subtotal * ((Number(taxRate) || 0) / 100));
  const total = round2(subtotal + tax + (Number(otherAmount) || 0));
  return { subtotal, tax, total };
}

export function lineAmount(quantity: number, unitPrice: number): number {
  return round2((Number(quantity) || 0) * (Number(unitPrice) || 0));
}

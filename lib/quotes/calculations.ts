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

export function computeTotals(
  lineItems: Array<{ amount: number }>,
  taxRate: number = 0,
  otherAmount: number = 0,
): { subtotal: number; tax: number; total: number } {
  const subtotal = round2(lineItems.reduce((sum, li) => sum + (Number(li.amount) || 0), 0));
  const tax = round2(subtotal * ((Number(taxRate) || 0) / 100));
  const total = round2(subtotal + tax + (Number(otherAmount) || 0));
  return { subtotal, tax, total };
}

export function lineAmount(quantity: number, unitPrice: number): number {
  return round2((Number(quantity) || 0) * (Number(unitPrice) || 0));
}

/**
 * Travel charge for a quote. Mileage is captured in miles, so it needs the
 * configured per-mile rate ($/mi) to become a dollar amount: miles × rate.
 * Returns 0 when either input is missing or non-positive.
 */
export function mileageCharge(miles: number | null, ratePerMile: number | null): number {
  if (miles == null || ratePerMile == null) return 0;
  const distance = Number(miles);
  const rate = Number(ratePerMile);
  if (!Number.isFinite(distance) || !Number.isFinite(rate)) return 0;
  if (distance <= 0 || rate <= 0) return 0;
  return round2(distance * rate);
}

export type QuoteExtraChargeInput = {
  adjuvantPrice: number | null;
  mileage: number | null;
  ratePerMile: number | null;
};

/**
 * Builds the extra taxable charges folded into a quote's subtotal alongside the
 * line items: the adjuvant price (a flat dollar amount entered on the quote) and
 * the mileage charge (miles × travel rate). Returning line-item-shaped entries
 * lets {@link computeTotals} treat them exactly like line items, so they land in
 * the taxable subtotal — the same treatment the surfactant charge receives. Only
 * positive charges are emitted, so blank inputs add nothing.
 */
export function quoteExtraTaxableCharges(input: QuoteExtraChargeInput): Array<{ amount: number }> {
  const charges: Array<{ amount: number }> = [];

  const adjuvant = input.adjuvantPrice == null ? 0 : Number(input.adjuvantPrice);
  if (Number.isFinite(adjuvant) && adjuvant > 0) {
    charges.push({ amount: round2(adjuvant) });
  }

  const mileage = mileageCharge(input.mileage, input.ratePerMile);
  if (mileage > 0) {
    charges.push({ amount: mileage });
  }

  return charges;
}

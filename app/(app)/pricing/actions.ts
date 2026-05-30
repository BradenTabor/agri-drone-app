"use server";

import { revalidatePath } from "next/cache";

import { pricingConfigSchema, type PricingConfigInput } from "@/lib/validation/schemas";
import { createClient } from "@/lib/supabase/server";

const SINGLETON_ID = "00000000-0000-0000-0000-000000000001";

type PricingFieldErrors = Partial<Record<keyof PricingConfigInput, string[]>>;

export type PricingFormState = {
  error: string | null;
  success?: boolean;
  fieldErrors?: PricingFieldErrors;
};

function extractPricingFormData(formData: FormData) {
  return {
    aerialRatePerAcre: String(formData.get("aerialRatePerAcre") ?? ""),
    minimumJobFee: String(formData.get("minimumJobFee") ?? ""),
    travelFeePerMile: String(formData.get("travelFeePerMile") ?? ""),
    setupFee: String(formData.get("setupFee") ?? ""),
    productMarkupPct: String(formData.get("productMarkupPct") ?? ""),
    markupCap: String(formData.get("markupCap") ?? ""),
    paymentTerms: String(formData.get("paymentTerms") ?? ""),
    specialRates: JSON.parse(String(formData.get("specialRates") ?? "[]")),
  };
}

export async function savePricingConfigAction(
  _previousState: PricingFormState,
  formData: FormData,
): Promise<PricingFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired. Please sign in again." };

  const parsed = pricingConfigSchema.safeParse(extractPricingFormData(formData));
  if (!parsed.success) {
    return {
      error: "Please correct the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors as PricingFieldErrors,
    };
  }

  const { error } = await supabase.from("pricing_config").upsert({
    id: SINGLETON_ID,
    aerial_rate_per_acre: parsed.data.aerialRatePerAcre ?? null,
    minimum_job_fee: parsed.data.minimumJobFee ?? null,
    travel_fee_per_mile: parsed.data.travelFeePerMile ?? null,
    setup_fee: parsed.data.setupFee ?? null,
    product_markup_pct: parsed.data.productMarkupPct ?? null,
    markup_cap: parsed.data.markupCap ?? null,
    payment_terms: parsed.data.paymentTerms ?? null,
    special_rates: parsed.data.specialRates,
  });

  if (error) return { error: "Unable to save pricing config. Please try again." };

  revalidatePath("/pricing");
  return { error: null, success: true };
}

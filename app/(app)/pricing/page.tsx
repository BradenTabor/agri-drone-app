import { PricingForm } from "@/components/pricing/PricingForm";
import { PageHeader } from "@/components/shared/PageHeader";
import { createClient } from "@/lib/supabase/server";

import { savePricingConfigAction } from "./actions";

const SINGLETON_ID = "00000000-0000-0000-0000-000000000001";

export default async function PricingPage() {
  const supabase = await createClient();
  const { data: config } = await supabase
    .from("pricing_config")
    .select("*")
    .eq("id", SINGLETON_ID)
    .maybeSingle();

  return (
    <section className="space-y-3 sm:space-y-4">
      <PageHeader
        title="Pricing"
        description="Set your service rates and markup. Used internally for quoting jobs."
      />

      <PricingForm
        action={savePricingConfigAction}
        defaultValues={
          config
            ? {
                aerialRatePerAcre: config.aerial_rate_per_acre,
                minimumJobFee: config.minimum_job_fee,
                travelFeePerMile: config.travel_fee_per_mile,
                setupFee: config.setup_fee,
                productMarkupPct: config.product_markup_pct,
                markupCap: config.markup_cap,
                paymentTerms: config.payment_terms,
                specialRates:
                  (config.special_rates as Array<{
                    name: string;
                    rate: number;
                    unit: string;
                    notes: string | null;
                  }>) ?? [],
              }
            : undefined
        }
      />
    </section>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";

import { createQuoteAction } from "@/app/(app)/quotes/actions";
import { QuoteForm } from "@/components/quotes/QuoteForm";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  seedAerialLine,
  seedFeeLines,
  seedProductLine,
  type PricingConfigForSeed,
  type SeededLineItem,
} from "@/lib/quotes/calculations";
import { createClient } from "@/lib/supabase/server";

type NewQuotePageProps = {
  searchParams: Promise<{
    fromRecord?: string;
    customerId?: string;
  }>;
};

const SINGLETON_ID = "00000000-0000-0000-0000-000000000001";

function normalizeName(value: string) {
  return value.trim().toLowerCase();
}

export default async function NewQuotePage({ searchParams }: NewQuotePageProps) {
  const { fromRecord, customerId: customerIdParam } = await searchParams;
  const supabase = await createClient();

  const [{ data: customers }, { data: fields }, { data: products }, { data: surfactants }, { data: pricingConfig }] =
    await Promise.all([
      supabase.from("customers").select("id,name").is("deleted_at", null).order("name", { ascending: true }),
      supabase.from("fields").select("id,name,acres,customer_id").is("deleted_at", null).order("name", { ascending: true }),
      supabase
        .from("products")
        .select("id,name,unit_cost,cost_unit")
        .is("deleted_at", null)
        .eq("active", true)
        .order("name", { ascending: true }),
      supabase
        .from("surfactants")
        .select("id,name,unit_cost,cost_unit")
        .is("deleted_at", null)
        .eq("active", true)
        .order("name", { ascending: true }),
      supabase.from("pricing_config").select("*").eq("id", SINGLETON_ID).maybeSingle(),
    ]);

  const config: PricingConfigForSeed = {
    aerial_rate_per_acre: pricingConfig?.aerial_rate_per_acre ?? null,
    minimum_job_fee: pricingConfig?.minimum_job_fee ?? null,
    travel_fee_per_mile: pricingConfig?.travel_fee_per_mile ?? null,
    setup_fee: pricingConfig?.setup_fee ?? null,
    product_markup_pct: pricingConfig?.product_markup_pct ?? null,
    markup_cap: pricingConfig?.markup_cap ?? null,
    special_rates:
      (pricingConfig?.special_rates as Array<{ name: string; rate: number; unit: string; notes?: string | null }>) ??
      null,
  };

  let defaultCustomerId = customerIdParam ?? "";
  let defaultCustomerName = "";
  let defaultAcres: number | null = null;
  let sourceAppRecordId = "";
  let seededLineItems: SeededLineItem[] = [];

  if (defaultCustomerId) {
    const matchedCustomer = (customers ?? []).find((customer) => customer.id === defaultCustomerId);
    if (matchedCustomer) {
      defaultCustomerName = matchedCustomer.name;
    } else {
      defaultCustomerId = "";
    }
  }

  if (fromRecord) {
    const [{ data: record, error: recordError }, { data: pesticides, error: pesticideError }] = await Promise.all([
      supabase.from("app_records").select("id,customer_name,acres_treated").eq("id", fromRecord).is("deleted_at", null).single(),
      supabase
        .from("app_record_pesticides")
        .select("product_name,sort_order")
        .eq("app_record_id", fromRecord)
        .order("sort_order", { ascending: true }),
    ]);

    if (recordError || !record) {
      notFound();
    }
    if (pesticideError) {
      throw new Error("Unable to load source app record products.");
    }

    sourceAppRecordId = record.id;
    defaultCustomerName = record.customer_name;
    defaultAcres = record.acres_treated ?? null;

    const matchedCustomer = (customers ?? []).find(
      (customer) => normalizeName(customer.name) === normalizeName(record.customer_name),
    );
    defaultCustomerId = matchedCustomer?.id ?? "";

    const aerialLine = seedAerialLine(config, defaultAcres);
    if (aerialLine) {
      seededLineItems.push(aerialLine);
    }

    for (const pesticide of pesticides ?? []) {
      const matchedProduct = (products ?? []).find(
        (product) => normalizeName(product.name) === normalizeName(pesticide.product_name),
      );
      if (matchedProduct) {
        seededLineItems.push(seedProductLine(matchedProduct, config, defaultAcres));
      } else {
        const basis = defaultAcres != null && defaultAcres > 0 ? "per_acre" : "flat";
        const quantity = basis === "per_acre" ? (defaultAcres ?? 0) : 1;
        seededLineItems.push({
          kind: "product",
          productId: null,
          description: pesticide.product_name,
          basis,
          quantity,
          unitPrice: 0,
          amount: 0,
        });
      }
    }

    seededLineItems = [...seededLineItems, ...seedFeeLines(config)];
  }

  return (
    <section className="space-y-4">
      <header className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">New Quote</h1>
          <Link href="/quotes" className={buttonVariants({ variant: "outline" })}>
            Back
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">
          Build an estimate snapshot from pricing defaults, then edit any line item.
        </p>
      </header>

      <Card>
        <CardContent className="p-5">
          <QuoteForm
            action={createQuoteAction}
            customers={customers ?? []}
            fields={fields ?? []}
            products={(products ?? []).map((product) => ({
              id: product.id,
              name: product.name,
              unitCost: product.unit_cost,
              costUnit: product.cost_unit,
            }))}
            surfactants={(surfactants ?? []).map((surfactant) => ({
              id: surfactant.id,
              name: surfactant.name,
              unitCost: surfactant.unit_cost,
              costUnit: surfactant.cost_unit,
            }))}
            minimumJobFee={config.minimum_job_fee}
            travelFeePerMile={config.travel_fee_per_mile}
            defaultValues={{
              customerId: defaultCustomerId || null,
              customerName: defaultCustomerName,
              sourceAppRecordId: sourceAppRecordId || null,
              status: "draft",
              acres: defaultAcres,
              serviceFor: fromRecord ? "Herbicide Application" : null,
              terms: pricingConfig?.payment_terms ?? null,
            }}
            defaultLineItems={seededLineItems}
          />
        </CardContent>
      </Card>
    </section>
  );
}

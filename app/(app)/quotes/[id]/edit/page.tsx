import Link from "next/link";
import { notFound } from "next/navigation";

import { updateQuoteAction } from "@/app/(app)/quotes/actions";
import { QuoteForm } from "@/components/quotes/QuoteForm";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

type EditQuotePageProps = {
  params: Promise<{ id: string }>;
};

const SINGLETON_ID = "00000000-0000-0000-0000-000000000001";

export default async function EditQuotePage({ params }: EditQuotePageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: quote, error: quoteError },
    { data: lineItems, error: lineItemsError },
    { data: customers },
    { data: fields },
    { data: products },
    { data: surfactants },
    { data: pricingConfig },
  ] = await Promise.all([
    supabase.from("quotes").select("*").eq("id", id).is("deleted_at", null).single(),
    supabase
      .from("quote_line_items")
      .select("id,kind,product_id,description,basis,quantity,unit_price,amount,sort_order")
      .eq("quote_id", id)
      .order("sort_order", { ascending: true }),
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
    supabase.from("pricing_config").select("minimum_job_fee,travel_fee_per_mile").eq("id", SINGLETON_ID).maybeSingle(),
  ]);

  if (quoteError || !quote) {
    notFound();
  }
  if (lineItemsError) {
    throw new Error("Unable to load quote line items.");
  }

  const action = updateQuoteAction.bind(null, quote.id);

  return (
    <section className="space-y-4">
      <header className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Edit Quote</h1>
          <Link href={`/quotes/${quote.id}`} className={buttonVariants({ variant: "outline" })}>
            Cancel
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">
          {quote.quote_number || "Unnumbered quote"} / {quote.customer_name}
        </p>
      </header>

      <Card>
        <CardContent className="p-5">
          <QuoteForm
            action={action}
            submitLabel="Save Quote"
            pendingLabel="Saving..."
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
            minimumJobFee={pricingConfig?.minimum_job_fee ?? null}
            travelFeePerMile={pricingConfig?.travel_fee_per_mile ?? null}
            defaultValues={{
              quoteNumber: quote.quote_number,
              status: quote.status as "draft" | "sent" | "accepted" | "declined",
              customerId: quote.customer_id,
              customerName: quote.customer_name,
              fieldId: quote.field_id,
              surfactantId: quote.surfactant_id,
              sourceAppRecordId: quote.source_app_record_id,
              quoteDate: quote.quote_date,
              validUntil: quote.valid_until,
              acres: quote.acres,
              serviceFor: quote.service_for,
              adjuvantName: quote.adjuvant_name,
              adjuvantPrice: quote.adjuvant_price,
              mileage: quote.mileage,
              taxRate: quote.tax_rate,
              otherLabel: quote.other_label,
              otherAmount: quote.other_amount,
              notes: quote.notes,
              terms: quote.terms,
            }}
            defaultLineItems={(lineItems ?? []).map((line) => ({
              kind: line.kind as "aerial" | "product" | "fee" | "custom",
              productId: line.product_id,
              description: line.description,
              basis: line.basis as "per_acre" | "flat",
              quantity: line.quantity,
              unitPrice: line.unit_price,
              amount: line.amount,
            }))}
          />
        </CardContent>
      </Card>
    </section>
  );
}

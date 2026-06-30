"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { computeTotals, quoteExtraTaxableCharges } from "@/lib/quotes/calculations";
import {
  quoteCreateSchema,
  quoteUpdateSchema,
  type QuoteCreateInput,
  type QuoteLineItemInput,
} from "@/lib/validation/schemas";
import { createClient } from "@/lib/supabase/server";

const PRICING_CONFIG_SINGLETON_ID = "00000000-0000-0000-0000-000000000001";

// The per-mile travel rate is resolved from pricing settings server-side so the
// client cannot tamper with the rate applied to a quote's mileage charge.
async function resolveTravelRatePerMile(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<number | null> {
  const { data } = await supabase
    .from("pricing_config")
    .select("travel_fee_per_mile")
    .eq("id", PRICING_CONFIG_SINGLETON_ID)
    .maybeSingle();
  return data?.travel_fee_per_mile ?? null;
}

type QuoteFieldErrors = Partial<Record<keyof QuoteCreateInput, string[]>>;

export type QuoteFormState = {
  error: string | null;
  fieldErrors?: QuoteFieldErrors;
};

function parseLineItems(raw: string): QuoteLineItemInput[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function extractQuoteFormData(formData: FormData) {
  return {
    quoteNumber: String(formData.get("quoteNumber") ?? ""),
    status: String(formData.get("status") ?? "draft"),
    customerId: String(formData.get("customerId") ?? ""),
    fieldId: String(formData.get("fieldId") ?? ""),
    customerName: String(formData.get("customerName") ?? ""),
    sourceAppRecordId: String(formData.get("sourceAppRecordId") ?? ""),
    quoteDate: String(formData.get("quoteDate") ?? ""),
    validUntil: String(formData.get("validUntil") ?? ""),
    acres: String(formData.get("acres") ?? ""),
    serviceFor: String(formData.get("serviceFor") ?? ""),
    adjuvantName: String(formData.get("adjuvantName") ?? ""),
    adjuvantPrice: String(formData.get("adjuvantPrice") ?? ""),
    mileage: String(formData.get("mileage") ?? ""),
    taxRate: String(formData.get("taxRate") ?? "0"),
    otherLabel: String(formData.get("otherLabel") ?? ""),
    otherAmount: String(formData.get("otherAmount") ?? "0"),
    notes: String(formData.get("notes") ?? ""),
    terms: String(formData.get("terms") ?? ""),
    lineItems: parseLineItems(String(formData.get("lineItems") ?? "[]")),
  };
}

function normalizeLineItems(lineItems: QuoteLineItemInput[], quoteId: string) {
  return lineItems.map((line, index) => ({
    quote_id: quoteId,
    sort_order: index,
    kind: line.kind,
    product_id: line.productId ?? null,
    description: line.description,
    basis: line.basis,
    quantity: line.quantity,
    unit_price: line.unitPrice,
    amount: line.amount,
  }));
}

export async function createQuoteAction(
  _previousState: QuoteFormState,
  formData: FormData,
): Promise<QuoteFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Your session expired. Please sign in again." };
  }

  const parsed = quoteCreateSchema.safeParse(extractQuoteFormData(formData));
  if (!parsed.success) {
    return {
      error: "Please correct the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const ratePerMile = await resolveTravelRatePerMile(supabase);
  // Adjuvant price and mileage are folded into the taxable subtotal alongside the
  // line items (server-resolved rate), mirroring how the surfactant charge is added.
  const totals = computeTotals(
    [
      ...parsed.data.lineItems,
      ...quoteExtraTaxableCharges({
        adjuvantPrice: parsed.data.adjuvantPrice ?? null,
        mileage: parsed.data.mileage ?? null,
        ratePerMile,
      }),
    ],
    parsed.data.taxRate,
    parsed.data.otherAmount,
  );
  const { data: quote, error: quoteError } = await supabase
    .from("quotes")
    .insert({
      quote_number: parsed.data.quoteNumber ?? null,
      status: parsed.data.status,
      customer_id: parsed.data.customerId ?? null,
      field_id: parsed.data.fieldId ?? null,
      customer_name: parsed.data.customerName,
      source_app_record_id: parsed.data.sourceAppRecordId ?? null,
      quote_date: parsed.data.quoteDate,
      valid_until: parsed.data.validUntil ?? null,
      acres: parsed.data.acres ?? null,
      service_for: parsed.data.serviceFor ?? null,
      adjuvant_name: parsed.data.adjuvantName ?? null,
      adjuvant_price: parsed.data.adjuvantPrice ?? null,
      mileage: parsed.data.mileage ?? null,
      tax_rate: parsed.data.taxRate,
      other_label: parsed.data.otherLabel ?? null,
      other_amount: parsed.data.otherAmount,
      notes: parsed.data.notes ?? null,
      terms: parsed.data.terms ?? null,
      subtotal: totals.subtotal,
      total: totals.total,
      created_by: user.id,
    })
    .select("id,customer_id")
    .single();

  if (quoteError || !quote) {
    return { error: "Unable to create quote. Please try again." };
  }

  const { error: lineItemsError } = await supabase
    .from("quote_line_items")
    .insert(normalizeLineItems(parsed.data.lineItems, quote.id));
  if (lineItemsError) {
    return { error: "Quote created but line items failed to save. Please edit to retry." };
  }

  revalidatePath("/quotes");
  if (quote.customer_id) {
    revalidatePath(`/customers/${quote.customer_id}`);
  }
  redirect(`/quotes/${quote.id}`);
}

export async function updateQuoteAction(
  quoteId: string,
  _previousState: QuoteFormState,
  formData: FormData,
): Promise<QuoteFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Your session expired. Please sign in again." };
  }

  const parsed = quoteUpdateSchema.safeParse(extractQuoteFormData(formData));
  if (!parsed.success) {
    return {
      error: "Please correct the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const ratePerMile = await resolveTravelRatePerMile(supabase);
  // Adjuvant price and mileage are folded into the taxable subtotal alongside the
  // line items (server-resolved rate), mirroring how the surfactant charge is added.
  const totals = computeTotals(
    [
      ...parsed.data.lineItems,
      ...quoteExtraTaxableCharges({
        adjuvantPrice: parsed.data.adjuvantPrice ?? null,
        mileage: parsed.data.mileage ?? null,
        ratePerMile,
      }),
    ],
    parsed.data.taxRate,
    parsed.data.otherAmount,
  );
  const { data: quote, error: quoteError } = await supabase
    .from("quotes")
    .update({
      quote_number: parsed.data.quoteNumber ?? null,
      status: parsed.data.status,
      customer_id: parsed.data.customerId ?? null,
      field_id: parsed.data.fieldId ?? null,
      customer_name: parsed.data.customerName,
      source_app_record_id: parsed.data.sourceAppRecordId ?? null,
      quote_date: parsed.data.quoteDate,
      valid_until: parsed.data.validUntil ?? null,
      acres: parsed.data.acres ?? null,
      service_for: parsed.data.serviceFor ?? null,
      adjuvant_name: parsed.data.adjuvantName ?? null,
      adjuvant_price: parsed.data.adjuvantPrice ?? null,
      mileage: parsed.data.mileage ?? null,
      tax_rate: parsed.data.taxRate,
      other_label: parsed.data.otherLabel ?? null,
      other_amount: parsed.data.otherAmount,
      notes: parsed.data.notes ?? null,
      terms: parsed.data.terms ?? null,
      subtotal: totals.subtotal,
      total: totals.total,
    })
    .eq("id", quoteId)
    .is("deleted_at", null)
    .select("id,customer_id")
    .single();
  if (quoteError || !quote) {
    return { error: "Unable to update quote. Please try again." };
  }

  const { error: deleteError } = await supabase.from("quote_line_items").delete().eq("quote_id", quoteId);
  if (deleteError) {
    return { error: "Unable to update quote line items. Please try again." };
  }

  const { error: lineItemsError } = await supabase
    .from("quote_line_items")
    .insert(normalizeLineItems(parsed.data.lineItems, quoteId));
  if (lineItemsError) {
    return { error: "Unable to save quote line items. Please try again." };
  }

  revalidatePath("/quotes");
  revalidatePath(`/quotes/${quoteId}`);
  if (quote.customer_id) {
    revalidatePath(`/customers/${quote.customer_id}`);
  }
  redirect(`/quotes/${quoteId}`);
}

export async function softDeleteQuoteAction(quoteId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: quote, error } = await supabase
    .from("quotes")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", quoteId)
    .is("deleted_at", null)
    .select("id,customer_id")
    .single();
  if (error || !quote) {
    throw new Error("Unable to delete quote.");
  }

  revalidatePath("/quotes");
  if (quote.customer_id) {
    revalidatePath(`/customers/${quote.customer_id}`);
  }
  redirect("/quotes");
}

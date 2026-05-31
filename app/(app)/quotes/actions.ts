"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { computeTotals } from "@/lib/quotes/calculations";
import {
  quoteCreateSchema,
  quoteUpdateSchema,
  type QuoteCreateInput,
  type QuoteLineItemInput,
} from "@/lib/validation/schemas";
import { createClient } from "@/lib/supabase/server";

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

  const totals = computeTotals(parsed.data.lineItems);
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

  const totals = computeTotals(parsed.data.lineItems);
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

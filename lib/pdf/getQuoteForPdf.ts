import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

export type QuotePdfData = {
  quote: {
    id: string;
    quote_number: string | null;
    status: string;
    quote_date: string;
    valid_until: string | null;
    customer_name: string;
    service_for: string | null;
    acres: number | null;
    notes: string | null;
    terms: string | null;
    subtotal: number;
    tax_rate: number;
    other_label: string | null;
    other_amount: number;
    total: number;
  };
  customer: {
    name: string | null;
    contact_name: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
  } | null;
  lineItems: Array<{
    kind: string;
    description: string;
    basis: string;
    quantity: number;
    unit_price: number;
    amount: number;
  }>;
};

function asSingle<T>(value: T | T[] | null): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function getQuoteForPdf(
  quoteId: string,
  supabase: SupabaseClient<Database>,
): Promise<QuotePdfData | null> {
  const { data: quoteRow, error: quoteError } = await supabase
    .from("quotes")
    .select(`
      id, quote_number, status, quote_date, valid_until, customer_name,
      service_for, acres, notes, terms, subtotal, tax_rate, other_label, other_amount, total,
      customer:customers!quotes_customer_id_fkey(name,contact_name,email,phone,address,city,state,zip)
    `)
    .eq("id", quoteId)
    .is("deleted_at", null)
    .single();

  if (quoteError) {
    if (quoteError.code === "PGRST116") return null;
    throw new Error(`Unable to load quote for PDF: ${quoteError.message}`);
  }
  if (!quoteRow) return null;

  const { data: lineRows, error: lineError } = await supabase
    .from("quote_line_items")
    .select("kind,description,basis,quantity,unit_price,amount,sort_order")
    .eq("quote_id", quoteId)
    .order("sort_order", { ascending: true });

  if (lineError) {
    throw new Error(`Unable to load quote line items: ${lineError.message}`);
  }

  // Supabase doesn't infer the embedded customer shape.
  const typed = quoteRow as unknown as {
    [K in keyof QuotePdfData["quote"]]: QuotePdfData["quote"][K];
  } & { customer: QuotePdfData["customer"] | QuotePdfData["customer"][] | null };

  const customer = asSingle(typed.customer);

  return {
    quote: {
      id: typed.id,
      quote_number: typed.quote_number,
      status: typed.status,
      quote_date: typed.quote_date,
      valid_until: typed.valid_until,
      customer_name: typed.customer_name,
      service_for: typed.service_for,
      acres: typed.acres,
      notes: typed.notes,
      terms: typed.terms,
      subtotal: Number(typed.subtotal || 0),
      tax_rate: Number(typed.tax_rate || 0),
      other_label: typed.other_label,
      other_amount: Number(typed.other_amount || 0),
      total: Number(typed.total || 0),
    },
    customer: customer
      ? {
          name: customer.name,
          contact_name: customer.contact_name,
          email: customer.email,
          phone: customer.phone,
          address: customer.address,
          city: customer.city,
          state: customer.state,
          zip: customer.zip,
        }
      : null,
    lineItems: (lineRows ?? []).map((line) => ({
      kind: line.kind,
      description: line.description,
      basis: line.basis,
      quantity: Number(line.quantity || 0),
      unit_price: Number(line.unit_price || 0),
      amount: Number(line.amount || 0),
    })),
  };
}

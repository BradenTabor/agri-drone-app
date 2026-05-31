import Link from "next/link";
import { notFound } from "next/navigation";

import { softDeleteQuoteAction } from "@/app/(app)/quotes/actions";
import { ConfirmSubmitButton } from "@/components/shared/ConfirmSubmitButton";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

type QuoteDetailPageProps = {
  params: Promise<{ id: string }>;
};

function formatMoney(value: number | null) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function statusBadgeClass(status: string) {
  if (status === "sent") return "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300";
  if (status === "accepted") return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
  if (status === "declined") return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
  return "bg-muted text-muted-foreground";
}

function statusLabel(status: string) {
  if (status === "sent") return "Sent";
  if (status === "accepted") return "Accepted";
  if (status === "declined") return "Declined";
  return "Draft";
}

export default async function QuoteDetailPage({ params }: QuoteDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: quote, error: quoteError }, { data: lineItems, error: lineItemsError }] =
    await Promise.all([
      supabase.from("quotes").select("*").eq("id", id).is("deleted_at", null).single(),
      supabase
        .from("quote_line_items")
        .select("id,kind,description,basis,quantity,unit_price,amount,sort_order")
        .eq("quote_id", id)
        .order("sort_order", { ascending: true }),
    ]);

  if (quoteError || !quote) {
    notFound();
  }
  if (lineItemsError) {
    throw new Error("Unable to load quote line items.");
  }

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {quote.quote_number || "Quote"}
          </h1>
          <p className="text-sm text-muted-foreground">{quote.customer_name}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/quotes" className={buttonVariants({ variant: "outline" })}>
            Back
          </Link>
          <button
            type="button"
            className={buttonVariants({ variant: "outline" })}
            disabled
            aria-disabled="true"
          >
            Download PDF
          </button>
          <Link href={`/quotes/${quote.id}/edit`} className={buttonVariants({ variant: "outline" })}>
            Edit
          </Link>
          <form action={softDeleteQuoteAction.bind(null, quote.id)}>
            <ConfirmSubmitButton
              variant="destructive"
              confirmMessage={`Delete quote ${quote.quote_number || quote.id}?`}
            >
              Delete
            </ConfirmSubmitButton>
          </form>
        </div>
      </header>

      <Card>
        <CardHeader className="p-5 pb-0">
          <CardTitle>Quote Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 p-5 text-sm md:grid-cols-3">
          <Detail label="Customer">{quote.customer_name}</Detail>
          <Detail label="Quote date">{quote.quote_date}</Detail>
          <Detail label="Valid until">{quote.valid_until || "—"}</Detail>
          <Detail label="Status">
            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(quote.status)}`}>
              {statusLabel(quote.status)}
            </span>
          </Detail>
          <Detail label="Acres">{quote.acres ?? "—"}</Detail>
          <Detail label="Source App Record">{quote.source_app_record_id || "—"}</Detail>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-5 pb-0">
          <CardTitle>Line Items</CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Description</th>
                  <th className="px-4 py-3 font-medium">Basis</th>
                  <th className="px-4 py-3 font-medium">Qty</th>
                  <th className="px-4 py-3 font-medium">Unit price</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {(lineItems ?? []).map((line) => (
                  <tr key={line.id} className="border-t">
                    <td className="px-4 py-3">{line.description}</td>
                    <td className="px-4 py-3">{line.basis === "per_acre" ? "Per acre" : "Flat"}</td>
                    <td className="px-4 py-3">{line.quantity}</td>
                    <td className="px-4 py-3">{formatMoney(line.unit_price)}</td>
                    <td className="px-4 py-3">{formatMoney(line.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 space-y-1 text-sm">
            <p>Subtotal: <span className="font-medium">{formatMoney(quote.subtotal)}</span></p>
            <p>Total: <span className="text-lg font-semibold">{formatMoney(quote.total)}</span></p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-5 pb-0">
          <CardTitle>Notes & Terms</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-5 text-sm">
          <Detail label="Notes">{quote.notes || "—"}</Detail>
          <Detail label="Terms">{quote.terms || "—"}</Detail>
        </CardContent>
      </Card>
    </section>
  );
}

function Detail({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p>{children}</p>
    </div>
  );
}

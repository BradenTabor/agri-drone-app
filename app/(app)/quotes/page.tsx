import Link from "next/link";

import { QuotesListClient } from "@/components/quotes/QuotesListClient";
import { PageHeader } from "@/components/shared/PageHeader";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function QuotesPage() {
  const supabase = await createClient();
  const { data: quotes, error } = await supabase
    .from("quotes")
    .select("id,quote_number,customer_name,status,quote_date,total")
    .is("deleted_at", null)
    .order("quote_date", { ascending: false });

  if (error) {
    throw new Error("Unable to load quotes.");
  }

  return (
    <section className="space-y-3 sm:space-y-4">
      <PageHeader
        title="Quotes"
        description="Draft, send, and track customer estimates."
        action={
          <Link href="/quotes/new" className={buttonVariants()}>
            + New Quote
          </Link>
        }
      />

      {!quotes?.length ? (
        <Card className="liquid-reactive rounded-xl border-white/60 sm:rounded-2xl">
          <CardContent className="p-3 text-sm text-muted-foreground sm:p-5">
            No quotes yet. Create your first quote to get started.
          </CardContent>
        </Card>
      ) : (
        <QuotesListClient
          quotes={(quotes ?? []).map((quote) => ({
            ...quote,
            status: quote.status as "draft" | "sent" | "accepted" | "declined",
          }))}
        />
      )}
    </section>
  );
}

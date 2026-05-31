import Link from "next/link";

import { QuotesListClient } from "@/components/quotes/QuotesListClient";
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
    <section className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Quotes</h1>
          <p className="text-sm text-muted-foreground">
            Draft, send, and track customer estimates.
          </p>
        </div>
        <Link href="/quotes/new" className={buttonVariants()}>
          + New Quote
        </Link>
      </header>

      {!quotes?.length ? (
        <Card>
          <CardContent className="p-5 text-sm text-muted-foreground">
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

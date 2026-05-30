import Link from "next/link";
import { notFound } from "next/navigation";

import { FieldForm } from "@/components/fields/FieldForm";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

import { createFieldAction } from "../actions";

type NewFieldPageProps = {
  params: Promise<{ id: string }>;
};

export default async function NewFieldPage({ params }: NewFieldPageProps) {
  const { id: customerId } = await params;
  const supabase = await createClient();

  const { data: customer, error } = await supabase
    .from("customers")
    .select("id,name")
    .eq("id", customerId)
    .is("deleted_at", null)
    .single();

  if (error || !customer) {
    notFound();
  }

  const action = createFieldAction.bind(null, customer.id);

  return (
    <section className="space-y-4">
      <header className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">New Field</h1>
          <Link
            href={`/customers/${customer.id}`}
            className={buttonVariants({ variant: "outline" })}
          >
            Back
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">Customer: {customer.name}</p>
      </header>

      <Card>
        <CardContent className="p-5">
        <FieldForm
          action={action}
          submitLabel="Create Field"
          pendingLabel="Creating..."
        />
        </CardContent>
      </Card>
    </section>
  );
}

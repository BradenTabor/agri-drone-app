import Link from "next/link";
import { notFound } from "next/navigation";

import { FieldForm } from "@/components/fields/FieldForm";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

import { updateFieldAction } from "../../actions";

type EditFieldPageProps = {
  params: Promise<{ id: string; fieldId: string }>;
};

export default async function EditFieldPage({ params }: EditFieldPageProps) {
  const { id: customerId, fieldId } = await params;
  const supabase = await createClient();

  const [{ data: customer, error: customerError }, { data: field, error: fieldError }] =
    await Promise.all([
      supabase
        .from("customers")
        .select("id,name")
        .eq("id", customerId)
        .is("deleted_at", null)
        .single(),
      supabase
        .from("fields")
        .select("id,name,default_lat,default_lng,acres,notes")
        .eq("id", fieldId)
        .eq("customer_id", customerId)
        .is("deleted_at", null)
        .single(),
    ]);

  if (customerError || !customer || fieldError || !field) {
    notFound();
  }

  const action = updateFieldAction.bind(null, customer.id, field.id);

  return (
    <section className="space-y-4">
      <header className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Edit Field</h1>
          <Link
            href={`/customers/${customer.id}`}
            className={buttonVariants({ variant: "outline" })}
          >
            Cancel
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">
          {customer.name} / {field.name}
        </p>
      </header>

      <Card>
        <CardContent className="p-5">
        <FieldForm
          action={action}
          submitLabel="Save Field"
          pendingLabel="Saving..."
          defaultValues={{
            name: field.name,
            defaultLat: field.default_lat,
            defaultLng: field.default_lng,
            acres: field.acres,
            notes: field.notes,
          }}
        />
        </CardContent>
      </Card>
    </section>
  );
}

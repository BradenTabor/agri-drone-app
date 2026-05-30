import Link from "next/link";
import { notFound } from "next/navigation";

import { CustomerForm } from "@/components/customers/CustomerForm";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

import { updateCustomerAction } from "../../actions";

type EditCustomerPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditCustomerPage({ params }: EditCustomerPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: customer, error } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error || !customer) {
    notFound();
  }

  const action = updateCustomerAction.bind(null, customer.id);

  return (
    <section className="space-y-4">
      <header className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Edit Customer</h1>
          <Link
            href={`/customers/${customer.id}`}
            className={buttonVariants({ variant: "outline" })}
          >
            Cancel
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">{customer.name}</p>
      </header>

      <Card>
        <CardContent className="p-5">
        <CustomerForm
          action={action}
          submitLabel="Save Changes"
          pendingLabel="Saving..."
          defaultValues={{
            name: customer.name,
            contactName: customer.contact_name,
            email: customer.email,
            phone: customer.phone,
            address: customer.address,
            city: customer.city,
            state: customer.state,
            zip: customer.zip,
            notes: customer.notes,
          }}
        />
        </CardContent>
      </Card>
    </section>
  );
}

import Link from "next/link";

import { CustomersListClient } from "@/components/customers/CustomersListClient";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function CustomersPage() {
  const supabase = await createClient();
  const { data: customers, error } = await supabase
    .from("customers")
    .select("*")
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (error) {
    throw new Error("Unable to load customers.");
  }

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
          <p className="text-sm text-muted-foreground">
            Manage customer accounts and field relationships.
          </p>
        </div>
        <Link href="/customers/new" className={buttonVariants()}>
          + New Customer
        </Link>
      </header>

      {!customers?.length ? (
        <Card>
          <CardContent className="p-5 text-sm text-muted-foreground">
            No customers yet. Create your first customer to get started.
          </CardContent>
        </Card>
      ) : (
        <CustomersListClient customers={customers} />
      )}
    </section>
  );
}

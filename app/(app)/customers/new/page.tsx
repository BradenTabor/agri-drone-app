import Link from "next/link";

import { CustomerForm } from "@/components/customers/CustomerForm";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { createCustomerAction } from "../actions";

export default function NewCustomerPage() {
  return (
    <section className="space-y-4">
      <header className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">New Customer</h1>
          <Link href="/customers" className={buttonVariants({ variant: "outline" })}>
            Back
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">
          Add the customer details now. Fields can be added on the detail page.
        </p>
      </header>

      <Card>
        <CardContent className="p-5">
        <CustomerForm
          action={createCustomerAction}
          submitLabel="Create Customer"
          pendingLabel="Creating..."
        />
        </CardContent>
      </Card>
    </section>
  );
}

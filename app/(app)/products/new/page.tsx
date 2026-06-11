import Link from "next/link";

import { ProductForm } from "@/components/products/ProductForm";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { createProductAction } from "../actions";

export default function NewProductPage() {
  return (
    <section className="space-y-4">
      <header className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">New Product</h1>
          <Link href="/products" className={buttonVariants({ variant: "outline" })}>
            Back
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">
          Add a product that can be selected in mix and application records.
        </p>
      </header>

      <Card>
        <CardContent className="p-5">
        <ProductForm
          action={createProductAction}
          submitLabel="Create Product"
          pendingLabel="Creating..."
        />
        </CardContent>
      </Card>
    </section>
  );
}

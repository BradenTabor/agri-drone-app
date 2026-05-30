import Link from "next/link";

import { ProductsListClient } from "@/components/products/ProductsListClient";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function ProductsPage() {
  const supabase = await createClient();
  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .is("deleted_at", null)
    .order("active", { ascending: false })
    .order("name", { ascending: true });

  if (error) {
    throw new Error("Unable to load products.");
  }

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground">
            Manage products used as selectable sources in mix records.
          </p>
        </div>
        <Link href="/products/new" className={buttonVariants()}>
          + New Product
        </Link>
      </header>

      {!products?.length ? (
        <Card>
          <CardContent className="p-5 text-sm text-muted-foreground">
            No products yet. Create your first product to get started.
          </CardContent>
        </Card>
      ) : (
        <ProductsListClient products={products} />
      )}
    </section>
  );
}

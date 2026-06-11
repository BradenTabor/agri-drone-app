import { Suspense } from "react";

import { ProductsLibraryClient } from "@/components/products/ProductsLibraryClient";
import { createClient } from "@/lib/supabase/server";

export default async function ProductsPage() {
  const supabase = await createClient();
  const [{ data: products, error: productsError }, { data: surfactants, error: surfactantsError }] =
    await Promise.all([
      supabase
        .from("products")
        .select("*")
        .is("deleted_at", null)
        .order("active", { ascending: false })
        .order("name", { ascending: true }),
      supabase
        .from("surfactants")
        .select("*")
        .is("deleted_at", null)
        .order("active", { ascending: false })
        .order("name", { ascending: true }),
    ]);

  if (productsError) {
    throw new Error("Unable to load products.");
  }
  if (surfactantsError) {
    throw new Error("Unable to load surfactants.");
  }

  return (
    <Suspense fallback={null}>
      <ProductsLibraryClient products={products ?? []} surfactants={surfactants ?? []} />
    </Suspense>
  );
}

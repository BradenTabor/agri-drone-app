import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductForm } from "@/components/products/ProductForm";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

import { updateProductAction } from "../../actions";

type EditProductPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error || !product) {
    notFound();
  }

  const action = updateProductAction.bind(null, product.id);

  return (
    <section className="space-y-4">
      <header className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Edit Product</h1>
          <Link href="/products" className={buttonVariants({ variant: "outline" })}>
            Cancel
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">{product.name}</p>
      </header>

      <Card>
        <CardContent className="p-5">
        <ProductForm
          action={action}
          submitLabel="Save Product"
          pendingLabel="Saving..."
          defaultValues={{
            name: product.name,
            manufacturer: product.manufacturer,
            epaNumber: product.epa_number,
            unitCost: product.unit_cost,
            retailCost: product.retail_cost,
            costUnit: product.cost_unit as "gal" | "oz" | "fl_oz" | "lb" | null,
            restrictedUse: product.restricted_use ?? false,
            active: product.active,
            ingredients: product.ingredients ?? [],
            notes: product.notes,
          }}
        />
        </CardContent>
      </Card>
    </section>
  );
}

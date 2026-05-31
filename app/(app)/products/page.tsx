import Link from "next/link";
import { BadgeAlert, CircleCheckBig, FlaskConical } from "lucide-react";

import { ProductsListClient } from "@/components/products/ProductsListClient";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
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

  const totalProducts = products?.length ?? 0;
  const activeProducts = (products ?? []).filter((item) => item.active).length;
  const restrictedUseProducts = (products ?? []).filter((item) => item.restricted_use).length;

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Products</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage products used as selectable sources in mix records.
          </p>
        </div>
        <Link
          href="/products/new"
          className={cn(
            buttonVariants(),
            "press-physics liquid-refraction rounded-xl border border-emerald-300/70 bg-emerald-500/90 text-emerald-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_12px_24px_rgba(16,185,129,0.26)] hover:bg-emerald-500",
          )}
        >
          + New Product
        </Link>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="liquid-reactive liquid-refraction surface-lift rounded-2xl border-white/60 bg-[linear-gradient(145deg,rgba(255,255,255,0.58),rgba(244,249,255,0.38))]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs tracking-[0.08em] text-muted-foreground uppercase">Total products</p>
              <FlaskConical className="size-4 text-emerald-600/80" aria-hidden="true" />
            </div>
            <p className="mt-2 text-3xl leading-none font-semibold">{totalProducts}</p>
          </CardContent>
        </Card>
        <Card className="liquid-reactive liquid-refraction surface-lift rounded-2xl border-white/60 bg-[linear-gradient(145deg,rgba(255,255,255,0.58),rgba(244,249,255,0.38))]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs tracking-[0.08em] text-muted-foreground uppercase">Active products</p>
              <CircleCheckBig className="size-4 text-emerald-600/80" aria-hidden="true" />
            </div>
            <p className="mt-2 text-3xl leading-none font-semibold">{activeProducts}</p>
          </CardContent>
        </Card>
        <Card className="liquid-reactive liquid-refraction surface-lift rounded-2xl border-white/60 bg-[linear-gradient(145deg,rgba(255,255,255,0.58),rgba(244,249,255,0.38))]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs tracking-[0.08em] text-muted-foreground uppercase">Restricted use</p>
              <BadgeAlert className="size-4 text-amber-600/80" aria-hidden="true" />
            </div>
            <p className="mt-2 text-3xl leading-none font-semibold">{restrictedUseProducts}</p>
          </CardContent>
        </Card>
      </div>

      {!products?.length ? (
        <Card className="liquid-reactive rounded-2xl border-white/60 bg-[linear-gradient(145deg,rgba(255,255,255,0.58),rgba(244,249,255,0.38))]">
          <CardHeader className="pb-0">
            <CardTitle>No products yet</CardTitle>
          </CardHeader>
          <CardContent className="p-5 text-sm text-muted-foreground">Create your first product to get started.</CardContent>
        </Card>
      ) : (
        <ProductsListClient products={products} />
      )}
    </section>
  );
}

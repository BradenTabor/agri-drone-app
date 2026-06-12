"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Droplets, FlaskConical } from "lucide-react";

import { ProductsListClient } from "@/components/products/ProductsListClient";
import { PageHeader } from "@/components/shared/PageHeader";
import { SummaryStatCard, SummaryStatsGrid } from "@/components/shared/SummaryStatCard";
import { SurfactantsListClient } from "@/components/surfactants/SurfactantsListClient";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Tables } from "@/types/database";

type Product = Tables<"products">;
type Surfactant = Tables<"surfactants">;

type ProductsLibraryClientProps = {
  products: Product[];
  surfactants: Surfactant[];
};

type LibraryTab = "products" | "surfactants";

export function ProductsLibraryClient({ products, surfactants }: ProductsLibraryClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab: LibraryTab = searchParams.get("tab") === "surfactants" ? "surfactants" : "products";

  const totalProducts = products.length;
  const activeProducts = products.filter((item) => item.active).length;
  const restrictedUseProducts = products.filter((item) => item.restricted_use).length;

  const totalSurfactants = surfactants.length;
  const activeSurfactants = surfactants.filter((item) => item.active).length;

  function setTab(tab: LibraryTab) {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "products") {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }
    const query = params.toString();
    router.replace(query ? `/products?${query}` : "/products", { scroll: false });
  }

  return (
    <section className="space-y-3 sm:space-y-5">
      <PageHeader
        title="Products & Surfactants"
        description="Manage products and surfactants used as selectable sources in mix and application records."
        action={
          <Link
            href={activeTab === "surfactants" ? "/products/surfactants/new" : "/products/new"}
            className={cn(
              buttonVariants(),
              "press-physics liquid-refraction rounded-xl border border-emerald-300/70 bg-emerald-500/90 text-emerald-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_12px_24px_rgba(16,185,129,0.26)] hover:bg-emerald-500",
            )}
          >
            {activeTab === "surfactants" ? "+ New Surfactant" : "+ New Product"}
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setTab("products")}
          className={cn(
            buttonVariants({ variant: activeTab === "products" ? "default" : "outline", size: "sm" }),
            "press-physics liquid-refraction min-h-10 justify-center rounded-xl",
            activeTab === "products"
              ? "border-emerald-300/70 bg-emerald-500/90 text-emerald-50"
              : "border-white/70 bg-white/74",
          )}
        >
          <FlaskConical className="size-4" aria-hidden="true" />
          Products
        </button>
        <button
          type="button"
          onClick={() => setTab("surfactants")}
          className={cn(
            buttonVariants({ variant: activeTab === "surfactants" ? "default" : "outline", size: "sm" }),
            "press-physics liquid-refraction min-h-10 justify-center rounded-xl",
            activeTab === "surfactants"
              ? "border-sky-300/70 bg-sky-500/90 text-sky-50"
              : "border-white/70 bg-white/74",
          )}
        >
          <Droplets className="size-4" aria-hidden="true" />
          Surfactants
        </button>
      </div>

      {activeTab === "products" ? (
        <>
          <SummaryStatsGrid>
            <SummaryStatCard label="Total products" value={totalProducts} icon={FlaskConical} iconClassName="text-emerald-600/80" />
            <SummaryStatCard label="Active products" value={activeProducts} icon={FlaskConical} iconClassName="text-emerald-600/80" />
            <SummaryStatCard label="Restricted use" value={restrictedUseProducts} icon={FlaskConical} iconClassName="text-amber-600/80" />
          </SummaryStatsGrid>

          {!products.length ? (
            <EmptyLibraryCard title="No products yet" message="Create your first product to get started." />
          ) : (
            <ProductsListClient products={products} />
          )}
        </>
      ) : (
        <>
          <SummaryStatsGrid columns={2}>
            <SummaryStatCard label="Total surfactants" value={totalSurfactants} icon={Droplets} iconClassName="text-sky-600/80" />
            <SummaryStatCard label="Active surfactants" value={activeSurfactants} icon={Droplets} iconClassName="text-sky-600/80" />
          </SummaryStatsGrid>

          {!surfactants.length ? (
            <EmptyLibraryCard
              title="No surfactants yet"
              message="Create your first surfactant to use in mix and application records."
            />
          ) : (
            <SurfactantsListClient surfactants={surfactants} />
          )}
        </>
      )}
    </section>
  );
}

function EmptyLibraryCard({ title, message }: { title: string; message: string }) {
  return (
    <Card className="liquid-reactive rounded-xl border-white/60 bg-[linear-gradient(145deg,rgba(255,255,255,0.58),rgba(244,249,255,0.38))] sm:rounded-2xl">
      <CardHeader className="p-3 pb-0 sm:p-6 sm:pb-0">
        <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-2 text-sm text-muted-foreground sm:p-5">{message}</CardContent>
    </Card>
  );
}

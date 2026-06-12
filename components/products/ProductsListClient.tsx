"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { softDeleteProductAction } from "@/app/(app)/products/actions";
import { ConfirmSubmitButton } from "@/components/shared/ConfirmSubmitButton";
import { ListSearchToolbar } from "@/components/shared/ListSearchToolbar";
import {
  RecordsListTable,
  RecordsPagination,
  type RecordsTableColumn,
} from "@/components/shared/RecordsListTable";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Tables } from "@/types/database";

type Product = Tables<"products">;

type ProductsListClientProps = {
  products: Product[];
};

function formatIngredients(ingredients: string[] | null | undefined) {
  if (!ingredients?.length) {
    return "—";
  }
  return ingredients.join(", ");
}

function matchesSearch(product: Product, search: string) {
  if (!search) {
    return true;
  }

  const haystack = [
    product.name,
    product.manufacturer,
    product.epa_number,
    product.notes,
    ...(product.ingredients ?? []),
    product.active ? "active" : "retired",
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(search);
}

function statusBadge(active: boolean) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2 py-0.5 text-xs font-medium",
        active
          ? "border-emerald-300/80 bg-emerald-100 text-emerald-700"
          : "border-amber-300/80 bg-amber-100 text-amber-700",
      )}
    >
      {active ? "Active" : "Retired"}
    </span>
  );
}

function classificationBadge(restrictedUse: boolean) {
  return restrictedUse ? (
    <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
      RUP
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
      General Use
    </span>
  );
}

export function ProductsListClient({ products }: ProductsListClientProps) {
  const PAGE_SIZE = 8;
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const normalizedQuery = query.trim().toLowerCase();

  const filteredProducts = useMemo(
    () => products.filter((product) => matchesSearch(product, normalizedQuery)),
    [products, normalizedQuery],
  );
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + PAGE_SIZE);

  const columns: RecordsTableColumn<Product>[] = [
    {
      id: "name",
      header: "Name",
      render: (product) => <span className="font-medium">{product.name}</span>,
    },
    {
      id: "manufacturer",
      header: "Manufacturer",
      hideOnMobile: true,
      render: (product) => product.manufacturer || "—",
    },
    {
      id: "epa",
      header: "EPA #",
      hideOnMobile: true,
      render: (product) => product.epa_number || "—",
    },
    {
      id: "classification",
      header: "Use classification",
      hideOnMobile: true,
      render: (product) => classificationBadge(product.restricted_use),
    },
    {
      id: "status",
      header: "Status",
      render: (product) => statusBadge(product.active),
    },
    {
      id: "actions",
      header: "Actions",
      headerClassName: "text-right",
      cellClassName: "text-right",
      render: (product) => (
        <div className="flex flex-wrap justify-end gap-2">
          <Link
            href={`/products/${product.id}/edit`}
            className={buttonVariants({
              size: "sm",
              variant: "outline",
              className:
                "press-physics liquid-refraction rounded-xl border-white/70 bg-white/74 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:border-white/20 dark:bg-white/10",
            })}
          >
            Edit
          </Link>
          <form action={softDeleteProductAction.bind(null, product.id)}>
            <ConfirmSubmitButton
              size="sm"
              variant="destructive"
              className="press-physics liquid-refraction rounded-xl border border-red-300/65 bg-red-100/78 text-red-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] hover:bg-red-100"
              confirmMessage={`Delete product ${product.name}? This can only be recovered by an admin.`}
            >
              Delete
            </ConfirmSubmitButton>
          </form>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      <ListSearchToolbar
        id="product-search"
        label="Search products"
        placeholder="Name, manufacturer, EPA #, ingredients..."
        query={query}
        onQueryChange={(value) => {
          setQuery(value);
          setPage(1);
        }}
        filteredCount={filteredProducts.length}
        totalCount={products.length}
      />

      {!filteredProducts.length ? (
        <Card className="liquid-reactive rounded-xl border-white/60 bg-[linear-gradient(145deg,rgba(255,255,255,0.58),rgba(244,249,255,0.38))] sm:rounded-2xl">
          <CardContent className="p-3 text-sm text-muted-foreground sm:p-5">No products match your search.</CardContent>
        </Card>
      ) : (
        <>
          <RecordsListTable
            rows={paginatedProducts}
            columns={columns}
            getRowKey={(product) => product.id}
            getRowHref={(product) => `/products/${product.id}/edit`}
            emptyMessage="No products match your search."
            mobileSummary={(product) => (
              <>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold tracking-tight">{product.name}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {product.manufacturer || "No manufacturer"}
                    </p>
                  </div>
                  {statusBadge(product.active)}
                </div>
                <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs text-muted-foreground">
                  <span>EPA: {product.epa_number || "—"}</span>
                  <span>{product.restricted_use ? "RUP" : "General Use"}</span>
                </div>
                <p className="line-clamp-2 text-xs text-muted-foreground">
                  {formatIngredients(product.ingredients)}
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Link
                    href={`/products/${product.id}/edit`}
                    className={buttonVariants({
                      size: "sm",
                      variant: "outline",
                      className:
                        "press-physics liquid-refraction rounded-xl border-white/70 bg-white/74 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:border-white/20 dark:bg-white/10",
                    })}
                  >
                    Edit
                  </Link>
                  <form action={softDeleteProductAction.bind(null, product.id)}>
                    <ConfirmSubmitButton
                      size="sm"
                      variant="destructive"
                      className="press-physics liquid-refraction rounded-xl border border-red-300/65 bg-red-100/78 text-red-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] hover:bg-red-100"
                      confirmMessage={`Delete product ${product.name}? This can only be recovered by an admin.`}
                    >
                      Delete
                    </ConfirmSubmitButton>
                  </form>
                </div>
              </>
            )}
          />
          <RecordsPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPrevious={() => setPage((current) => Math.max(1, current - 1))}
            onNext={() => setPage((current) => Math.min(totalPages, current + 1))}
          />
        </>
      )}
    </div>
  );
}

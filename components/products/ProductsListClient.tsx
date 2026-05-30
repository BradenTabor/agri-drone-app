"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { ConfirmSubmitButton } from "@/components/shared/ConfirmSubmitButton";
import { ListSearchToolbar } from "@/components/shared/ListSearchToolbar";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Tables } from "@/types/database";

import { softDeleteProductAction } from "@/app/(app)/products/actions";

type Product = Tables<"products">;

type ProductsListClientProps = {
  products: Product[];
};

function matchesSearch(product: Product, search: string) {
  if (!search) {
    return true;
  }

  const haystack = [
    product.name,
    product.manufacturer,
    product.epa_number,
    product.notes,
    product.active ? "active" : "retired",
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(search);
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

  return (
    <div className="space-y-4">
      <ListSearchToolbar
        id="product-search"
        label="Search products"
        placeholder="Name, manufacturer, EPA number, notes"
        query={query}
        onQueryChange={(value) => {
          setQuery(value);
          setPage(1);
        }}
        filteredCount={filteredProducts.length}
        totalCount={products.length}
      />

      {!filteredProducts.length ? (
        <Card>
          <CardContent className="p-5 text-sm text-muted-foreground">
            No products match your search.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-lg border lg:block">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Manufacturer</th>
                  <th className="px-4 py-3 font-medium">EPA #</th>
                  <th className="px-4 py-3 font-medium">Use classification</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProducts.map((item) => (
                  <ProductRow key={item.id} product={item} />
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 lg:hidden">
            {paginatedProducts.map((item) => (
              <Card
                key={item.id}
                className={cn(!item.active && "border-dashed opacity-80")}
              >
                <CardContent className="p-4">
                  <div className="space-y-1">
                    <h2 className="font-medium">{item.name}</h2>
                    <p className="text-sm text-muted-foreground">
                      {item.manufacturer || "No manufacturer"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      EPA:{" "}
                      <span className="font-mono text-xs">
                        {item.epa_number || "—"}
                      </span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {item.restricted_use ? "Restricted Use Pesticide (RUP)" : "General Use"}
                    </p>
                    <p
                      className={cn(
                        "text-xs",
                        item.active ? "text-emerald-600" : "text-amber-600",
                      )}
                    >
                      {item.active ? "Active" : "Retired"}
                    </p>
                  </div>
                  {item.notes ? (
                    <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                      {item.notes}
                    </p>
                  ) : null}
                  <div className="mt-4 flex gap-2">
                    <Link
                      href={`/products/${item.id}/edit`}
                      className={buttonVariants({ size: "sm", variant: "outline" })}
                    >
                      Edit
                    </Link>
                    <form action={softDeleteProductAction.bind(null, item.id)}>
                      <ConfirmSubmitButton
                        size="sm"
                        variant="destructive"
                        confirmMessage={`Delete product ${item.name}? This can only be recovered by an admin.`}
                      >
                        Delete
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {totalPages > 1 ? (
            <div className="flex items-center justify-between rounded-lg border bg-card/90 p-3">
              <p className="text-xs text-muted-foreground">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

function ProductRow({ product }: { product: Product }) {
  return (
    <tr
      className={cn(
        "border-t",
        !product.active && "bg-muted/20 text-muted-foreground",
      )}
    >
      <td className="px-4 py-3 font-medium">{product.name}</td>
      <td className="px-4 py-3">{product.manufacturer || "—"}</td>
      <td className="px-4 py-3">{product.epa_number || "—"}</td>
      <td className="px-4 py-3">
        {product.restricted_use ? (
          <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
            RUP
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
            General Use
          </span>
        )}
      </td>
      <td className="px-4 py-3">
        <span
          className={cn(
            "text-xs",
            product.active ? "text-emerald-600" : "text-amber-600",
          )}
        >
          {product.active ? "Active" : "Retired"}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-2">
          <Link
            href={`/products/${product.id}/edit`}
            className={buttonVariants({ size: "sm", variant: "outline" })}
          >
            Edit
          </Link>
          <form action={softDeleteProductAction.bind(null, product.id)}>
            <ConfirmSubmitButton
              size="sm"
              variant="destructive"
              confirmMessage={`Delete product ${product.name}? This can only be recovered by an admin.`}
            >
              Delete
            </ConfirmSubmitButton>
          </form>
        </div>
      </td>
    </tr>
  );
}

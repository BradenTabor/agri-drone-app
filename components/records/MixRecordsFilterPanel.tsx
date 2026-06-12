"use client";

import Link from "next/link";
import { ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";

import { saveRecordFilterAction } from "@/app/(app)/records/filterActions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { buildFilterHref, type MixRecordsFilterValues } from "@/lib/records/buildFilterHref";
import { cn } from "@/lib/utils";

export type { MixRecordsFilterValues };

type FilterOption = {
  id: string;
  label: string;
};

type SavedFilter = {
  id: string;
  name: string;
  filters: MixRecordsFilterValues;
};

type MixRecordsFilterPanelProps = {
  filters: MixRecordsFilterValues;
  customers: FilterOption[];
  applicators: FilterOption[];
  products: FilterOption[];
  savedFilters: SavedFilter[];
  totalCount: number;
};

function countActiveFilters(filters: MixRecordsFilterValues): number {
  return [
    filters.q,
    filters.dateFrom,
    filters.dateTo,
    filters.customerId,
    filters.applicatorId,
    filters.productId,
  ].filter((value) => typeof value === "string" && value.trim()).length;
}

export function MixRecordsFilterPanel({
  filters,
  customers,
  applicators,
  products,
  savedFilters,
  totalCount,
}: MixRecordsFilterPanelProps) {
  const activeCount = useMemo(() => countActiveFilters(filters), [filters]);
  const [expanded, setExpanded] = useState(activeCount > 0);

  return (
    <div className="liquid-reactive rounded-2xl border border-white/60 bg-[linear-gradient(145deg,rgba(255,255,255,0.58),rgba(244,249,255,0.38))] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-2xl dark:border-white/15 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.66),rgba(15,23,42,0.44))]">
      <form method="get" className="p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="q"
              placeholder="Search notes, customer, field..."
              defaultValue={filters.q ?? ""}
              className="rounded-xl border-white/70 bg-white/75 pl-9 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:border-white/15 dark:bg-white/8"
            />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="rounded-full border border-white/70 bg-white/70 px-2.5 py-1 text-xs font-medium text-muted-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:border-white/15 dark:bg-white/8">
              {totalCount} record{totalCount === 1 ? "" : "s"}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="press-physics liquid-refraction rounded-xl border-white/70 bg-white/74 shadow-[inset_0_1px_0_rgba(255,255,255,0.92)] dark:border-white/20 dark:bg-white/10"
              onClick={() => setExpanded((current) => !current)}
              aria-expanded={expanded}
            >
              <SlidersHorizontal className="size-3.5" />
              Filters
              {activeCount > 0 ? (
                <span className="rounded-full bg-primary px-1.5 py-0.5 text-[0.65rem] font-semibold text-primary-foreground">
                  {activeCount}
                </span>
              ) : null}
              <ChevronDown className={cn("size-3.5 transition-transform", expanded && "rotate-180")} />
            </Button>
            <Button
              type="submit"
              size="sm"
              className="press-physics rounded-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]"
            >
              Apply
            </Button>
            {activeCount > 0 ? (
              <Link
                href="/records"
                className={buttonVariants({
                  variant: "ghost",
                  size: "sm",
                  className: "rounded-xl px-2",
                })}
                aria-label="Clear filters"
              >
                <X className="size-4" />
              </Link>
            ) : null}
          </div>
        </div>

        {expanded ? (
          <div className="mt-3 space-y-3 border-t border-white/55 pt-3 dark:border-white/10">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div className="grid gap-1">
                <Label htmlFor="dateFrom" className="text-xs font-normal text-muted-foreground">
                  Date from
                </Label>
                <Input
                  id="dateFrom"
                  name="dateFrom"
                  type="date"
                  defaultValue={filters.dateFrom ?? ""}
                  className="rounded-xl border-white/70 bg-white/75 dark:border-white/15 dark:bg-white/8"
                />
              </div>
              <div className="grid gap-1">
                <Label htmlFor="dateTo" className="text-xs font-normal text-muted-foreground">
                  Date to
                </Label>
                <Input
                  id="dateTo"
                  name="dateTo"
                  type="date"
                  defaultValue={filters.dateTo ?? ""}
                  className="rounded-xl border-white/70 bg-white/75 dark:border-white/15 dark:bg-white/8"
                />
              </div>
              <div className="grid gap-1">
                <Label htmlFor="customerId" className="text-xs font-normal text-muted-foreground">
                  Customer
                </Label>
                <Select
                  id="customerId"
                  name="customerId"
                  defaultValue={filters.customerId ?? ""}
                  className="rounded-xl border-white/70 bg-white/75 dark:border-white/15 dark:bg-white/8"
                >
                  <option value="">All customers</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="grid gap-1">
                <Label htmlFor="applicatorId" className="text-xs font-normal text-muted-foreground">
                  Applicator
                </Label>
                <Select
                  id="applicatorId"
                  name="applicatorId"
                  defaultValue={filters.applicatorId ?? ""}
                  className="rounded-xl border-white/70 bg-white/75 dark:border-white/15 dark:bg-white/8"
                >
                  <option value="">All applicators</option>
                  {applicators.map((applicator) => (
                    <option key={applicator.id} value={applicator.id}>
                      {applicator.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="grid gap-1">
                <Label htmlFor="productId" className="text-xs font-normal text-muted-foreground">
                  Product
                </Label>
                <Select
                  id="productId"
                  name="productId"
                  defaultValue={filters.productId ?? ""}
                  className="rounded-xl border-white/70 bg-white/75 dark:border-white/15 dark:bg-white/8"
                >
                  <option value="">All products</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="border-t border-white/55 pt-3 dark:border-white/10">
              <div className="flex flex-wrap items-center gap-2">
                {savedFilters.map((savedFilter) => (
                  <Link
                    key={savedFilter.id}
                    href={`/records${buildFilterHref(savedFilter.filters ?? {})}`}
                    className={buttonVariants({
                      variant: "ghost",
                      size: "sm",
                      className: "rounded-xl",
                    })}
                  >
                    {savedFilter.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </form>

      {expanded ? (
        <form action={saveRecordFilterAction} className="flex flex-wrap items-center gap-2 border-t border-white/55 px-3 pb-3 pt-3 dark:border-white/10">
          <input type="hidden" name="q" value={filters.q ?? ""} />
          <input type="hidden" name="dateFrom" value={filters.dateFrom ?? ""} />
          <input type="hidden" name="dateTo" value={filters.dateTo ?? ""} />
          <input type="hidden" name="customerId" value={filters.customerId ?? ""} />
          <input type="hidden" name="applicatorId" value={filters.applicatorId ?? ""} />
          <input type="hidden" name="productId" value={filters.productId ?? ""} />
          <Input
            name="savedFilterName"
            placeholder="Save current filter as..."
            className="w-full max-w-xs rounded-xl border-white/70 bg-white/75 dark:border-white/15 dark:bg-white/8"
          />
          <Button
            type="submit"
            variant="outline"
            size="sm"
            className="press-physics rounded-xl border-white/70 bg-white/74 dark:border-white/20 dark:bg-white/10"
          >
            Save filter
          </Button>
        </form>
      ) : null}
    </div>
  );
}

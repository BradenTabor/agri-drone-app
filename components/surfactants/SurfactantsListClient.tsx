"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { softDeleteSurfactantAction } from "@/app/(app)/products/surfactants/actions";
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

type Surfactant = Tables<"surfactants">;

type SurfactantsListClientProps = {
  surfactants: Surfactant[];
};

function matchesSearch(surfactant: Surfactant, search: string) {
  if (!search) {
    return true;
  }

  const haystack = [
    surfactant.name,
    surfactant.manufacturer,
    surfactant.epa_number,
    surfactant.default_unit,
    surfactant.notes,
    surfactant.active ? "active" : "retired",
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

export function SurfactantsListClient({ surfactants }: SurfactantsListClientProps) {
  const PAGE_SIZE = 8;
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const normalizedQuery = query.trim().toLowerCase();

  const filteredSurfactants = useMemo(
    () => surfactants.filter((surfactant) => matchesSearch(surfactant, normalizedQuery)),
    [surfactants, normalizedQuery],
  );
  const totalPages = Math.max(1, Math.ceil(filteredSurfactants.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedSurfactants = filteredSurfactants.slice(startIndex, startIndex + PAGE_SIZE);

  const columns: RecordsTableColumn<Surfactant>[] = [
    {
      id: "name",
      header: "Name",
      render: (surfactant) => <span className="font-medium">{surfactant.name}</span>,
    },
    {
      id: "manufacturer",
      header: "Manufacturer",
      hideOnMobile: true,
      render: (surfactant) => surfactant.manufacturer || "—",
    },
    {
      id: "epa",
      header: "EPA #",
      hideOnMobile: true,
      render: (surfactant) => surfactant.epa_number || "—",
    },
    {
      id: "unit",
      header: "Default unit",
      hideOnMobile: true,
      render: (surfactant) => surfactant.default_unit || "—",
    },
    {
      id: "status",
      header: "Status",
      render: (surfactant) => statusBadge(surfactant.active),
    },
    {
      id: "actions",
      header: "Actions",
      headerClassName: "text-right",
      cellClassName: "text-right",
      render: (surfactant) => (
        <div className="flex flex-wrap justify-end gap-2">
          <Link
            href={`/products/surfactants/${surfactant.id}/edit`}
            className={buttonVariants({
              size: "sm",
              variant: "outline",
              className:
                "press-physics liquid-refraction rounded-xl border-white/70 bg-white/74 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:border-white/20 dark:bg-white/10",
            })}
          >
            Edit
          </Link>
          <form action={softDeleteSurfactantAction.bind(null, surfactant.id)}>
            <ConfirmSubmitButton
              size="sm"
              variant="destructive"
              className="press-physics liquid-refraction rounded-xl border border-red-300/65 bg-red-100/78 text-red-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] hover:bg-red-100"
              confirmMessage={`Delete surfactant ${surfactant.name}? This can only be recovered by an admin.`}
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
        id="surfactant-search"
        label="Search surfactants"
        placeholder="Name, manufacturer, EPA #, notes"
        query={query}
        onQueryChange={(value) => {
          setQuery(value);
          setPage(1);
        }}
        filteredCount={filteredSurfactants.length}
        totalCount={surfactants.length}
      />

      {!filteredSurfactants.length ? (
        <Card className="liquid-reactive rounded-xl border-white/60 bg-[linear-gradient(145deg,rgba(255,255,255,0.58),rgba(244,249,255,0.38))] sm:rounded-2xl">
          <CardContent className="p-3 text-sm text-muted-foreground sm:p-5">No surfactants match your search.</CardContent>
        </Card>
      ) : (
        <>
          <RecordsListTable
            rows={paginatedSurfactants}
            columns={columns}
            getRowKey={(surfactant) => surfactant.id}
            getRowHref={(surfactant) => `/products/surfactants/${surfactant.id}/edit`}
            emptyMessage="No surfactants match your search."
            mobileSummary={(surfactant) => (
              <>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold tracking-tight">{surfactant.name}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {surfactant.manufacturer || "No manufacturer"}
                    </p>
                  </div>
                  {statusBadge(surfactant.active)}
                </div>
                <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs text-muted-foreground">
                  <span>EPA: {surfactant.epa_number || "—"}</span>
                  <span>Unit: {surfactant.default_unit || "—"}</span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Link
                    href={`/products/surfactants/${surfactant.id}/edit`}
                    className={buttonVariants({
                      size: "sm",
                      variant: "outline",
                      className:
                        "press-physics liquid-refraction rounded-xl border-white/70 bg-white/74 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:border-white/20 dark:bg-white/10",
                    })}
                  >
                    Edit
                  </Link>
                  <form action={softDeleteSurfactantAction.bind(null, surfactant.id)}>
                    <ConfirmSubmitButton
                      size="sm"
                      variant="destructive"
                      className="press-physics liquid-refraction rounded-xl border border-red-300/65 bg-red-100/78 text-red-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] hover:bg-red-100"
                      confirmMessage={`Delete surfactant ${surfactant.name}? This can only be recovered by an admin.`}
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

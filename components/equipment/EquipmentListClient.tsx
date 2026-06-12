"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { softDeleteEquipmentAction } from "@/app/(app)/equipment/actions";
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

type Equipment = Tables<"equipment">;

type EquipmentListClientProps = {
  equipment: Equipment[];
};

function matchesSearch(item: Equipment, search: string) {
  if (!search) {
    return true;
  }

  const haystack = [item.identifier, item.type, item.notes, item.active ? "active" : "retired"]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(search);
}

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
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

export function EquipmentListClient({ equipment }: EquipmentListClientProps) {
  const PAGE_SIZE = 8;
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const normalizedQuery = query.trim().toLowerCase();

  const filteredEquipment = useMemo(
    () => equipment.filter((item) => matchesSearch(item, normalizedQuery)),
    [equipment, normalizedQuery],
  );
  const totalPages = Math.max(1, Math.ceil(filteredEquipment.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedEquipment = filteredEquipment.slice(startIndex, startIndex + PAGE_SIZE);

  const columns: RecordsTableColumn<Equipment>[] = [
    {
      id: "identifier",
      header: "Identifier",
      render: (item) => <span className="font-medium">{item.identifier}</span>,
    },
    {
      id: "type",
      header: "Type",
      hideOnMobile: true,
      render: (item) => (item.type ? titleCase(item.type) : "—"),
    },
    {
      id: "status",
      header: "Status",
      render: (item) => statusBadge(item.active),
    },
    {
      id: "actions",
      header: "Actions",
      headerClassName: "text-right",
      cellClassName: "text-right",
      render: (item) => (
        <div className="flex flex-wrap justify-end gap-2">
          <Link
            href={`/equipment/${item.id}/edit`}
            className={buttonVariants({
              size: "sm",
              variant: "outline",
              className:
                "press-physics liquid-refraction rounded-xl border-white/70 bg-white/74 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:border-white/20 dark:bg-white/10",
            })}
          >
            Edit
          </Link>
          <form action={softDeleteEquipmentAction.bind(null, item.id)}>
            <ConfirmSubmitButton
              size="sm"
              variant="destructive"
              className="press-physics liquid-refraction rounded-xl border border-red-300/65 bg-red-100/78 text-red-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] hover:bg-red-100"
              confirmMessage={`Delete equipment ${item.identifier}? This can only be recovered by an admin.`}
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
        id="equipment-search"
        label="Search equipment"
        placeholder="Identifier, type, notes, status"
        query={query}
        onQueryChange={(value) => {
          setQuery(value);
          setPage(1);
        }}
        filteredCount={filteredEquipment.length}
        totalCount={equipment.length}
      />

      {!filteredEquipment.length ? (
        <Card className="liquid-reactive rounded-xl border-white/60 bg-[linear-gradient(145deg,rgba(255,255,255,0.58),rgba(244,249,255,0.38))] sm:rounded-2xl">
          <CardContent className="p-3 text-sm text-muted-foreground sm:p-5">No equipment matches your search.</CardContent>
        </Card>
      ) : (
        <>
          <RecordsListTable
            rows={paginatedEquipment}
            columns={columns}
            getRowKey={(item) => item.id}
            getRowHref={(item) => `/equipment/${item.id}/edit`}
            emptyMessage="No equipment matches your search."
            mobileSummary={(item) => (
              <>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold tracking-tight">{item.identifier}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.type ? titleCase(item.type) : "No type selected"}
                    </p>
                  </div>
                  {statusBadge(item.active)}
                </div>
                {item.notes ? (
                  <p className="line-clamp-2 text-xs text-muted-foreground">{item.notes}</p>
                ) : null}
                <div className="flex flex-wrap gap-2 pt-1">
                  <Link
                    href={`/equipment/${item.id}/edit`}
                    className={buttonVariants({
                      size: "sm",
                      variant: "outline",
                      className:
                        "press-physics liquid-refraction rounded-xl border-white/70 bg-white/74 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:border-white/20 dark:bg-white/10",
                    })}
                  >
                    Edit
                  </Link>
                  <form action={softDeleteEquipmentAction.bind(null, item.id)}>
                    <ConfirmSubmitButton
                      size="sm"
                      variant="destructive"
                      className="press-physics liquid-refraction rounded-xl border border-red-300/65 bg-red-100/78 text-red-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] hover:bg-red-100"
                      confirmMessage={`Delete equipment ${item.identifier}? This can only be recovered by an admin.`}
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

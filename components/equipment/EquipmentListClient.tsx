"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { ConfirmSubmitButton } from "@/components/shared/ConfirmSubmitButton";
import { ListSearchToolbar } from "@/components/shared/ListSearchToolbar";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Tables } from "@/types/database";

import { softDeleteEquipmentAction } from "@/app/(app)/equipment/actions";

type Equipment = Tables<"equipment">;

type EquipmentListClientProps = {
  equipment: Equipment[];
};

function matchesSearch(item: Equipment, search: string) {
  if (!search) {
    return true;
  }

  const haystack = [
    item.identifier,
    item.type,
    item.notes,
    item.active ? "active" : "retired",
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(search);
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

  return (
    <div className="space-y-4">
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
        <Card className="liquid-reactive rounded-2xl border-white/60 bg-[linear-gradient(145deg,rgba(255,255,255,0.58),rgba(244,249,255,0.38))]">
          <CardContent className="p-5 text-sm text-muted-foreground">
            No equipment matches your search.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="liquid-reactive hidden overflow-x-auto rounded-2xl border border-white/60 bg-white/52 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-2xl md:block">
            <table className="w-full text-sm">
              <thead className="bg-[linear-gradient(145deg,rgba(255,255,255,0.78),rgba(244,249,255,0.48))] text-left text-slate-700">
                <tr>
                  <th className="px-4 py-3 font-medium">Identifier</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedEquipment.map((item) => (
                  <EquipmentRow key={item.id} equipment={item} />
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 md:hidden">
            {paginatedEquipment.map((item) => (
              <Card
                key={item.id}
                className={cn(
                  "liquid-reactive liquid-refraction surface-lift rounded-2xl border-white/60 bg-[linear-gradient(145deg,rgba(255,255,255,0.58),rgba(244,249,255,0.38))]",
                  !item.active && "border-dashed",
                )}
              >
                <CardContent className="p-4">
                  <div className="space-y-1">
                    <h2 className="text-base font-semibold tracking-tight">{item.identifier}</h2>
                    <p className="text-sm text-muted-foreground">
                      {item.type ? titleCase(item.type) : "No type selected"}
                    </p>
                    <span
                      className={cn(
                        "inline-flex w-fit rounded-full border px-2 py-0.5 text-xs font-medium",
                        item.active
                          ? "border-emerald-300/80 bg-emerald-100 text-emerald-700"
                          : "border-amber-300/80 bg-amber-100 text-amber-700",
                      )}
                    >
                      {item.active ? "Active" : "Retired"}
                    </span>
                  </div>
                  {item.notes ? (
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {item.notes}
                    </p>
                  ) : null}
                  <div className="mt-4 flex gap-2">
                    <Link
                      href={`/equipment/${item.id}/edit`}
                      className={buttonVariants({
                        size: "sm",
                        variant: "outline",
                        className:
                          "press-physics liquid-refraction rounded-xl border-white/70 bg-white/74 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]",
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
                </CardContent>
              </Card>
            ))}
          </div>
          {totalPages > 1 ? (
            <div className="liquid-reactive flex items-center justify-between rounded-2xl border border-white/60 bg-white/58 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
              <p className="text-xs text-muted-foreground">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={buttonVariants({
                    variant: "outline",
                    size: "sm",
                    className:
                      "press-physics liquid-refraction rounded-xl border-white/70 bg-white/78 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]",
                  })}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className={buttonVariants({
                    variant: "outline",
                    size: "sm",
                    className:
                      "press-physics liquid-refraction rounded-xl border-white/70 bg-white/78 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]",
                  })}
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

function EquipmentRow({ equipment }: { equipment: Equipment }) {
  return (
    <tr
      className={cn(
        "border-t border-white/55 transition-colors hover:bg-white/34",
        !equipment.active && "bg-amber-50/20 text-muted-foreground",
      )}
    >
      <td className="px-4 py-3 font-medium tracking-tight">{equipment.identifier}</td>
      <td className="px-4 py-3">
        {equipment.type ? titleCase(equipment.type) : "—"}
      </td>
      <td className="px-4 py-3">
        <span
          className={cn(
            "inline-flex rounded-full border px-2 py-0.5 text-xs font-medium",
            equipment.active
              ? "border-emerald-300/80 bg-emerald-100 text-emerald-700"
              : "border-amber-300/80 bg-amber-100 text-amber-700",
          )}
        >
          {equipment.active ? "Active" : "Retired"}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-2">
          <Link
            href={`/equipment/${equipment.id}/edit`}
            className={buttonVariants({
              size: "sm",
              variant: "outline",
              className:
                "press-physics liquid-refraction rounded-xl border-white/70 bg-white/76 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]",
            })}
          >
            Edit
          </Link>
          <form action={softDeleteEquipmentAction.bind(null, equipment.id)}>
            <ConfirmSubmitButton
              size="sm"
              variant="destructive"
              className="press-physics liquid-refraction rounded-xl border border-red-300/65 bg-red-100/78 text-red-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] hover:bg-red-100"
              confirmMessage={`Delete equipment ${equipment.identifier}? This can only be recovered by an admin.`}
            >
              Delete
            </ConfirmSubmitButton>
          </form>
        </div>
      </td>
    </tr>
  );
}

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

import Link from "next/link";
import type { ReactNode } from "react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type RecordsTableColumn<T> = {
  id: string;
  header: string;
  headerClassName?: string;
  cellClassName?: string;
  hideOnMobile?: boolean;
  render: (row: T) => ReactNode;
};

type RecordsListTableProps<T> = {
  rows: T[];
  columns: RecordsTableColumn<T>[];
  getRowKey: (row: T) => string;
  getRowHref?: (row: T) => string;
  emptyMessage?: string;
  mobileSummary?: (row: T) => ReactNode;
};

const tableShellClassName =
  "liquid-reactive overflow-hidden rounded-2xl border border-white/60 bg-white/52 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-2xl dark:border-white/15 dark:bg-white/8";

const theadClassName =
  "bg-[linear-gradient(145deg,rgba(255,255,255,0.78),rgba(244,249,255,0.48))] text-left text-slate-700 dark:text-slate-200";

const actionButtonClassName =
  "press-physics liquid-refraction rounded-xl border-white/70 bg-white/74 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:border-white/20 dark:bg-white/10";

export function RecordsListTable<T>({
  rows,
  columns,
  getRowKey,
  getRowHref,
  emptyMessage = "No records found.",
  mobileSummary,
}: RecordsListTableProps<T>) {
  if (!rows.length) {
    return (
      <div className={cn(tableShellClassName, "p-5 text-sm text-muted-foreground")}>{emptyMessage}</div>
    );
  }

  const mobileColumns = columns.filter((column) => !column.hideOnMobile);
  const desktopColumns = columns;

  return (
    <>
      <div className={cn(tableShellClassName, "hidden md:block")}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className={theadClassName}>
              <tr>
                {desktopColumns.map((column) => (
                  <th
                    key={column.id}
                    className={cn("px-4 py-3 font-medium whitespace-nowrap", column.headerClassName)}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={getRowKey(row)}
                  className="border-t border-white/55 transition-colors hover:bg-white/34 dark:border-white/10 dark:hover:bg-white/5"
                >
                  {desktopColumns.map((column) => (
                    <td key={column.id} className={cn("px-4 py-3 align-top", column.cellClassName)}>
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={cn(tableShellClassName, "md:hidden")}>
        <div className="divide-y divide-white/55 dark:divide-white/10">
          {rows.map((row) => {
            const rowHref = getRowHref?.(row);
            const content = (
              <>
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                  <div className="min-w-0 space-y-2">
                    {mobileSummary ? (
                      mobileSummary(row)
                    ) : (
                      <div className="grid gap-2">
                        {mobileColumns.map((column) => (
                          <div key={column.id} className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-2 text-sm">
                            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                              {column.header}
                            </span>
                            <span className="min-w-0 break-words">{column.render(row)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {rowHref ? (
                    <Link
                      href={rowHref}
                      className={buttonVariants({
                        size: "sm",
                        variant: "outline",
                        className: cn(actionButtonClassName, "shrink-0"),
                      })}
                    >
                      View
                    </Link>
                  ) : null}
                </div>
              </>
            );

            return (
              <div key={getRowKey(row)} className="px-3 py-3">
                {content}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

type RecordActionLinksProps = {
  viewHref: string;
  editHref: string;
  deleteForm?: ReactNode;
};

export function RecordActionLinks({ viewHref, editHref, deleteForm }: RecordActionLinksProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={viewHref}
        className={buttonVariants({ size: "sm", variant: "outline", className: actionButtonClassName })}
      >
        View
      </Link>
      <Link
        href={editHref}
        className={buttonVariants({ size: "sm", variant: "outline", className: actionButtonClassName })}
      >
        Edit
      </Link>
      {deleteForm}
    </div>
  );
}

type RecordsPaginationProps = {
  currentPage: number;
  totalPages: number;
  onPrevious?: () => void;
  onNext?: () => void;
  previousHref?: string;
  nextHref?: string;
};

export function RecordsPagination({
  currentPage,
  totalPages,
  onPrevious,
  onNext,
  previousHref,
  nextHref,
}: RecordsPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <div className="liquid-reactive flex items-center justify-between rounded-2xl border border-white/60 bg-white/58 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:border-white/15 dark:bg-white/8">
      <p className="text-xs text-muted-foreground">
        Page {currentPage} of {totalPages}
      </p>
      <div className="flex gap-2">
        {previousHref ? (
          hasPrev ? (
            <Link
              href={previousHref}
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className: actionButtonClassName,
              })}
            >
              Previous
            </Link>
          ) : (
            <span
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className: cn(actionButtonClassName, "pointer-events-none opacity-50"),
              })}
            >
              Previous
            </span>
          )
        ) : (
          <button
            type="button"
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: actionButtonClassName,
            })}
            onClick={onPrevious}
            disabled={!hasPrev}
          >
            Previous
          </button>
        )}
        {nextHref ? (
          hasNext ? (
            <Link
              href={nextHref}
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className: actionButtonClassName,
              })}
            >
              Next
            </Link>
          ) : (
            <span
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className: cn(actionButtonClassName, "pointer-events-none opacity-50"),
              })}
            >
              Next
            </span>
          )
        ) : (
          <button
            type="button"
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: actionButtonClassName,
            })}
            onClick={onNext}
            disabled={!hasNext}
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}

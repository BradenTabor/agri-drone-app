"use client";

import Link from "next/link";

import {
  RecordActionLinks,
  RecordsListTable,
  RecordsPagination,
  type RecordsTableColumn,
} from "@/components/shared/RecordsListTable";
import { buttonVariants } from "@/components/ui/button";

export type MixRecordListItem = {
  id: string;
  record_date: string;
  time_mixed: string;
  customer_name_snapshot: string | null;
  field_name_snapshot: string | null;
  signed_typed_name: string;
  total_mix_gal: number;
  expected_acres: number;
  actual_acres: number | null;
};

type MixRecordsListClientProps = {
  records: MixRecordListItem[];
  currentPage: number;
  totalPages: number;
  previousHref?: string;
  nextHref?: string;
  emptyMessage?: string;
};

const columns: RecordsTableColumn<MixRecordListItem>[] = [
  {
    id: "date",
    header: "Date",
    render: (record) => (
      <div>
        <div className="font-medium">{record.record_date}</div>
        <div className="text-xs text-muted-foreground">{record.time_mixed}</div>
      </div>
    ),
  },
  {
    id: "customer",
    header: "Customer",
    render: (record) => record.customer_name_snapshot || "—",
  },
  {
    id: "field",
    header: "Field",
    hideOnMobile: true,
    render: (record) => record.field_name_snapshot || "—",
  },
  {
    id: "applicator",
    header: "Applicator",
    render: (record) => record.signed_typed_name,
  },
  {
    id: "mix",
    header: "Total mix",
    hideOnMobile: true,
    render: (record) => `${record.total_mix_gal} gal`,
  },
  {
    id: "acres",
    header: "Acres",
    render: (record) => (
      <div>
        <div>Expected {record.expected_acres}</div>
        <div className="text-xs text-muted-foreground">Actual {record.actual_acres ?? "—"}</div>
      </div>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    headerClassName: "text-right",
    cellClassName: "text-right",
    render: (record) => (
      <RecordActionLinks viewHref={`/records/${record.id}`} editHref={`/records/${record.id}/edit`} />
    ),
  },
];

export function MixRecordsListClient({
  records,
  currentPage,
  totalPages,
  previousHref,
  nextHref,
  emptyMessage = "No records match your filters.",
}: MixRecordsListClientProps) {
  return (
    <div className="space-y-3">
      <RecordsListTable
        rows={records}
        columns={columns}
        getRowKey={(record) => record.id}
        getRowHref={(record) => `/records/${record.id}`}
        emptyMessage={emptyMessage}
        mobileSummary={(record) => (
          <>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold tracking-tight">{record.record_date}</p>
                <p className="text-xs text-muted-foreground">{record.time_mixed}</p>
              </div>
              <span className="rounded-full border border-white/70 bg-white/70 px-2 py-0.5 text-xs text-muted-foreground dark:border-white/15 dark:bg-white/8">
                {record.total_mix_gal} gal
              </span>
            </div>
            <p className="text-sm">
              <span className="font-medium">{record.customer_name_snapshot || "—"}</span>
              {record.field_name_snapshot ? (
                <span className="text-muted-foreground"> · {record.field_name_snapshot}</span>
              ) : null}
            </p>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span>{record.signed_typed_name}</span>
              <span>
                {record.expected_acres} ac expected
                {record.actual_acres != null ? ` · ${record.actual_acres} ac actual` : ""}
              </span>
            </div>
            <div className="flex gap-2 pt-1">
              <Link
                href={`/records/${record.id}/edit`}
                className={buttonVariants({
                  size: "sm",
                  variant: "outline",
                  className:
                    "press-physics liquid-refraction rounded-xl border-white/70 bg-white/74 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:border-white/20 dark:bg-white/10",
                })}
              >
                Edit
              </Link>
            </div>
          </>
        )}
      />

      <RecordsPagination
        currentPage={currentPage}
        totalPages={totalPages}
        previousHref={previousHref}
        nextHref={nextHref}
      />
    </div>
  );
}

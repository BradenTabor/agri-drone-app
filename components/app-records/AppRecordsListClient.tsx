"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { softDeleteAppRecordAction } from "@/app/(app)/app-records/actions";
import { ListSearchToolbar } from "@/components/shared/ListSearchToolbar";
import {
  RecordActionLinks,
  RecordsListTable,
  RecordsPagination,
  type RecordsTableColumn,
} from "@/components/shared/RecordsListTable";
import { ConfirmSubmitButton } from "@/components/shared/ConfirmSubmitButton";
import { buttonVariants } from "@/components/ui/button";

type AppRecordListItem = {
  id: string;
  job_date: string;
  customer_name: string;
  job_site_id: string | null;
  applicator_name: string;
  acres_treated: number | null;
  app_method: string | null;
};

type AppRecordsListClientProps = {
  records: AppRecordListItem[];
};

const PAGE_SIZE = 10;

function formatMethod(method: string | null): string {
  if (!method) return "—";
  return method
    .split("_")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function matchesSearch(record: AppRecordListItem, search: string): boolean {
  if (!search) {
    return true;
  }

  const haystack = [
    record.job_date,
    record.customer_name,
    record.job_site_id,
    record.applicator_name,
    formatMethod(record.app_method),
    record.acres_treated?.toString(),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(search);
}

export function AppRecordsListClient({ records }: AppRecordsListClientProps) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const normalizedQuery = query.trim().toLowerCase();

  const filteredRecords = useMemo(
    () => records.filter((record) => matchesSearch(record, normalizedQuery)),
    [records, normalizedQuery],
  );
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedRecords = filteredRecords.slice(startIndex, startIndex + PAGE_SIZE);

  const columns: RecordsTableColumn<AppRecordListItem>[] = [
    {
      id: "date",
      header: "Date",
      render: (record) => <span className="font-medium">{record.job_date}</span>,
    },
    {
      id: "customer",
      header: "Customer",
      render: (record) => record.customer_name,
    },
    {
      id: "jobSite",
      header: "Job/Site ID",
      hideOnMobile: true,
      render: (record) => record.job_site_id || "—",
    },
    {
      id: "applicator",
      header: "Applicator",
      render: (record) => record.applicator_name,
    },
    {
      id: "acres",
      header: "Acres",
      render: (record) => record.acres_treated ?? "—",
    },
    {
      id: "method",
      header: "Method",
      hideOnMobile: true,
      render: (record) => formatMethod(record.app_method),
    },
    {
      id: "actions",
      header: "Actions",
      headerClassName: "text-right",
      cellClassName: "text-right",
      render: (record) => (
        <RecordActionLinks
          viewHref={`/app-records/${record.id}`}
          editHref={`/app-records/${record.id}/edit`}
          deleteForm={
            <form action={softDeleteAppRecordAction.bind(null, record.id)}>
              <ConfirmSubmitButton
                size="sm"
                variant="destructive"
                confirmMessage={`Delete application record for ${record.customer_name} on ${record.job_date}?`}
              >
                Delete
              </ConfirmSubmitButton>
            </form>
          }
        />
      ),
    },
  ];

  return (
    <div className="space-y-3">
      <ListSearchToolbar
        id="app-record-search"
        label="Search application records"
        placeholder="Customer, applicator, job/site ID, method..."
        query={query}
        onQueryChange={(value) => {
          setQuery(value);
          setPage(1);
        }}
        filteredCount={filteredRecords.length}
        totalCount={records.length}
      />

      <RecordsListTable
        rows={paginatedRecords}
        columns={columns}
        getRowKey={(record) => record.id}
        getRowHref={(record) => `/app-records/${record.id}`}
        emptyMessage={
          records.length
            ? "No application records match your search."
            : "No application records yet. Create your first record to get started."
        }
        mobileSummary={(record) => (
          <>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold tracking-tight">{record.job_date}</p>
                <p className="text-sm font-medium">{record.customer_name}</p>
              </div>
              {record.acres_treated != null ? (
                <span className="rounded-full border border-white/70 bg-white/70 px-2 py-0.5 text-xs text-muted-foreground dark:border-white/15 dark:bg-white/8">
                  {record.acres_treated} ac
                </span>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span>{record.applicator_name}</span>
              {record.job_site_id ? <span>Site {record.job_site_id}</span> : null}
              <span>{formatMethod(record.app_method)}</span>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <Link
                href={`/app-records/${record.id}/edit`}
                className={buttonVariants({
                  size: "sm",
                  variant: "outline",
                  className:
                    "press-physics liquid-refraction rounded-xl border-white/70 bg-white/74 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:border-white/20 dark:bg-white/10",
                })}
              >
                Edit
              </Link>
              <form action={softDeleteAppRecordAction.bind(null, record.id)}>
                <ConfirmSubmitButton
                  size="sm"
                  variant="destructive"
                  confirmMessage={`Delete application record for ${record.customer_name} on ${record.job_date}?`}
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
    </div>
  );
}

"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { softDeleteQuoteAction } from "@/app/(app)/quotes/actions";
import { ConfirmSubmitButton } from "@/components/shared/ConfirmSubmitButton";
import { ListSearchToolbar } from "@/components/shared/ListSearchToolbar";
import {
  RecordActionLinks,
  RecordsListTable,
  RecordsPagination,
  type RecordsTableColumn,
} from "@/components/shared/RecordsListTable";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type QuoteListItem = {
  id: string;
  quote_number: string | null;
  customer_name: string;
  status: "draft" | "sent" | "accepted" | "declined";
  quote_date: string;
  total: number;
};

type QuotesListClientProps = {
  quotes: QuoteListItem[];
};

function matchesSearch(quote: QuoteListItem, search: string) {
  if (!search) return true;
  return [quote.quote_number, quote.customer_name, quote.status, quote.quote_date]
    .join(" ")
    .toLowerCase()
    .includes(search);
}

function formatMoney(value: number) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function statusBadgeClass(status: QuoteListItem["status"]) {
  if (status === "sent") return "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300";
  if (status === "accepted") return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
  if (status === "declined") return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
  return "bg-muted text-muted-foreground";
}

function statusLabel(status: QuoteListItem["status"]) {
  if (status === "sent") return "Sent";
  if (status === "accepted") return "Accepted";
  if (status === "declined") return "Declined";
  return "Draft";
}

export function QuotesListClient({ quotes }: QuotesListClientProps) {
  const PAGE_SIZE = 8;
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const normalizedQuery = query.trim().toLowerCase();

  const filteredQuotes = useMemo(
    () => quotes.filter((quote) => matchesSearch(quote, normalizedQuery)),
    [quotes, normalizedQuery],
  );
  const totalPages = Math.max(1, Math.ceil(filteredQuotes.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedQuotes = filteredQuotes.slice(startIndex, startIndex + PAGE_SIZE);

  const columns: RecordsTableColumn<QuoteListItem>[] = [
    {
      id: "quote",
      header: "Quote # / Date",
      render: (quote) => (
        <div>
          <div className="font-medium">{quote.quote_number || "Unnumbered quote"}</div>
          <div className="text-xs text-muted-foreground">{quote.quote_date}</div>
        </div>
      ),
    },
    {
      id: "customer",
      header: "Customer",
      render: (quote) => quote.customer_name,
    },
    {
      id: "status",
      header: "Status",
      render: (quote) => (
        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(quote.status)}`}>
          {statusLabel(quote.status)}
        </span>
      ),
    },
    {
      id: "total",
      header: "Total",
      hideOnMobile: true,
      render: (quote) => formatMoney(quote.total),
    },
    {
      id: "actions",
      header: "Actions",
      headerClassName: "text-right",
      cellClassName: "text-right",
      render: (quote) => (
        <RecordActionLinks
          viewHref={`/quotes/${quote.id}`}
          editHref={`/quotes/${quote.id}/edit`}
          deleteForm={
            <form action={softDeleteQuoteAction.bind(null, quote.id)}>
              <ConfirmSubmitButton
                size="sm"
                variant="destructive"
                confirmMessage={`Delete quote ${quote.quote_number || quote.id}?`}
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
        id="quote-search"
        label="Search quotes"
        placeholder="Quote #, customer, status"
        query={query}
        onQueryChange={(value) => {
          setQuery(value);
          setPage(1);
        }}
        filteredCount={filteredQuotes.length}
        totalCount={quotes.length}
      />

      {!filteredQuotes.length ? (
        <Card className="liquid-reactive rounded-xl border-white/60 sm:rounded-2xl">
          <CardContent className="p-3 text-sm text-muted-foreground sm:p-5">No quotes match your search.</CardContent>
        </Card>
      ) : (
        <>
          <RecordsListTable
            rows={paginatedQuotes}
            columns={columns}
            getRowKey={(quote) => quote.id}
            getRowHref={(quote) => `/quotes/${quote.id}`}
            emptyMessage="No quotes match your search."
            mobileSummary={(quote) => (
              <>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold tracking-tight">{quote.quote_number || "Unnumbered quote"}</p>
                    <p className="text-xs text-muted-foreground">{quote.quote_date}</p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold">{formatMoney(quote.total)}</span>
                </div>
                <p className="truncate text-sm">{quote.customer_name}</p>
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(quote.status)}`}>
                  {statusLabel(quote.status)}
                </span>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Link
                    href={`/quotes/${quote.id}/edit`}
                    className={buttonVariants({ size: "sm", variant: "outline" })}
                  >
                    Edit
                  </Link>
                  <form action={softDeleteQuoteAction.bind(null, quote.id)}>
                    <ConfirmSubmitButton
                      size="sm"
                      variant="destructive"
                      confirmMessage={`Delete quote ${quote.quote_number || quote.id}?`}
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

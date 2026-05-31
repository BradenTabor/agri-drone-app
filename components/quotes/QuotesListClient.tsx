"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { softDeleteQuoteAction } from "@/app/(app)/quotes/actions";
import { ConfirmSubmitButton } from "@/components/shared/ConfirmSubmitButton";
import { ListSearchToolbar } from "@/components/shared/ListSearchToolbar";
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
  return [quote.quote_number, quote.customer_name, quote.status, quote.quote_date].join(" ").toLowerCase().includes(search);
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

  return (
    <div className="space-y-4">
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
        <Card>
          <CardContent className="p-5 text-sm text-muted-foreground">
            No quotes match your search.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-lg border lg:block">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Quote # / Date</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedQuotes.map((quote) => (
                  <tr key={quote.id} className="border-t">
                    <td className="px-4 py-3">
                      <div className="font-medium">{quote.quote_number || "Unnumbered quote"}</div>
                      <div className="text-xs text-muted-foreground">{quote.quote_date}</div>
                    </td>
                    <td className="px-4 py-3">{quote.customer_name}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(quote.status)}`}>
                        {statusLabel(quote.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">{formatMoney(quote.total)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Link href={`/quotes/${quote.id}`} className={buttonVariants({ size: "sm", variant: "outline" })}>
                          View
                        </Link>
                        <Link href={`/quotes/${quote.id}/edit`} className={buttonVariants({ size: "sm", variant: "outline" })}>
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 lg:hidden">
            {paginatedQuotes.map((quote) => (
              <Card key={quote.id}>
                <CardContent className="p-4">
                  <div className="space-y-1">
                    <h2 className="font-medium">{quote.quote_number || "Unnumbered quote"}</h2>
                    <p className="text-sm text-muted-foreground">{quote.quote_date}</p>
                    <p className="text-sm text-muted-foreground">{quote.customer_name}</p>
                    <div>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(quote.status)}`}>
                        {statusLabel(quote.status)}
                      </span>
                    </div>
                    <p className="text-sm font-medium">{formatMoney(quote.total)}</p>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Link href={`/quotes/${quote.id}`} className={buttonVariants({ size: "sm", variant: "outline" })}>
                      View
                    </Link>
                    <Link href={`/quotes/${quote.id}/edit`} className={buttonVariants({ size: "sm", variant: "outline" })}>
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

"use client";

import { useMemo, useState } from "react";

import { ListSearchToolbar } from "@/components/shared/ListSearchToolbar";
import {
  RecordActionLinks,
  RecordsListTable,
  RecordsPagination,
  type RecordsTableColumn,
} from "@/components/shared/RecordsListTable";
import { Card, CardContent } from "@/components/ui/card";
import type { Tables } from "@/types/database";

type Customer = Tables<"customers">;

type CustomersListClientProps = {
  customers: Customer[];
};

function matchesSearch(customer: Customer, search: string) {
  if (!search) {
    return true;
  }

  const haystack = [
    customer.name,
    customer.contact_name,
    customer.email,
    customer.phone,
    customer.city,
    customer.state,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(search);
}

export function CustomersListClient({ customers }: CustomersListClientProps) {
  const PAGE_SIZE = 8;
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const normalizedQuery = query.trim().toLowerCase();

  const filteredCustomers = useMemo(
    () => customers.filter((customer) => matchesSearch(customer, normalizedQuery)),
    [customers, normalizedQuery],
  );
  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedCustomers = filteredCustomers.slice(startIndex, startIndex + PAGE_SIZE);

  const columns: RecordsTableColumn<Customer>[] = [
    {
      id: "name",
      header: "Name",
      render: (customer) => <span className="font-medium">{customer.name}</span>,
    },
    {
      id: "contact",
      header: "Contact",
      render: (customer) => (
        <div>
          <div>{customer.contact_name || "—"}</div>
          <div className="text-xs text-muted-foreground">
            {customer.email || customer.phone || "No email or phone"}
          </div>
        </div>
      ),
    },
    {
      id: "location",
      header: "Location",
      hideOnMobile: true,
      render: (customer) => [customer.city, customer.state].filter(Boolean).join(", ") || "—",
    },
    {
      id: "actions",
      header: "Actions",
      headerClassName: "text-right",
      cellClassName: "text-right",
      render: (customer) => (
        <RecordActionLinks
          viewHref={`/customers/${customer.id}`}
          editHref={`/customers/${customer.id}/edit`}
        />
      ),
    },
  ];

  return (
    <div className="space-y-3">
      <ListSearchToolbar
        id="customer-search"
        label="Search customers"
        placeholder="Name, contact, email, phone, city..."
        query={query}
        onQueryChange={(value) => {
          setQuery(value);
          setPage(1);
        }}
        filteredCount={filteredCustomers.length}
        totalCount={customers.length}
      />

      {!filteredCustomers.length ? (
        <Card className="liquid-reactive rounded-xl border-white/60 bg-[linear-gradient(145deg,rgba(255,255,255,0.58),rgba(244,249,255,0.38))] sm:rounded-2xl">
          <CardContent className="p-3 text-sm text-muted-foreground sm:p-5">No customers match your search.</CardContent>
        </Card>
      ) : (
        <>
          <RecordsListTable
            rows={paginatedCustomers}
            columns={columns}
            getRowKey={(customer) => customer.id}
            getRowHref={(customer) => `/customers/${customer.id}`}
            emptyMessage="No customers match your search."
            mobileSummary={(customer) => (
              <>
                <p className="font-semibold tracking-tight">{customer.name}</p>
                <p className="text-sm text-muted-foreground">{customer.contact_name || "No contact name"}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {[customer.city, customer.state].filter(Boolean).join(", ") || "Location not set"}
                  {" · "}
                  {customer.email || customer.phone || "No contact info"}
                </p>
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

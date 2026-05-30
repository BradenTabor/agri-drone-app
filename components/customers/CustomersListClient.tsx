"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { ListSearchToolbar } from "@/components/shared/ListSearchToolbar";
import { buttonVariants } from "@/components/ui/button";
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

  return (
    <div className="space-y-4">
      <ListSearchToolbar
        id="customer-search"
        label="Search customers"
        placeholder="Name, contact, email, phone, city, state"
        query={query}
        onQueryChange={(value) => {
          setQuery(value);
          setPage(1);
        }}
        filteredCount={filteredCustomers.length}
        totalCount={customers.length}
      />

      {!filteredCustomers.length ? (
        <Card>
          <CardContent className="p-5 text-sm text-muted-foreground">
            No customers match your search.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-lg border md:block">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Contact</th>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCustomers.map((customer) => (
                  <CustomerRow key={customer.id} customer={customer} />
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 md:hidden">
            {paginatedCustomers.map((customer) => (
              <Card key={customer.id}>
                <CardContent className="p-4">
                  <div className="space-y-1">
                    <h2 className="font-medium">{customer.name}</h2>
                    <p className="text-sm text-muted-foreground">
                      {customer.contact_name || "No contact name"}
                    </p>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {[customer.city, customer.state].filter(Boolean).join(", ") ||
                      "Location not set"}
                  </p>
                  <div className="mt-4 flex gap-2">
                    <Link
                      href={`/customers/${customer.id}`}
                      className={buttonVariants({ size: "sm", variant: "outline" })}
                    >
                      View
                    </Link>
                    <Link
                      href={`/customers/${customer.id}/edit`}
                      className={buttonVariants({ size: "sm", variant: "outline" })}
                    >
                      Edit
                    </Link>
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

function CustomerRow({ customer }: { customer: Customer }) {
  return (
    <tr className="border-t">
      <td className="px-4 py-3">{customer.name}</td>
      <td className="px-4 py-3">
        <div>{customer.contact_name || "—"}</div>
        <div className="text-xs text-muted-foreground">
          {customer.email || customer.phone || "No email or phone"}
        </div>
      </td>
      <td className="px-4 py-3">
        {[customer.city, customer.state].filter(Boolean).join(", ") || "—"}
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-2">
          <Link
            href={`/customers/${customer.id}`}
            className={buttonVariants({ size: "sm", variant: "outline" })}
          >
            View
          </Link>
          <Link
            href={`/customers/${customer.id}/edit`}
            className={buttonVariants({ size: "sm", variant: "outline" })}
          >
            Edit
          </Link>
        </div>
      </td>
    </tr>
  );
}

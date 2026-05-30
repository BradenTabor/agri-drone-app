import Link from "next/link";

import { saveRecordFilterAction } from "@/app/(app)/records/filterActions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";

type RecordRow = {
  id: string;
  record_date: string;
  time_mixed: string;
  customer_name_snapshot: string | null;
  field_name_snapshot: string | null;
  signed_typed_name: string;
  total_mix_gal: number;
  expected_acres: number;
  actual_acres: number | null;
  wind_speed_mph: number;
  wind_direction: string;
  submitted_at: string;
};

type RecordsPageProps = {
  searchParams: Promise<{
    q?: string;
    dateFrom?: string;
    dateTo?: string;
    customerId?: string;
    applicatorId?: string;
    productId?: string;
    page?: string;
  }>;
};

type SavedFilterState = {
  q?: string;
  dateFrom?: string;
  dateTo?: string;
  customerId?: string;
  applicatorId?: string;
  productId?: string;
};

export default async function RecordsPage({ searchParams }: RecordsPageProps) {
  const filters = await searchParams;
  const pageSize = 10;
  const currentPage = Math.max(1, Number(filters.page ?? "1") || 1);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize - 1;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: customers }, { data: applicators }, { data: products }, { data: savedFilters }] =
    await Promise.all([
      supabase.from("customers").select("id,name").is("deleted_at", null).order("name", { ascending: true }),
      supabase.from("profiles").select("id,full_name,email").is("deleted_at", null).order("full_name", { ascending: true }),
      supabase.from("products").select("id,name").is("deleted_at", null).order("name", { ascending: true }),
      user
        ? supabase
            .from("saved_filters")
            .select("id,name,filters")
            .eq("user_id", user.id)
            .is("deleted_at", null)
            .order("updated_at", { ascending: false })
            .limit(8)
        : Promise.resolve({ data: [] }),
    ]);

  let filteredIds: string[] | null = null;
  if (filters.productId) {
    const { data: productRows } = await supabase
      .from("mix_record_products")
      .select("mix_record_id,mix_records!inner(id,deleted_at)")
      .eq("product_id", filters.productId)
      .is("deleted_at", null)
      .is("mix_records.deleted_at", null);
    filteredIds = [...new Set((productRows ?? []).map((row) => row.mix_record_id))];
  }

  let query = supabase
    .from("mix_records")
    .select(
      "id,record_date,time_mixed,customer_name_snapshot,field_name_snapshot,signed_typed_name,total_mix_gal,expected_acres,actual_acres,wind_speed_mph,wind_direction,submitted_at",
    )
    .is("deleted_at", null);
  let countQuery = supabase.from("mix_records").select("id", { count: "exact", head: true }).is("deleted_at", null);

  if (filters.q) {
    query = query.textSearch("search_vector", filters.q);
    countQuery = countQuery.textSearch("search_vector", filters.q);
  }
  if (filters.dateFrom) {
    query = query.gte("record_date", filters.dateFrom);
    countQuery = countQuery.gte("record_date", filters.dateFrom);
  }
  if (filters.dateTo) {
    query = query.lte("record_date", filters.dateTo);
    countQuery = countQuery.lte("record_date", filters.dateTo);
  }
  if (filters.customerId) {
    query = query.eq("customer_id", filters.customerId);
    countQuery = countQuery.eq("customer_id", filters.customerId);
  }
  if (filters.applicatorId) {
    query = query.eq("applicator_id", filters.applicatorId);
    countQuery = countQuery.eq("applicator_id", filters.applicatorId);
  }
  if (filteredIds) {
    query = filteredIds.length
      ? query.in("id", filteredIds)
      : query.eq("id", "00000000-0000-0000-0000-000000000000");
    countQuery = filteredIds.length
      ? countQuery.in("id", filteredIds)
      : countQuery.eq("id", "00000000-0000-0000-0000-000000000000");
  }

  const [{ data: records, error }, { count, error: countError }] = await Promise.all([
    query.order("record_date", { ascending: false }).order("submitted_at", { ascending: false }).range(startIndex, endIndex),
    countQuery,
  ]);

  if (error || countError) {
    throw new Error("Unable to load records.");
  }

  const typedRecords = (records ?? []) as RecordRow[];
  const totalCount = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mix Records</h1>
          <p className="text-sm text-muted-foreground">
            Review, search, and edit submitted records.
          </p>
        </div>
        <Link href="/records/new" className={buttonVariants()}>
          + New Mix Record
        </Link>
      </header>

      <Card>
        <CardContent className="p-4">
          <form method="get" className="grid gap-3 md:grid-cols-6">
            <Input
              name="q"
              placeholder="Search notes, customer, field..."
              defaultValue={filters.q ?? ""}
            />
            <Input name="dateFrom" type="date" defaultValue={filters.dateFrom ?? ""} />
            <Input name="dateTo" type="date" defaultValue={filters.dateTo ?? ""} />
            <Select name="customerId" defaultValue={filters.customerId ?? ""}>
              <option value="">All customers</option>
              {(customers ?? []).map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </Select>
            <Select name="applicatorId" defaultValue={filters.applicatorId ?? ""}>
              <option value="">All applicators</option>
              {(applicators ?? []).map((applicator) => (
                <option key={applicator.id} value={applicator.id}>
                  {applicator.full_name || applicator.email || applicator.id}
                </option>
              ))}
            </Select>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Select name="productId" defaultValue={filters.productId ?? ""} className="min-w-0 flex-1">
                <option value="">All products</option>
                {(products ?? []).map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </Select>
              <Button type="submit" variant="outline">
                Filter
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-3">
          <form action={saveRecordFilterAction} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="q" value={filters.q ?? ""} />
            <input type="hidden" name="dateFrom" value={filters.dateFrom ?? ""} />
            <input type="hidden" name="dateTo" value={filters.dateTo ?? ""} />
            <input type="hidden" name="customerId" value={filters.customerId ?? ""} />
            <input type="hidden" name="applicatorId" value={filters.applicatorId ?? ""} />
            <input type="hidden" name="productId" value={filters.productId ?? ""} />
            <Input
              name="savedFilterName"
              placeholder="Save current filter as..."
              className="w-full sm:w-64"
            />
            <Button type="submit" variant="outline" size="sm">
              Save filter
            </Button>
            {(savedFilters ?? []).map((savedFilter) => (
              <Link
                key={savedFilter.id}
                href={`/records${buildFilterHref((savedFilter.filters as SavedFilterState) ?? {})}`}
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                {savedFilter.name}
              </Link>
            ))}
          </form>
        </CardContent>
      </Card>

      {!typedRecords.length ? (
        <Card>
          <CardContent className="p-5 text-sm text-muted-foreground">
            No records yet. Create your first mix record to get started.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-lg border md:block">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Field</th>
                  <th className="px-4 py-3 font-medium">Applicator</th>
                  <th className="px-4 py-3 font-medium">Total mix</th>
                  <th className="px-4 py-3 font-medium">Acres</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {typedRecords.map((record) => (
                  <tr key={record.id} className="border-t">
                    <td className="px-4 py-3">
                      <div>{record.record_date}</div>
                      <div className="text-xs text-muted-foreground">{record.time_mixed}</div>
                    </td>
                    <td className="px-4 py-3">{record.customer_name_snapshot || "—"}</td>
                    <td className="px-4 py-3">{record.field_name_snapshot || "—"}</td>
                    <td className="px-4 py-3">{record.signed_typed_name}</td>
                    <td className="px-4 py-3">{record.total_mix_gal} gal</td>
                    <td className="px-4 py-3">
                      <div>Expected {record.expected_acres}</div>
                      <div className="text-xs text-muted-foreground">
                        Actual {record.actual_acres ?? "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Link
                          href={`/records/${record.id}`}
                          className={buttonVariants({ size: "sm", variant: "outline" })}
                        >
                          View
                        </Link>
                        <Link
                          href={`/records/${record.id}/edit`}
                          className={buttonVariants({ size: "sm", variant: "outline" })}
                        >
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 md:hidden">
            {typedRecords.map((record) => (
              <Card key={record.id}>
                <CardContent className="p-4">
                <div className="space-y-1">
                  <h2 className="font-medium">
                    {record.record_date} at {record.time_mixed}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {record.customer_name_snapshot || "—"} / {record.field_name_snapshot || "—"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {record.total_mix_gal} gal, expected {record.expected_acres} ac
                  </p>
                  <p className={cn("text-xs", "text-muted-foreground")}>
                    Wind {record.wind_speed_mph} mph {record.wind_direction}
                  </p>
                </div>
                <div className="mt-4 flex gap-2">
                  <Link href={`/records/${record.id}`} className={buttonVariants({ size: "sm", variant: "outline" })}>
                    View
                  </Link>
                  <Link href={`/records/${record.id}/edit`} className={buttonVariants({ size: "sm", variant: "outline" })}>
                    Edit
                  </Link>
                </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {totalPages > 1 ? (
            <Card>
              <CardContent className="flex items-center justify-between p-3">
                <p className="text-xs text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex gap-2">
                  {hasPrev ? (
                    <Link
                      href={buildFilterHref({ ...filters, page: String(Math.max(1, currentPage - 1)) })}
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                    >
                      Previous
                    </Link>
                  ) : (
                    <span className={buttonVariants({ variant: "outline", size: "sm", className: "pointer-events-none opacity-50" })}>
                      Previous
                    </span>
                  )}
                  {hasNext ? (
                    <Link
                      href={buildFilterHref({ ...filters, page: String(Math.min(totalPages, currentPage + 1)) })}
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                    >
                      Next
                    </Link>
                  ) : (
                    <span className={buttonVariants({ variant: "outline", size: "sm", className: "pointer-events-none opacity-50" })}>
                      Next
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : null}
        </>
      )}
    </section>
  );
}

function buildFilterHref(filters: SavedFilterState & { page?: string }): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (typeof value === "string" && value.trim()) {
      params.set(key, value);
    }
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}
